@echo off
REM Build launcher executable using PyInstaller

echo Building LIMS Launcher...
echo.

REM Install PyInstaller if not already installed
pip install pyinstaller

REM Build the executable
pyinstaller --onefile --windowed --name "LIMS_Launcher" launcher.py

echo.
echo Build complete!
echo Executable is in: dist\LIMS_Launcher.exe
echo.
echo Instructions:
echo 1. Copy dist\LIMS_Launcher.exe to client PCs
echo 2. Copy launcher_config.ini next to the exe
echo 3. Edit launcher_config.ini to set the server URL
echo.
pause
