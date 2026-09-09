#!/usr/bin/env python3
"""
Graphic Asset Generator for Diagram & Image Lens Pro
Generates Chrome Web Store & Edge Add-ons promotional tiles and screenshots.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = '/System/Library/Fonts/Supplemental/Arial.ttf'

def get_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except:
        return ImageFont.load_default()

def draw_grid(draw, w, h, step=32, color=(56, 189, 248, 16)):
    for x in range(0, w, step):
        draw.line([(x, 0), (x, h)], fill=color, width=1)
    for y in range(0, h, step):
        draw.line([(0, y), (w, y)], fill=color, width=1)

# 1. SMALL PROMO TILE (440 x 280)
def create_small_promo():
    w, h = 440, 280
    img = Image.new('RGBA', (w, h), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)
    draw_grid(draw, w, h, 28, (56, 189, 248, 18))
    
    # Outer glow border
    draw.rounded_rectangle([4, 4, w-5, h-5], radius=16, outline=(56, 189, 248, 120), width=2)
    
    # Icon
    icon_path = os.path.join(OUT_DIR, '../assets/icon48.png')
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert('RGBA')
        icon = icon.resize((50, 50), Image.Resampling.LANCZOS)
        img.paste(icon, (30, 28), icon)
        
    f_title = get_font(19)
    f_badge = get_font(10)
    f_sub = get_font(12)
    f_pill = get_font(11)
    
    draw.text((92, 32), 'Diagram & Image Lens', font=f_title, fill=(248, 250, 252))
    # PRO pill
    draw.rounded_rectangle([320, 34, 360, 52], radius=4, fill=(56, 189, 248, 255))
    draw.text((327, 37), 'PRO', font=f_badge, fill=(11, 15, 25))
    
    draw.text((92, 58), 'Precision Magnifier & Screenshot Suite', font=f_sub, fill=(148, 163, 184))
    
    # Hero visual: Mockup diagram with magnifying loupe
    draw.rounded_rectangle([30, 96, 410, 206], radius=10, fill=(18, 26, 43, 220), outline=(148, 163, 184, 50))
    # Diagram nodes
    draw.line([(60, 150), (140, 130), (220, 160), (320, 135), (380, 155)], fill=(99, 102, 241, 160), width=2)
    for pt in [(60, 150), (140, 130), (220, 160), (320, 135), (380, 155)]:
        draw.ellipse([pt[0]-4, pt[1]-4, pt[0]+4, pt[1]+4], fill=(56, 189, 248, 200))
        
    # Magnifying Loupe placed over central node (220, 160)
    lx, ly, lr = 220, 150, 38
    draw.ellipse([lx-lr, ly-lr, lx+lr, ly+lr], fill=(15, 23, 42, 250), outline=(56, 189, 248, 255), width=3)
    draw.ellipse([lx-10, ly-10, lx+10, ly+10], fill=(56, 189, 248, 255))
    draw.line([(lx-lr, ly), (lx+lr, ly)], fill=(56, 189, 248, 80), width=1)
    draw.line([(lx, ly-lr), (lx, ly+lr)], fill=(56, 189, 248, 80), width=1)
    
    # 4x badge
    draw.rounded_rectangle([lx+14, ly+12, lx+34, ly+26], radius=4, fill=(56, 189, 248, 240))
    draw.text((lx+17, ly+14), '4x', font=f_badge, fill=(11, 15, 25))
    
    # Feature Pills
    pills = ['🔬 16x Loupe', '📐 Blueprint Zoom', '📋 Copy PNG', '✂️ Snip Tool']
    px = 30
    for p in pills:
        draw.rounded_rectangle([px, 222, px+86, 252], radius=6, fill=(30, 41, 59, 200), outline=(56, 189, 248, 60))
        draw.text((px+8, 229), p, font=f_pill, fill=(226, 232, 240))
        px += 96
        
    out_file = os.path.join(OUT_DIR, 'promo_tile_small_440x280.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (440x280)')

# 2. MARQUEE PROMO TILE (1400 x 560)
def create_marquee_promo():
    w, h = 1400, 560
    img = Image.new('RGBA', (w, h), (10, 15, 26, 255))
    draw = ImageDraw.Draw(img)
    draw_grid(draw, w, h, 40, (56, 189, 248, 16))
    
    # Subtle gradient glow in bottom-right
    draw.ellipse([800, 100, 1450, 700], fill=(56, 189, 248, 12))
    
    # Left Hero Branding
    icon_path = os.path.join(OUT_DIR, '../assets/icon128.png')
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert('RGBA')
        icon = icon.resize((96, 96), Image.Resampling.LANCZOS)
        img.paste(icon, (80, 70), icon)
        
    f_badge = get_font(13)
    draw.rounded_rectangle([196, 75, 340, 103], radius=6, fill=(56, 189, 248, 30), outline=(56, 189, 248, 100))
    draw.text((206, 81), 'CHROME & EDGE EXTENSION', font=f_badge, fill=(56, 189, 248))
    
    f_title = get_font(42)
    draw.text((196, 115), 'Diagram & Image Lens Pro', font=f_title, fill=(248, 250, 252))
    
    f_desc = get_font(20)
    draw.text((80, 195), 'The Ultimate Magnifier, Blueprint Deep-Zoom & Area Screenshot Suite', font=f_desc, fill=(148, 163, 184))
    
    # Value points
    points = [
        '🔬 Interactive Hover Loupe with 2x–16x Instant Zoom',
        '📐 Fullscreen Blueprint Lightbox with Invert Schematic Mode',
        '⚡ One-Click Copy to Clipboard as PNG & Vector SVG',
        '✂️ High-DPI Area Snipping Tool with Auto-Crop & Export'
    ]
    f_pt = get_font(17)
    py = 250
    for pt in points:
        draw.text((80, py), pt, font=f_pt, fill=(226, 232, 240))
        py += 40
        
    # Badges
    badges = [
        ('100% Client-Side', (16, 185, 129)),
        ('Manifest V3 Certified', (56, 189, 248)),
        ('Zero Tracking / No Remote Code', (139, 92, 246))
    ]
    bx = 80
    for text, col in badges:
        draw.rounded_rectangle([bx, 445, bx+200, 485], radius=8, fill=(18, 26, 43, 230), outline=col, width=1)
        draw.text((bx+15, 456), text, font=get_font(13), fill=col)
        bx += 215

    # Right Hero Mockup: Interactive Inspection Card
    mock_x, mock_y, mock_w, mock_h = 800, 80, 520, 390
    draw.rounded_rectangle([mock_x, mock_y, mock_x+mock_w, mock_y+mock_h], radius=16, fill=(15, 23, 42, 240), outline=(56, 189, 248, 120), width=2)
    
    # Browser / Window Header
    draw.rounded_rectangle([mock_x, mock_y, mock_x+mock_w, mock_y+42], radius=16, fill=(30, 41, 59, 200))
    draw.rectangle([mock_x, mock_y+24, mock_x+mock_w, mock_y+42], fill=(30, 41, 59, 200))
    for cx, col in [(mock_x+20, (244, 63, 94)), (mock_x+36, (245, 158, 11)), (mock_x+52, (16, 185, 129))]:
        draw.ellipse([cx-5, mock_y+16, cx+5, mock_y+26], fill=col)
    draw.text((mock_x+80, mock_y+14), 'architecture_system_v2.svg — Magnified 4x', font=get_font(12), fill=(148, 163, 184))

    # Inner diagram nodes
    dy = mock_y + 60
    draw.line([(mock_x+60, dy+80), (mock_x+180, dy+50), (mock_x+320, dy+120), (mock_x+440, dy+70)], fill=(99, 102, 241, 180), width=3)
    draw.line([(mock_x+180, dy+50), (mock_x+240, dy+210), (mock_x+380, dy+190)], fill=(56, 189, 248, 180), width=3)
    for n in [(mock_x+60, dy+80), (mock_x+180, dy+50), (mock_x+320, dy+120), (mock_x+440, dy+70), (mock_x+240, dy+210), (mock_x+380, dy+190)]:
        draw.rounded_rectangle([n[0]-24, n[1]-16, n[0]+24, n[1]+16], radius=6, fill=(30, 41, 59, 255), outline=(56, 189, 248, 160))
        draw.text((n[0]-16, n[1]-7), 'API', font=get_font(11), fill=(248, 250, 252))

    # Magnifier Loupe focused on central cluster
    cl_x, cl_y = mock_x + 240, dy + 150
    lr = 72
    draw.ellipse([cl_x-lr, cl_y-lr, cl_x+lr, cl_y+lr], fill=(11, 15, 25, 250), outline=(56, 189, 248, 255), width=4)
    # Crosshair
    draw.line([(cl_x-lr, cl_y), (cl_x+lr, cl_y)], fill=(56, 189, 248, 90), width=1)
    draw.line([(cl_x, cl_y-lr), (cl_x, cl_y+lr)], fill=(56, 189, 248, 90), width=1)
    # Central magnified element
    draw.rounded_rectangle([cl_x-36, cl_y-24, cl_x+36, cl_y+24], radius=8, fill=(56, 189, 248, 240))
    draw.text((cl_x-28, cl_y-9), 'DATABASE', font=get_font(10), fill=(11, 15, 25))
    # Badge
    draw.rounded_rectangle([cl_x+30, cl_y+30, cl_x+64, cl_y+54], radius=6, fill=(15, 23, 42, 250), outline=(56, 189, 248, 180))
    draw.text((cl_x+38, cl_y+35), '4x', font=get_font(13), fill=(56, 189, 248))

    # Floating Toolbar Pill over mock
    tb_x, tb_y = mock_x + 190, dy + 250
    draw.rounded_rectangle([tb_x, tb_y, tb_x+250, tb_y+40], radius=8, fill=(18, 26, 43, 240), outline=(148, 163, 184, 80))
    draw.text((tb_x+12, tb_y+12), '🔍 Deep Zoom   📋 Copy PNG   📸 Snap', font=get_font(11), fill=(248, 250, 252))

    out_file = os.path.join(OUT_DIR, 'promo_tile_marquee_1400x560.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (1400x560)')

# Helper for Screenshot Frame
def create_screenshot_base(title_text, subtitle_text):
    w, h = 1280, 800
    img = Image.new('RGBA', (w, h), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)
    draw_grid(draw, w, h, 32, (56, 189, 248, 14))

    # Top Hero Announcement Header
    draw.rectangle([0, 0, w, 70], fill=(15, 23, 42, 250))
    draw.line([(0, 70), (w, 70)], fill=(56, 189, 248, 100), width=1)
    
    draw.text((36, 16), title_text, font=get_font(21), fill=(248, 250, 252))
    draw.text((36, 44), subtitle_text, font=get_font(13), fill=(148, 163, 184))
    
    # Store branding on top right
    draw.rounded_rectangle([w-240, 18, w-36, 52], radius=6, fill=(30, 41, 59, 200), outline=(56, 189, 248, 80))
    draw.text((w-224, 27), 'Diagram & Image Lens Pro', font=get_font(12), fill=(56, 189, 248))

    # Browser Canvas Frame
    bx, by, bw, bh = 36, 92, w-72, h-120
    draw.rounded_rectangle([bx, by, bx+bw, by+bh], radius=14, fill=(18, 26, 43, 230), outline=(148, 163, 184, 50), width=1)
    
    # Window chrome bar
    draw.rounded_rectangle([bx, by, bx+bw, by+36], radius=14, fill=(30, 41, 59, 240))
    draw.rectangle([bx, by+20, bx+bw, by+36], fill=(30, 41, 59, 240))
    for cx, col in [(bx+18, (244, 63, 94)), (bx+34, (245, 158, 11)), (bx+50, (16, 185, 129))]:
        draw.ellipse([cx-4, by+14, cx+4, by+22], fill=col)
    
    # URL bar mockup
    draw.rounded_rectangle([bx+80, by+7, bx+bw-80, by+29], radius=6, fill=(15, 23, 42, 200))
    draw.text((bx+96, by+11), '🔒 https://docs.tech-specs.internal/architecture/system-blueprint.html', font=get_font(11), fill=(148, 163, 184))

    return img, draw, bx, by+36, bw, bh-36

# 3. SCREENSHOT 1: Hover Loupe (1280 x 800)
def create_screenshot_1():
    img, draw, cx, cy, cw, ch = create_screenshot_base(
        '🔬 Interactive Hover Loupe · 2x to 16x Instant Magnification',
        'Hover over any diagram, chart, or document figure to inspect intricate details with real-time cursor tracking'
    )
    
    # Diagram content inside browser
    # Header inside document
    draw.text((cx+40, cy+30), 'Cloud Microservices & High-Throughput Streaming Topology', font=get_font(20), fill=(248, 250, 252))
    draw.text((cx+40, cy+58), 'Figure 4.2: Real-time event streaming pipeline architecture (Mermaid SVG Vector Diagram)', font=get_font(12), fill=(148, 163, 184))

    # Complex network topology lines
    nodes = [
        ('Ingress Gateway', cx+120, cy+180),
        ('Kafka Cluster', cx+320, cy+150),
        ('Flink Processor', cx+520, cy+150),
        ('Redis Cache', cx+320, cy+280),
        ('PostgreSQL DB', cx+520, cy+280),
        ('ML Inference', cx+720, cy+150),
        ('Prometheus Ops', cx+720, cy+280),
        ('Grafana Dash', cx+920, cy+215)
    ]
    # Connect nodes
    connections = [(0, 1), (1, 2), (1, 3), (2, 4), (2, 5), (3, 4), (5, 6), (6, 7), (4, 6)]
    for a, b in connections:
        n1, n2 = nodes[a], nodes[b]
        draw.line([(n1[1], n1[2]), (n2[1], n2[2])], fill=(99, 102, 241, 140), width=2)

    for label, nx, ny in nodes:
        draw.rounded_rectangle([nx-55, ny-22, nx+55, ny+22], radius=8, fill=(30, 41, 59, 250), outline=(56, 189, 248, 120))
        draw.text((nx-45, ny-8), label, font=get_font(11), fill=(226, 232, 240))

    # Large Hover Loupe placed over Kafka & Flink cluster
    lx, ly = cx + 420, cy + 150
    lr = 95
    draw.ellipse([lx-lr, ly-lr, lx+lr, ly+lr], fill=(11, 15, 25, 250), outline=(56, 189, 248, 255), width=4)
    # Reticle crosshair
    draw.line([(lx-lr, ly), (lx+lr, ly)], fill=(56, 189, 248, 80), width=1)
    draw.line([(lx, ly-lr), (lx, ly+lr)], fill=(56, 189, 248, 80), width=1)
    
    # Zoomed element inside loupe
    draw.rounded_rectangle([lx-70, ly-30, lx+70, ly+30], radius=10, fill=(56, 189, 248, 230))
    draw.text((lx-58, ly-10), 'KAFKA BROKER #01', font=get_font(11), fill=(11, 15, 25))
    
    # Zoom badge
    draw.rounded_rectangle([lx+40, ly+40, lx+80, ly+68], radius=6, fill=(15, 23, 42, 255), outline=(56, 189, 248, 180))
    draw.text((lx+50, ly+48), '4x', font=get_font(14), fill=(56, 189, 248))

    # Floating Action Toolbar
    tbx, tby = cx + 800, cy + 100
    draw.rounded_rectangle([tbx, tby, tbx+280, tby+42], radius=10, fill=(15, 23, 42, 245), outline=(56, 189, 248, 160), width=1)
    draw.text((tbx+16, tby+14), '🔍 Deep Zoom    📋 Copy PNG    📸 Snap', font=get_font(12), fill=(248, 250, 252))

    # Bottom toast
    draw.rounded_rectangle([cx+cw-340, cy+ch-55, cx+cw-40, cy+ch-15], radius=8, fill=(18, 26, 43, 245), outline=(16, 185, 129, 180))
    draw.text((cx+cw-320, cy+ch-42), '✓ Magnifier Loupe Active · Press Z for Lightbox', font=get_font(11), fill=(16, 185, 129))

    out_file = os.path.join(OUT_DIR, 'screenshot_1_hover_loupe.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (1280x800)')

# 4. SCREENSHOT 2: Deep-Zoom Lightbox (1280 x 800)
def create_screenshot_2():
    img, draw, cx, cy, cw, ch = create_screenshot_base(
        '📐 Deep-Zoom Blueprint Lightbox · Smooth Pan, 1000% Zoom & Invert Schematics',
        'Fullscreen dark modal viewer with color inversion, rotation, contrast enhancements, and 1-click clipboard copy'
    )

    # Fullscreen Lightbox Overlay covering canvas
    draw.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=12, fill=(8, 12, 22, 250))
    draw_grid(draw, cw, ch, 28, (255, 255, 255, 12))

    # Modal Header Toolbar
    draw.rectangle([cx, cy, cx+cw, cy+52], fill=(15, 23, 42, 240))
    draw.line([(cx, cy+52), (cx+cw, cy+52)], fill=(148, 163, 184, 50), width=1)
    draw.text((cx+24, cy+18), '🔍 Diagram & Image Lens Pro', font=get_font(14), fill=(56, 189, 248))
    draw.text((cx+230, cy+19), '·  250%  ·  1920 × 1080 px  (Inverted Blueprint Schematic)', font=get_font(12), fill=(148, 163, 184))

    # Control strip pill in center
    ctrl_x = cx + 550
    draw.rounded_rectangle([ctrl_x, cy+10, ctrl_x+280, cy+42], radius=16, fill=(30, 41, 59, 240), outline=(148, 163, 184, 60))
    draw.text((ctrl_x+16, cy+17), '➖   250%   ➕   ↺ 90°   🪞 Flip   🌓 Invert', font=get_font(12), fill=(248, 250, 252))

    # Right modal buttons
    draw.rounded_rectangle([cx+cw-200, cy+11, cx+cw-100, cy+41], radius=6, fill=(56, 189, 248, 220))
    draw.text((cx+cw-185, cy+18), '📋 Copy PNG', font=get_font(12), fill=(11, 15, 25))
    draw.rounded_rectangle([cx+cw-85, cy+11, cx+cw-30, cy+41], radius=6, fill=(244, 63, 94, 40), outline=(244, 63, 94, 150))
    draw.text((cx+cw-66, cy+18), '✕', font=get_font(14), fill=(244, 63, 94))

    # Inverted engineering blueprint schematic in center
    bp_x, bp_y, bp_w, bp_h = cx+120, cy+80, cw-240, ch-150
    draw.rounded_rectangle([bp_x, bp_y, bp_x+bp_w, bp_y+bp_h], radius=10, fill=(15, 23, 42, 230), outline=(56, 189, 248, 150), width=2)
    # Inverted schematic lines
    for off in range(30, bp_w-30, 80):
        draw.line([(bp_x+off, bp_y+30), (bp_x+off, bp_y+bp_h-30)], fill=(56, 189, 248, 50), width=1)
    for off in range(30, bp_h-30, 60):
        draw.line([(bp_x+30, bp_y+off), (bp_x+bp_w-30, bp_y+off)], fill=(56, 189, 248, 50), width=1)
        
    draw.rectangle([bp_x+100, bp_y+80, bp_x+300, bp_y+240], outline=(56, 189, 248, 220), width=2)
    draw.text((bp_x+120, bp_y+150), 'HYDRAULIC PUMP CIRCUIT', font=get_font(13), fill=(56, 189, 248))
    
    draw.rectangle([bp_x+420, bp_y+100, bp_x+680, bp_y+280], outline=(16, 185, 129, 220), width=2)
    draw.text((bp_x+450, bp_y+180), 'PRESSURE TRANSDUCER ARRAY', font=get_font(13), fill=(16, 185, 129))

    # Bottom helper bar
    draw.rectangle([cx, cy+ch-36, cx+cw, cy+ch], fill=(15, 23, 42, 230))
    draw.text((cx+cw/2 - 250, cy+ch-24), 'Drag to Pan · Scroll to Zoom · R: Rotate · I: Invert · C: Copy PNG · Esc: Close', font=get_font(11), fill=(148, 163, 184))

    out_file = os.path.join(OUT_DIR, 'screenshot_2_blueprint_deepzoom.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (1280x800)')

# 5. SCREENSHOT 3: Area Snipping Tool (1280 x 800)
def create_screenshot_3():
    img, draw, cx, cy, cw, ch = create_screenshot_base(
        '✂️ Precision Area Snipping Tool · Capture Any Document or Diagram',
        'Interactive crosshair crop tool captures any portion of a webpage with automatic Retina/4K high-DPI scaling'
    )

    # Document text and diagrams
    draw.text((cx+50, cy+30), 'Section 7: Microarchitectural Specification & Instruction Pipeline', font=get_font(20), fill=(248, 250, 252))
    for i in range(5):
        draw.text((cx+50, cy+70 + i*24), 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.', font=get_font(12), fill=(148, 163, 184))

    # Technical diagram block
    draw.rounded_rectangle([cx+50, cy+200, cx+cw-50, cy+ch-50], radius=8, fill=(15, 23, 42, 220), outline=(148, 163, 184, 60))

    # Darkened snipping overlay
    draw.rectangle([cx, cy, cx+cw, cy+ch], fill=(0, 0, 0, 100))

    # Active Snip Crop Box
    sx, sy, sw, sh = cx+140, cy+160, 680, 360
    draw.rectangle([sx, sy, sx+sw, sy+sh], fill=(56, 189, 248, 20), outline=(56, 189, 248, 255), width=2)

    # Dimension pill
    draw.rounded_rectangle([sx, sy-28, sx+95, sy-4], radius=4, fill=(56, 189, 248, 255))
    draw.text((sx+8, sy-23), '680 × 360 px', font=get_font(11), fill=(11, 15, 25))

    # Content visible inside snip box (diagram)
    draw.rounded_rectangle([sx+40, sy+40, sx+240, sy+180], radius=8, fill=(30, 41, 59, 250), outline=(56, 189, 248, 180))
    draw.text((sx+60, sy+100), 'DECODE STAGE', font=get_font(13), fill=(56, 189, 248))

    draw.rounded_rectangle([sx+340, sy+40, sx+580, sy+180], radius=8, fill=(30, 41, 59, 250), outline=(16, 185, 129, 180))
    draw.text((sx+370, sy+100), 'EXECUTE PIPELINE', font=get_font(13), fill=(16, 185, 129))

    draw.line([(sx+240, sy+110), (sx+340, sy+110)], fill=(99, 102, 241, 255), width=3)

    # Post-Snip Action Bar
    ab_x, ab_y = sx+sw-320, sy+sh+12
    draw.rounded_rectangle([ab_x, ab_y, ab_x+320, ab_y+44], radius=10, fill=(18, 26, 43, 255), outline=(56, 189, 248, 180), width=1)
    draw.text((ab_x+16, ab_y+15), '📋 Copy PNG    ⬇️ Download    🔍 Deep Zoom    ✕', font=get_font(11), fill=(248, 250, 252))

    out_file = os.path.join(OUT_DIR, 'screenshot_3_area_snipping.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (1280x800)')

# 6. SCREENSHOT 4: Popup Dashboard & Gallery (1280 x 800)
def create_screenshot_4():
    img, draw, cx, cy, cw, ch = create_screenshot_base(
        '📊 Extension Popup Dashboard · Live Discovery Gallery & Settings',
        'Instantly view and open all diagrams, charts, and SVGs on the active webpage in the Deep-Zoom Lightbox'
    )

    # Main page background content
    draw.text((cx+50, cy+30), 'Machine Learning Neural Model Visualizer', font=get_font(22), fill=(248, 250, 252))
    draw.rounded_rectangle([cx+50, cy+80, cx+600, cy+ch-40], radius=12, fill=(15, 23, 42, 200), outline=(148, 163, 184, 50))
    draw.text((cx+80, cy+110), 'Active Session: ResNet-50 Layer Activation Tensor Plots', font=get_font(13), fill=(148, 163, 184))

    # Extension Popup Dropdown on Right Side
    px, py, pw, ph = cx+cw-420, cy+10, 380, ch-20
    draw.rounded_rectangle([px, py, px+pw, py+ph], radius=14, fill=(11, 15, 25, 255), outline=(56, 189, 248, 140), width=2)

    # Popup Header
    draw.text((px+20, py+18), 'Diagram Lens', font=get_font(16), fill=(248, 250, 252))
    draw.rounded_rectangle([px+120, py+20, px+155, py+36], radius=4, fill=(56, 189, 248, 255))
    draw.text((px+126, py+22), 'PRO', font=get_font(10), fill=(11, 15, 25))
    draw.text((px+20, py+40), 'Image & Vector Magnifier', font=get_font(11), fill=(148, 163, 184))
    
    # Toggle switch mockup
    draw.rounded_rectangle([px+pw-60, py+22, px+pw-20, py+42], radius=10, fill=(56, 189, 248, 240))
    draw.ellipse([px+pw-38, py+24, px+pw-22, py+40], fill=(255, 255, 255, 255))

    # Snip Area Button
    draw.rounded_rectangle([px+20, py+68, px+pw-20, py+110], radius=10, fill=(56, 189, 248, 40), outline=(56, 189, 248, 160))
    draw.text((px+36, py+82), '✂️ Snip Area Screenshot', font=get_font(13), fill=(248, 250, 252))
    draw.rounded_rectangle([px+pw-110, py+78, px+pw-30, py+100], radius=4, fill=(0, 0, 0, 100))
    draw.text((px+pw-104, py+83), 'Cmd+Shift+S', font=get_font(9), fill=(56, 189, 248))

    # Settings card
    sc_y = py + 124
    draw.rounded_rectangle([px+20, sc_y, px+pw-20, sc_y+130], radius=10, fill=(18, 26, 43, 240), outline=(148, 163, 184, 50))
    draw.text((px+34, sc_y+14), 'Zoom Power: 4x', font=get_font(12), fill=(148, 163, 184))
    # Zoom buttons
    draw.rounded_rectangle([px+34, sc_y+36, px+pw-34, sc_y+64], radius=6, fill=(0, 0, 0, 120))
    draw.text((px+56, sc_y+43), '2x       3x       4x       8x', font=get_font(12), fill=(248, 250, 252))

    draw.text((px+34, sc_y+78), 'Shape & Size: Circle (M)', font=get_font(12), fill=(148, 163, 184))
    draw.text((px+34, sc_y+102), 'Hover Quick Toolbar: Active', font=get_font(12), fill=(56, 189, 248))

    # Scanned Assets Gallery Section
    gal_y = sc_y + 144
    draw.text((px+20, gal_y), 'PAGE DIAGRAMS & ASSETS', font=get_font(11), fill=(148, 163, 184))
    draw.rounded_rectangle([px+190, gal_y-3, px+245, gal_y+15], radius=8, fill=(56, 189, 248, 40))
    draw.text((px+196, gal_y), '6 Found', font=get_font(10), fill=(56, 189, 248))

    # Thumbnail Grid
    grid_y = gal_y + 24
    for r in range(2):
        for c in range(3):
            tx = px + 20 + c * 115
            ty = grid_y + r * 82
            draw.rounded_rectangle([tx, ty, tx+108, ty+74], radius=8, fill=(0, 0, 0, 140), outline=(56, 189, 248, 80))
            # inner mock icon
            draw.text((tx+32, ty+24), '📊', font=get_font(18), fill=(56, 189, 248))
            draw.rounded_rectangle([tx+4, ty+4, tx+32, ty+16], radius=3, fill=(15, 23, 42, 200))
            draw.text((tx+6, ty+5), 'SVG', font=get_font(8), fill=(56, 189, 248))
            draw.text((tx+50, ty+56), '1280x720', font=get_font(8), fill=(148, 163, 184))

    out_file = os.path.join(OUT_DIR, 'screenshot_4_popup_dashboard.png')
    img.save(out_file)
    print(f'✅ Created {out_file} (1280x800)')

if __name__ == '__main__':
    create_small_promo()
    create_marquee_promo()
    create_screenshot_1()
    create_screenshot_2()
    create_screenshot_3()
    create_screenshot_4()
    print('🎉 All store graphics successfully generated!')
