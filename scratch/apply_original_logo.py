import os
from PIL import Image

uploaded_img_path = r"C:\Users\Furkan\.gemini\antigravity-ide\brain\d853e17a-f407-4453-99e6-82ef8830a165\.user_uploaded\media_1787920971907.png"
workspace_dir = r"c:\Users\Furkan\OneDrive\Masaüstü\mobil yazılım kulübü"

logo_png_path = os.path.join(workspace_dir, "img", "logo.png")
favicon_png_path = os.path.join(workspace_dir, "img", "favicon.png")
favicon_ico_img = os.path.join(workspace_dir, "img", "favicon.ico")
favicon_ico_root = os.path.join(workspace_dir, "favicon.ico")

# 1. Open original uploaded logo
img = Image.open(uploaded_img_path).convert("RGBA")

# Remove background if pure white/near white
datas = img.getdata()
new_data = []
for item in datas:
    if item[0] > 235 and item[1] > 235 and item[2] > 235:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Trim transparent margins
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save directly to img/logo.png
img.save(logo_png_path, "PNG")

# 2. Extract icon for favicon (the phone & wifi icon on the right side)
width, height = img.size
# The phone icon is on the right side (~55% to 100% of width)
icon_crop_box = (int(width * 0.55), 0, width, height)
icon_img = img.crop(icon_crop_box)
icon_bbox = icon_img.getbbox()
if icon_bbox:
    icon_img = icon_img.crop(icon_bbox)

# Make square favicon
i_w, i_h = icon_img.size
max_d = max(i_w, i_h)
square_icon = Image.new("RGBA", (max_d, max_d), (0, 0, 0, 0))
sq_offset = ((max_d - i_w) // 2, (max_d - i_h) // 2)
square_icon.paste(icon_img, sq_offset)

favicon_64 = square_icon.resize((64, 64), Image.Resampling.LANCZOS)
favicon_64.save(favicon_png_path, "PNG")

# Save ICO
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
square_icon.save(favicon_ico_root, format="ICO", sizes=icon_sizes)
square_icon.save(favicon_ico_img, format="ICO", sizes=icon_sizes)

print("SUCCESS: img/logo.png, img/favicon.png, and favicon.ico updated successfully!")
