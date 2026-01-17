# LIMS Launcher

Simple executable launcher for accessing the LIMS from client PCs.

## What It Does

The launcher is a small Windows executable that:
- Reads the server URL from a configuration file
- Opens the user's default browser to the LIMS application
- Requires no backend installation on client PCs

## Building the Launcher

### Prerequisites
- Python 3.10+
- PyInstaller

### Build Steps

1. Navigate to launcher directory:
```powershell
cd D:\CAAD_Soft\ReyChemAna\launcher
```

2. Run the build script:
```powershell
.\build_launcher.bat
```

This will create `LIMS_Launcher.exe` in the `dist/` folder.

## Distributing to Client PCs

1. Copy these files to each client PC:
   - `LIMS_Launcher.exe`
   - `launcher_config.ini`

2. Edit `launcher_config.ini` on each client to point to the server:
```ini
[Server]
url = http://192.168.1.100:8000
```

Replace `192.168.1.100` with your server's actual IP address.

3. Double-click `LIMS_Launcher.exe` to open LIMS in the browser.

## Optional: Create Desktop Shortcut

Right-click `LIMS_Launcher.exe` → Send to → Desktop (create shortcut)

## Notes

- The launcher does NOT install or run the backend
- Backend must be running on the server PC
- All client PCs must be on the same network as the server
- Clients just need a web browser (Chrome, Edge, Firefox)

## Troubleshooting

### "Can't connect to server"
- Verify server is running
- Check server URL in `launcher_config.ini`
- Verify firewall allows port 8000
- Ping server IP from client PC

### "Windows protected your PC"
- Click "More info" → "Run anyway"
- This happens because the exe is not digitally signed
- You can sign the exe in a production environment

## Alternative: No Launcher Needed

Users can also simply bookmark the URL in their browser:
- `http://server-ip:8000`

The launcher just provides a convenient desktop shortcut.
