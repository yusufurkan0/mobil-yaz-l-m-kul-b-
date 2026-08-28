import os
from PIL import Image

uploaded_img_path = r"C:\Users\Furkan\.gemini\antigravity-ide\brain\d853e17a-f407-4453-99e6-82ef8830a165\.user_uploaded\media_1787933308454.jpg"
workspace_dir = r"c:\Users\Furkan\OneDrive\Masaüstü\mobil yazılım kulübü"

logo_png_path = os.path.join(workspace_dir, "img", "logo.png")
logo_custom_path = os.path.join(workspace_dir, "img", "mygk-kulup-logosu.png")
favicon_png_path = os.path.join(workspace_dir, "img", "favicon.png")
favicon_ico_img = os.path.join(workspace_dir, "img", "favicon.ico")
favicon_ico_root = os.path.join(workspace_dir, "favicon.ico")

img = Image.open(uploaded_img_path).convert("RGBA")

# Turn off-white background to transparent (alpha 0)
datas = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
new_data = []
for item in datas:
    # Check if pixel is light/white/off-white background
    if item[0] > 215 and item[1] > 215 and item[2] > 215:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Crop empty transparent margins
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save transparent PNG to img/mygk-kulup-logosu.png and img/logo.png
img.save(logo_custom_path, "PNG")
img.save(logo_png_path, "PNG")

# Extract the phone-play button icon on the right side for favicon
w, h = img.size
# Right side icon box (~60% to 100% of width)
icon_crop_box = (int(w * 0.58), 0, w, h)
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

# Save multi-size favicon.ico
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
square_icon.save(favicon_ico_root, format="ICO", sizes=icon_sizes)
square_icon.save(favicon_ico_img, format="ICO", sizes=icon_sizes)

print("SUCCESS: Processed new MYGK logo with transparent background and updated favicons!")
