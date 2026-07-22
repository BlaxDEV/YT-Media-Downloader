#!/usr/bin/env python3
"""
Generate simple PNG icons for the YT Downloader extension.
Run this script to create icon16.png, icon48.png, icon128.png
in the extension/icons/ directory.

Requires: pip install Pillow
"""

import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not installed. Installing...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image, ImageDraw


def create_icon(size, output_path):
    """Create a simple red download arrow icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle
    margin = max(1, size // 8)
    draw.ellipse(
        [margin, margin, size - margin - 1, size - margin - 1],
        fill=(255, 68, 68, 255)
    )

    # Download arrow
    cx = size / 2
    cy = size / 2
    s = size / 24  # scale factor

    # Arrow shaft
    shaft_w = max(2, int(3 * s))
    shaft_top = int(5 * s)
    shaft_bot = int(14 * s)
    draw.rectangle(
        [cx - shaft_w / 2, shaft_top, cx + shaft_w / 2, shaft_bot],
        fill=(255, 255, 255, 255)
    )

    # Arrow head
    head_top = int(11 * s)
    head_bot = int(16 * s)
    head_half = int(5 * s)
    draw.polygon(
        [(cx, head_bot), (cx - head_half, head_top), (cx + head_half, head_top)],
        fill=(255, 255, 255, 255)
    )

    # Bottom bar
    bar_h = max(1, int(2 * s))
    bar_y = int(17 * s)
    bar_half = int(4 * s)
    draw.rectangle(
        [cx - bar_half, bar_y, cx + bar_half, bar_y + bar_h],
        fill=(255, 255, 255, 255)
    )

    img.save(output_path, "PNG")
    print(f"Created {output_path} ({size}x{size})")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, "extension", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    create_icon(16, os.path.join(icons_dir, "icon16.png"))
    create_icon(48, os.path.join(icons_dir, "icon48.png"))
    create_icon(128, os.path.join(icons_dir, "icon128.png"))

    print("\nIcons generated successfully!")
