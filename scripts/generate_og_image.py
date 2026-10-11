#!/usr/bin/env python3
"""
scripts/generate_og_image.py
Generates an ultra-premium 1200x630 OpenGraph / Social Preview Card for Abhijeet Raut
integrating his official profile photo, title, headline, and brief intro from his CV.
"""

import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
PORTFOLIO_DIR = REPO_ROOT / "apps" / "jamstack-frontend"
ASSETS_DIR = PORTFOLIO_DIR / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

PROFILE_SRC = ASSETS_DIR / "profile-photo.png"
OUTPUT_OG = ASSETS_DIR / "og-image.png"

def create_og_image():
    W, H = 1200, 630
    # 1. Base dark obsidian/navy background
    base = Image.new("RGBA", (W, H), (7, 11, 22, 255))
    draw = ImageDraw.Draw(base)

    # Gradient background
    for y in range(H):
        r_ratio = y / H
        r = int(6 * (1 - r_ratio) + 12 * r_ratio)
        g = int(10 * (1 - r_ratio) + 18 * r_ratio)
        b = int(20 * (1 - r_ratio) + 36 * r_ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 2. Ambient Colorful Glow Blooms
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    # Cyan neon orb around avatar
    gdraw.ellipse([20, 100, 480, 560], fill=(0, 245, 255, 38))
    # Purple/violet bloom top right
    gdraw.ellipse([700, -80, 1260, 480], fill=(139, 92, 246, 32))
    # Emerald accent bottom right
    gdraw.ellipse([650, 400, 1150, 700], fill=(16, 185, 129, 25))
    glow = glow.filter(ImageFilter.GaussianBlur(75))
    base = Image.alpha_composite(base, glow)

    # 3. Micro Tech Grid Pattern (Very subtle, 2% opacity)
    grid_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_layer)
    for x in range(0, W, 48):
        grid_draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 7), width=1)
    for y in range(0, H, 48):
        grid_draw.line([(0, y), (W, y)], fill=(255, 255, 255, 7), width=1)
    # Subtle dot intersections
    for x in range(0, W, 96):
        for y in range(0, H, 96):
            grid_draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(0, 245, 255, 40))
    base = Image.alpha_composite(base, grid_layer)

    # 4. Right Side Glassmorphic Card Container
    card_x, card_y, card_w, card_h = 440, 45, 715, 540
    card_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_layer)
    card_draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=24,
        fill=(13, 20, 36, 215),
        outline=(0, 245, 255, 75),
        width=1
    )
    base = Image.alpha_composite(base, card_layer)
    draw = ImageDraw.Draw(base)

    # 5. Load Clean System Fonts
    font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    font_regular = "/System/Library/Fonts/Helvetica.ttc"

    f_badge = ImageFont.truetype(font_bold, 13)
    f_name = ImageFont.truetype(font_bold, 46)
    f_title = ImageFont.truetype(font_bold, 23)
    f_exp = ImageFont.truetype(font_bold, 17)
    f_desc = ImageFont.truetype(font_regular, 17)
    f_desc_bold = ImageFont.truetype(font_bold, 17)
    f_tag = ImageFont.truetype(font_bold, 13)
    f_meta = ImageFont.truetype(font_regular, 15)

    # 6. Profile Avatar on Left
    avatar_size = 310
    avatar_x, avatar_y = 75, 160

    if PROFILE_SRC.exists():
        raw_avatar = Image.open(PROFILE_SRC).convert("RGBA")
        raw_avatar = raw_avatar.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)

        # Smooth anti-aliased circular mask
        mask = Image.new("L", (avatar_size * 2, avatar_size * 2), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, avatar_size * 2, avatar_size * 2], fill=255)
        mask = mask.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)

        # Multi-layer outer glowing rings
        ring_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(ring_layer)
        # Outer soft cyan bloom
        rdraw.ellipse(
            [avatar_x - 14, avatar_y - 14, avatar_x + avatar_size + 14, avatar_y + avatar_size + 14],
            outline=(0, 245, 255, 60),
            width=8
        )
        # Inner sharp cyan ring
        rdraw.ellipse(
            [avatar_x - 6, avatar_y - 6, avatar_x + avatar_size + 6, avatar_y + avatar_size + 6],
            outline=(0, 245, 255, 220),
            width=3
        )
        base = Image.alpha_composite(base, ring_layer)

        # Paste circular avatar
        base.paste(raw_avatar, (avatar_x, avatar_y), mask)

        # Active Status Indicator (bottom-right edge of avatar)
        draw = ImageDraw.Draw(base)
        st_x = avatar_x + avatar_size - 44
        st_y = avatar_y + avatar_size - 44
        draw.ellipse([st_x - 3, st_y - 3, st_x + 35, st_y + 35], fill=(7, 11, 22, 255))
        draw.ellipse([st_x, st_y, st_x + 32, st_y + 32], fill=(16, 185, 129, 255))
        draw.ellipse([st_x + 7, st_y + 7, st_x + 25, st_y + 25], fill=(52, 211, 153, 255))

    # 7. Left Column Caption Under Avatar
    left_meta_y = avatar_y + avatar_size + 24
    draw.text((avatar_x + 22, left_meta_y), "SOLUTIONS ARCHITECT", font=f_badge, fill=(0, 245, 255, 230))
    draw.text((avatar_x + 26, left_meta_y + 22), "PUNE, INDIA • VERIFIED", font=f_meta, fill=(148, 163, 184, 200))

    # 8. Content Inside Right Glassmorphic Card
    cur_x = card_x + 40
    cur_y = card_y + 36

    # Top Pill Badge
    badge_label = "12 YEARS INDUSTRY EXPERIENCE • LEAD SOLUTIONS ARCHITECT"
    b_bbox = draw.textbbox((cur_x + 14, cur_y + 4), badge_label, font=f_badge)
    b_w = b_bbox[2] - cur_x + 14
    b_h = 28
    draw.rounded_rectangle([cur_x, cur_y, cur_x + b_w, cur_y + b_h], radius=14, fill=(15, 23, 42, 240), outline=(0, 245, 255, 150), width=1)
    draw.text((cur_x + 14, cur_y + 6), badge_label, font=f_badge, fill=(0, 245, 255, 255))

    # Name: Abhijeet Raut
    cur_y += 44
    draw.text((cur_x, cur_y), "Abhijeet Raut", font=f_name, fill=(255, 255, 255, 255))

    # Title & Headline from CV
    cur_y += 58
    draw.text((cur_x, cur_y), "Lead Backend & AI/ML Engineer | Solutions Architect", font=f_title, fill=(56, 189, 248, 255))

    # Career Highlights from CV
    cur_y += 38
    draw.text((cur_x, cur_y), "Persistent Systems (3 Yrs)  •  Cybage Software (9 Yrs)", font=f_exp, fill=(192, 132, 252, 255))

    # Brief Intro Paragraphs from CV
    cur_y += 34
    draw.text((cur_x, cur_y), "Accomplished Lead Software Engineer architecting high-concurrency backend", font=f_desc, fill=(226, 232, 240, 255))
    cur_y += 24
    draw.text((cur_x, cur_y), "services, distributed systems, and modern AI/ML solutions at enterprise scale.", font=f_desc, fill=(226, 232, 240, 255))
    cur_y += 24
    draw.text((cur_x, cur_y), "Autonomous AI Multi-Agent Swarms (Google ADK) • Vector RAG • E2EE Cloud", font=f_desc, fill=(148, 163, 184, 255))

    # Technical Arsenal Badges
    cur_y += 38
    tech_skills = ["Python (Expert)", "FastAPI", "Django", "Go", "Agentic AI", "Vector RAG", "Docker", "DevOps"]
    tag_x = cur_x
    for skill in tech_skills:
        s_bbox = draw.textbbox((0, 0), skill, font=f_tag)
        sw = s_bbox[2] - s_bbox[0] + 18
        sh = 26
        draw.rounded_rectangle([tag_x, cur_y, tag_x + sw, cur_y + sh], radius=6, fill=(17, 28, 48, 240), outline=(51, 65, 85, 220), width=1)
        draw.text((tag_x + 9, cur_y + 5), skill, font=f_tag, fill=(148, 163, 184, 255))
        tag_x += sw + 8

    # Bottom Divider
    cur_y += 46
    draw.line([(cur_x, cur_y), (card_x + card_w - 40, cur_y)], fill=(51, 65, 85, 140), width=1)

    # Footer Metadata & Coordinates
    cur_y += 18
    f_items = [
        ("REPO", "github.com/arauthub/portfolio"),
        ("SITE", "arauthub.github.io/portfolio"),
        ("AUDIT", "5/5 Presubmit Verified")
    ]
    f_x = cur_x
    for k, v in f_items:
        draw.text((f_x, cur_y), f"[{k}]", font=f_badge, fill=(0, 245, 255, 230))
        kb = draw.textbbox((f_x, cur_y), f"[{k}]", font=f_badge)
        f_x = kb[2] + 8
        draw.text((f_x, cur_y), v, font=f_meta, fill=(203, 213, 225, 255))
        vb = draw.textbbox((f_x, cur_y), v, font=f_meta)
        f_x = vb[2] + 28

    # Save final optimized PNG
    base.save(OUTPUT_OG, "PNG", optimize=True)
    print(f"🎉 Generated 1200x630 Social Preview Card: {OUTPUT_OG}")

if __name__ == "__main__":
    create_og_image()
