#!/usr/bin/env bash
# ==============================================================================
# Build & Package Script for YT Media Downloader Companion Server (Linux)
# ==============================================================================
set -e

VERSION="1.2.2"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${BASE_DIR}/dist"
BUILD_DIR="${BASE_DIR}/build"
RELEASE_DIR="${BASE_DIR}/.."

echo "===================================================================="
echo " Building YT Media Downloader Companion Server (Linux v${VERSION})"
echo "===================================================================="

# Check Python and PyInstaller
if ! command -v python3 &>/dev/null; then
    echo "❌ Error: python3 is not installed."
    exit 1
fi

if ! python3 -m pyinstaller --version &>/dev/null && ! command -v pyinstaller &>/dev/null; then
    echo "⚠️ PyInstaller not found. Installing via pip..."
    python3 -m pip install --user pyinstaller
fi

# Clean previous build artifacts
rm -rf "${DIST_DIR}" "${BUILD_DIR}"
mkdir -p "${DIST_DIR}" "${RELEASE_DIR}"

echo "🔨 Compiling standalone Linux binary with PyInstaller..."
python3 -m pyinstaller --onefile --clean \
    --name "YTDownloader" \
    --distpath "${DIST_DIR}" \
    --workpath "${BUILD_DIR}" \
    "${BASE_DIR}/ytdl_host.py"

echo "✅ Standalone binary created at: ${DIST_DIR}/YTDownloader"

# Create clean release package directory
PACKAGE_NAME="Setup_YT_Downloader-Linux-v${VERSION}"
STAGE_DIR="${RELEASE_DIR}/${PACKAGE_NAME}"
rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}/bin" "${STAGE_DIR}/systemd"

# Copy binary and scripts
cp "${DIST_DIR}/YTDownloader" "${STAGE_DIR}/bin/"
cp "${BASE_DIR}/install_linux.sh" "${STAGE_DIR}/install.sh"
cp "${BASE_DIR}/yt-downloader.service" "${STAGE_DIR}/systemd/"
chmod +x "${STAGE_DIR}/bin/YTDownloader" "${STAGE_DIR}/install.sh"

echo "📦 Creating release tarball: ${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz..."
cd "${RELEASE_DIR}"
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"
rm -rf "${STAGE_DIR}"

echo "===================================================================="
echo " 🎉 Build complete! Linux release ready at:"
echo "    ${RELEASE_DIR}/${PACKAGE_NAME}.tar.gz"
echo "===================================================================="
