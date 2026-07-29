#!/usr/bin/env bash
# ==============================================================================
# Installer for YT Media Downloader Companion Server (Linux)
# Installs standalone binary and registers systemd --user service
# ==============================================================================
set -e

INSTALL_BIN_DIR="${HOME}/.local/bin"
SYSTEMD_USER_DIR="${HOME}/.config/systemd/user"
SERVICE_NAME="yt-downloader.service"

echo "===================================================================="
echo " YT Media Downloader Companion Server Setup (Linux)"
echo "===================================================================="

if [ -f "${INSTALL_BIN_DIR}/YTDownloader" ] || [ -f "${SYSTEMD_USER_DIR}/${SERVICE_NAME}" ]; then
    echo " ℹ️  The server is already installed on your system."
    echo " 1) Repair / Update Server (Reinstall)"
    echo " 2) Verify & Start Server (Ignore installation)"
    echo " 3) Uninstall completely"
    echo ""
    read -p " Select an option [1-3]: " opt
    if [ "$opt" == "3" ]; then
        echo "🗑️ Uninstalling..."
        systemctl --user stop "${SERVICE_NAME}" 2>/dev/null || true
        systemctl --user disable "${SERVICE_NAME}" 2>/dev/null || true
        rm -f "${INSTALL_BIN_DIR}/YTDownloader"
        rm -f "${SYSTEMD_USER_DIR}/${SERVICE_NAME}"
        systemctl --user daemon-reload
        echo "✅ Uninstalled successfully."
        exit 0
    elif [ "$opt" == "2" ]; then
        echo "⚙️ Verifying and starting server..."
        systemctl --user start "${SERVICE_NAME}" 2>/dev/null || true
        systemctl --user status "${SERVICE_NAME}" --no-pager || true
        echo "✅ Verification complete."
        exit 0
    elif [ "$opt" == "1" ]; then
        echo "🔄 Proceeding with repair/reinstallation..."
    else
        echo "❌ Invalid option. Exiting."
        exit 1
    fi
    echo "===================================================================="
fi

# Ensure ~/.local/bin and systemd directory exist
mkdir -p "${INSTALL_BIN_DIR}" "${SYSTEMD_USER_DIR}"

# Security Cleanup: Remove legacy cookie files
rm -f "${HOME}/Downloads/YTMediaDownloader/.yt_cookies.txt" "${HOME}/Downloads/YTMediaDownloader/.yt_cookies_temp.txt" "${HOME}/Documents/YTDownloader/.yt_cookies.txt" "${HOME}/Documents/YTDownloader/cookies.txt" 2>/dev/null || true

# Determine path to binary
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PATH="${SCRIPT_DIR}/bin/YTDownloader"

if [ ! -f "${BIN_PATH}" ]; then
    # Fallback if running directly with ytdl_host.py
    if [ -f "${SCRIPT_DIR}/YTDownloader" ]; then
        BIN_PATH="${SCRIPT_DIR}/YTDownloader"
    elif [ -f "${SCRIPT_DIR}/ytdl_host.py" ]; then
        echo "🔨 Binary not prebuilt. Auto-compiling ytdl_host.py on Linux..."
        if ! command -v python3 &>/dev/null; then
            echo "❌ Error: python3 is required to compile ytdl_host.py."
            exit 1
        fi
        if ! python3 -m pyinstaller --version &>/dev/null && ! command -v pyinstaller &>/dev/null; then
            echo "📦 Installing pyinstaller via pip..."
            python3 -m pip install --user pyinstaller
        fi
        python3 -m pyinstaller --onefile --clean --name "YTDownloader" "${SCRIPT_DIR}/ytdl_host.py"
        if [ -f "${SCRIPT_DIR}/dist/YTDownloader" ]; then
            BIN_PATH="${SCRIPT_DIR}/dist/YTDownloader"
        else
            echo "❌ Error: Compilation failed."
            exit 1
        fi
    else
        echo "❌ Error: YTDownloader binary or ytdl_host.py not found."
        echo "Please make sure you extracted the full Linux archive."
        exit 1
    fi
fi

echo "📋 Copying binary to ${INSTALL_BIN_DIR}/YTDownloader..."
cp "${BIN_PATH}" "${INSTALL_BIN_DIR}/YTDownloader"
chmod +x "${INSTALL_BIN_DIR}/YTDownloader"

# Check for required system tools (ffmpeg, python3 if needed)
if ! command -v ffmpeg &>/dev/null; then
    echo "⚠️ Note: 'ffmpeg' was not found on your system PATH."
    echo "   For 1080p/4K merging and audio trimming, install it via your package manager:"
    echo "   - Ubuntu/Debian/Mint: sudo apt install ffmpeg"
    echo "   - Fedora/RHEL:        sudo dnf install ffmpeg"
    echo "   - Arch Linux:         sudo pacman -S ffmpeg"
fi

if ! command -v yt-dlp &>/dev/null; then
    echo "⚠️ Note: 'yt-dlp' was not found on your system PATH."
    echo "   We recommend installing or updating yt-dlp via pip:"
    echo "   python3 -m pip install --upgrade --user yt-dlp"
fi

# Create systemd user service file
SERVICE_FILE="${SYSTEMD_USER_DIR}/${SERVICE_NAME}"
echo "⚙️ Creating systemd user service at ${SERVICE_FILE}..."

cat <<EOF > "${SERVICE_FILE}"
[Unit]
Description=YT Media Downloader Companion Server (Port 19836)
After=network.target

[Service]
Type=simple
ExecStart=${INSTALL_BIN_DIR}/YTDownloader
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

# Reload systemd and enable/start service
echo "🚀 Enabling and starting background service..."
systemctl --user daemon-reload
systemctl --user enable "${SERVICE_NAME}"
systemctl --user restart "${SERVICE_NAME}"

echo "===================================================================="
echo " ✅ Installation successful!"
echo " 🌐 The companion server is now running on http://127.0.0.1:19836"
echo " 💡 Check service status at any time with:"
echo "    systemctl --user status ${SERVICE_NAME}"
echo "===================================================================="
