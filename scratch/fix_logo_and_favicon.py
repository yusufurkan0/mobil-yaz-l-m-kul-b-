import os
from PIL import Image

uploaded_img_path = r"C:\Users\Furkan\.gemini\antigravity-ide\brain\d853e17a-f407-4453-99e6-82ef8830a165\.user_uploaded\media_1787920971907.png"
workspace_dir = r"c:\Users\Furkan\OneDrive\Masaüstü\mobil yazılım kulübü"

logo_v3_path = os.path.join(workspace_dir, "img", "logo_v3.png")
logo_png_path = os.path.join(workspace_dir, "img", "logo.png")
favicon_png_path = os.path.join(workspace_dir, "img", "favicon.png")
favicon_ico_img = os.path.join(workspace_dir, "img", "favicon.ico")
favicon_ico_root = os.path.join(workspace_dir, "favicon.ico")

img = Image.open(uploaded_img_path).convert("RGBA")

# Remove pure white / off-white background to make it a transparent PNG
datas = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
new_data = []
for item in datas:
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Trim white margins around logo
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save logo_v3.png and logo.png
img.save(logo_v3_path, "PNG")
img.save(logo_png_path, "PNG")

# Create a square favicon with icon
width, height = img.size
max_dim = max(width, height)
square_img = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
offset = ((max_dim - width) // 2, (max_dim - height) // 2)
square_img.paste(img, offset)

favicon_resized = square_img.resize((64, 64), Image.Resampling.LANCZOS)
favicon_resized.save(favicon_png_path, "PNG")

# Save ICO file format for root favicon
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
square_img.save(favicon_ico_root, format="ICO", sizes=icon_sizes)
square_img.save(favicon_ico_img, format="ICO", sizes=icon_sizes)

print("COMPLETE: logo_v3.png, logo.png, favicon.png, and favicon.ico updated successfully!")
