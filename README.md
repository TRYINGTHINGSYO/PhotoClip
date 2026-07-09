# 📋 Photo Clip — iPhone → PC Clipboard

Send a photo from your iPhone directly to your PC clipboard. Then just Ctrl+V to paste it anywhere — Claude, Photoshop, Discord, anywhere.

---

## ⚡ Setup (one time)

### 1. Install Node.js on your PC
Download from https://nodejs.org (LTS version)

### 2. Put this folder somewhere on your PC
Example: `C:\Users\YourName\Desktop\photo-clip`

### 3. Double-click `START.bat`
A console window opens and shows your local IP address, like:
```
✅ Running at http://192.168.1.45:3456

📱 On your iPhone, open Safari and go to:
   http://192.168.1.45:3456
```

### 4. On your iPhone
- Make sure you're on the **same WiFi** as your PC
- Open **Safari** and type in the URL shown in the console
- Tap **Share → Add to Home Screen** to make it a one-tap shortcut

---

## 📱 How to use it

1. Tap the app icon on your iPhone home screen
2. Tap **"Open Camera directly"** to take a new photo, or tap the upload area to pick one from your library
3. Hit **"Send to Clipboard"**
4. On your PC, just **Ctrl+V** to paste the image anywhere

---

## 🔧 Troubleshooting

**"Can't connect" on iPhone**
- Make sure your iPhone and PC are on the same WiFi network
- Check Windows Firewall — allow Node.js through, or allow port 3456

**Allow port through Windows Firewall (run as Admin):**
```
netsh advfirewall firewall add rule name="PhotoClip" dir=in action=allow protocol=TCP localport=3456
```

**Clipboard copy failed**
- Make sure you're running Windows (PowerShell is required for clipboard access)
- Run `START.bat` normally (not as Administrator)

---

## 📁 Files

- `server.js` — the server
- `START.bat` — double-click to run
- `package.json` — dependencies (express, multer)
