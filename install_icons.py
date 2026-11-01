import os
import glob
from PIL import Image, ImageDraw

APPS = [
    {
        "name": "mobile-engineer",
        "logo": "assets/branding_preview/logo-engineer.png",
        "bg_hex": "#0A1020",
        "bg_rgb": (10, 16, 32),
        "title": "QazGost Engineer"
    },
    {
        "name": "mobile-executor",
        "logo": "assets/branding_preview/logo-executor.png",
        "bg_hex": "#041216",
        "bg_rgb": (4, 18, 22),
        "title": "QazGost Исполнитель"
    },
    {
        "name": "mobile-manager",
        "logo": "assets/branding_preview/logo-manager.png",
        "bg_hex": "#050A1A",
        "bg_rgb": (5, 10, 26),
        "title": "QazGost CRM"
    }
]

DENSITIES = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432)
}

def make_circle_mask(size):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    return mask

def process_app(app_info):
    app_dir = app_info["name"]
    logo_path = app_info["logo"]
    bg_hex = app_info["bg_hex"]
    bg_rgb = app_info["bg_rgb"]
    
    print(f"=== Processing {app_dir} ===")
    
    if not os.path.exists(logo_path):
        print(f"ERROR: Logo not found at {logo_path}")
        return
        
    master_logo = Image.open(logo_path).convert("RGBA")
    
    # 1. Update ic_launcher_background.xml
    values_dir = os.path.join(app_dir, "android", "app", "src", "main", "res", "values")
    os.makedirs(values_dir, exist_ok=True)
    bg_xml_path = os.path.join(values_dir, "ic_launcher_background.xml")
    with open(bg_xml_path, "w", encoding="utf-8") as f:
        f.write(f'''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">{bg_hex}</color>
</resources>
''')
    print(f"Updated {bg_xml_path} -> {bg_hex}")

    # 2. Update mipmap icons for each density
    res_dir = os.path.join(app_dir, "android", "app", "src", "main", "res")
    for density, (icon_sz, fg_sz) in DENSITIES.items():
        density_dir = os.path.join(res_dir, f"mipmap-{density}")
        os.makedirs(density_dir, exist_ok=True)
        
        # A. ic_launcher.png (Legacy launcher icon)
        launcher_img = master_logo.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
        launcher_path = os.path.join(density_dir, "ic_launcher.png")
        launcher_img.save(launcher_path, format="PNG")
        
        # B. ic_launcher_round.png (Legacy round icon)
        round_img = Image.new("RGBA", (icon_sz, icon_sz), (0, 0, 0, 0))
        round_mask = make_circle_mask((icon_sz, icon_sz))
        round_img.paste(launcher_img, (0, 0), round_mask)
        round_path = os.path.join(density_dir, "ic_launcher_round.png")
        round_img.save(round_path, format="PNG")
        
        # C. ic_launcher_foreground.png (Adaptive icon layer)
        # 108dp canvas with safe zone in center (72dp -> 66.6%)
        fg_canvas = Image.new("RGBA", (fg_sz, fg_sz), (0, 0, 0, 0))
        safe_logo_sz = int(fg_sz * 0.72)
        scaled_logo = master_logo.resize((safe_logo_sz, safe_logo_sz), Image.Resampling.LANCZOS)
        offset = (fg_sz - safe_logo_sz) // 2
        fg_canvas.paste(scaled_logo, (offset, offset), scaled_logo)
        fg_path = os.path.join(density_dir, "ic_launcher_foreground.png")
        fg_canvas.save(fg_path, format="PNG")
        
    print(f"Generated all mipmap densities for {app_dir}")

    # 3. Update splash screens in drawables
    splash_files = glob.glob(os.path.join(res_dir, "drawable*", "splash.png"))
    for sf in splash_files:
        try:
            with Image.open(sf) as old_splash:
                w, h = old_splash.size
            # Create a new branded splash with app background
            splash_img = Image.new("RGBA", (w, h), bg_rgb + (255,))
            
            # Scale logo to fit nicely in center
            target_logo_sz = min(w, h) // 2
            if target_logo_sz < 64:
                target_logo_sz = 64
            splash_logo = master_logo.resize((target_logo_sz, target_logo_sz), Image.Resampling.LANCZOS)
            x_pos = (w - target_logo_sz) // 2
            y_pos = (h - target_logo_sz) // 2
            splash_img.paste(splash_logo, (x_pos, y_pos), splash_logo)
            splash_img.save(sf, format="PNG")
        except Exception as e:
            print(f"Failed to update splash {sf}: {e}")
            
    print(f"Updated {len(splash_files)} splash screens for {app_dir}")

if __name__ == "__main__":
    for app in APPS:
        process_app(app)
    print("ALL APPS UPDATED SUCCESSFULLY!")
