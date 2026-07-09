const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync, exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 3456;

// Save uploads to a temp folder
const uploadDir = path.join(os.tmpdir(), 'photo-clip-uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Serve the upload page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Photo to PC Clipboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 20px;
      padding: 32px 24px;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h1 { font-size: 22px; margin-bottom: 6px; color: #fff; }
    p { font-size: 14px; color: #888; margin-bottom: 28px; }
    .upload-area {
      border: 2px dashed #444;
      border-radius: 14px;
      padding: 28px 16px;
      margin-bottom: 20px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .upload-area:hover { border-color: #f97316; }
    .upload-area input { display: none; }
    .upload-icon { font-size: 48px; margin-bottom: 10px; }
    .upload-label { font-size: 15px; color: #aaa; }
    .upload-label span { color: #f97316; font-weight: 600; }
    #preview {
      display: none;
      width: 100%;
      max-height: 220px;
      object-fit: contain;
      border-radius: 10px;
      margin-bottom: 16px;
      border: 1px solid #333;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      border: none;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
      letter-spacing: 0.5px;
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: #f97316; color: #fff; }
    .btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .status {
      margin-top: 16px;
      font-size: 14px;
      min-height: 20px;
      font-weight: 600;
    }
    .status.ok { color: #22c55e; }
    .status.err { color: #ef4444; }
    .status.loading { color: #f97316; }
    .camera-btn {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 20px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      font-size: 13px;
      color: #94a3b8;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>📋 Photo to Clipboard</h1>
    <p>Send a photo to your PC clipboard instantly</p>

    <div class="upload-area" onclick="document.getElementById('fileInput').click()">
      <div class="upload-icon">🖼️</div>
      <div class="upload-label">Tap to pick a photo<br><span>or take one now</span></div>
      <input type="file" id="fileInput" accept="image/*"/>
    </div>

    <label class="camera-btn" for="cameraInput">📷 Open Camera directly</label>
    <input type="file" id="cameraInput" accept="image/*" capture="environment" style="display:none"/>

    <img id="preview" alt="preview"/>

    <button class="btn btn-primary" id="sendBtn" disabled>Send to Clipboard</button>
    <div class="status" id="status"></div>
  </div>

  <script>
    let selectedFile = null;

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('preview');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
      document.getElementById('sendBtn').disabled = false;
      document.getElementById('status').textContent = '';
      document.getElementById('status').className = 'status';
    }

    document.getElementById('fileInput').addEventListener('change', e => handleFile(e.target.files[0]));
    document.getElementById('cameraInput').addEventListener('change', e => handleFile(e.target.files[0]));

    document.getElementById('sendBtn').addEventListener('click', async () => {
      if (!selectedFile) return;
      const btn = document.getElementById('sendBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      status.textContent = 'Sending...';
      status.className = 'status loading';

      const formData = new FormData();
      formData.append('photo', selectedFile);

      try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.ok) {
          status.textContent = '✅ Copied to clipboard! Ready to paste.';
          status.className = 'status ok';
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err) {
        status.textContent = '❌ ' + err.message;
        status.className = 'status err';
      }
      btn.disabled = false;
    });
  </script>
</body>
</html>`);
});

// Handle upload + copy to clipboard
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.json({ ok: false, error: 'No file received' });

  const filePath = req.file.path;
  console.log(`[photo-clip] Received: ${req.file.originalname} (${Math.round(req.file.size / 1024)}KB) → ${filePath}`);

  // Copy image to Windows clipboard using PowerShell
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms;
    $img = [System.Drawing.Image]::FromFile('${filePath.replace(/\\/g, '\\\\')}');
    [System.Windows.Forms.Clipboard]::SetImage($img);
    $img.Dispose();
  `.trim();

  exec(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('[photo-clip] Clipboard error:', stderr || err.message);
      return res.json({ ok: false, error: 'Clipboard copy failed: ' + (stderr || err.message) });
    }
    console.log('[photo-clip] ✅ Copied to clipboard!');
    res.json({ ok: true });
  });
});

// Get local IP for display
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        📋 Photo Clip Server            ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✅ Running at http://${ip}:${PORT}`);
  console.log(`\n📱 On your iPhone, open Safari and go to:`);
  console.log(`   http://${ip}:${PORT}`);
  console.log(`\n💡 Add it to your Home Screen for one-tap access`);
  console.log('─────────────────────────────────────────\n');
});
