$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BaseDir = Split-Path -Parent $ScriptDir

Write-Host "===================================================================="
Write-Host " Building YT Media Downloader Companion Server (Windows)"
Write-Host "===================================================================="

Write-Host "1. Compiling standalone Windows binary with PyInstaller..."
Set-Location $BaseDir
python -m PyInstaller --onefile --clean --noconsole --name "YTDownloader" --distpath "native-host" --icon "icon.ico" --version-file "scripts\version_info.txt" "YT-Downloader-Extension\linux-host\ytdl_host.py"

Write-Host "2. Packaging with Inno Setup..."
# Look for Inno Setup in common locations
$InnoSetupPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $InnoSetupPath)) {
    $InnoSetupPath = "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
}
if (-not (Test-Path $InnoSetupPath)) {
    $InnoSetupPath = "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
}

if (-not (Test-Path $InnoSetupPath)) {
    Write-Error "Inno Setup compiler (ISCC.exe) not found. Please install Inno Setup 6."
    exit 1
}

& $InnoSetupPath "scripts\installer.iss"

Write-Host "===================================================================="
Write-Host " Build complete! Windows release ready at:"
Write-Host " Output\Setup_YT_Downloader-Win-v1.2.1.exe"
Write-Host "===================================================================="
