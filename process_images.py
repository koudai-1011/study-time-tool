
import sys
from PIL import Image
import os

source_path = "/Users/koudai/.gemini/antigravity/brain/21dc0d5f-ce9f-4792-8991-c115e664fc20/uploaded_image_1764909577240.jpg"
assets_dir = "/Users/koudai/勉強時間割振ツール/assets"

try:
    img = Image.open(source_path)
    
    # icon.png (1024x1024)
    icon = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon.save(os.path.join(assets_dir, "icon.png"), "PNG")
    print(f"Created icon.png at {assets_dir}")
    
    # splash.png (2732x2732) - 中央配置で背景塗りつぶしも検討できるが、今回はリサイズのみ
    # スプラッシュはアスペクト比が重要だが、とりあえずリサイズで生成
    splash = img.resize((2732, 2732), Image.Resampling.LANCZOS)
    splash.save(os.path.join(assets_dir, "splash.png"), "PNG")
    print(f"Created splash.png at {assets_dir}")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
