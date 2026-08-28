import os
from PIL import Image

input_path = r"C:\Users\Furkan\.gemini\antigravity-ide\brain\d853e17a-f407-4453-99e6-82ef8830a165\.user_uploaded\media_1787920971907.png"
logo_output = r"c:\Users\Furkan\OneDrive\Masaüstü\mobil yazılım kulübü\img\logo.png"
favicon_output = r"c:\Users\Furkan\OneDrive\Masaüstü\mobil yazılım kulübü\img\favicon.png"

img = Image.open(input_path).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # If pixel is near white/light grey, make it transparent
    if item[0] > 220 and item[1] > 220 and item[2] > 220:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Crop bounding box to remove excess margins
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save transparent logo
img.save(logo_output, "PNG")

# Create a square version for favicon with padding
width, height = img.size
max_dim = max(width, height)
square_img = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 0))
offset = ((max_dim - width) // 2, (max_dim - height) // 2)
square_img.paste(img, offset)
square_img.resize((128, 128), Image.Resampling.LANCZOS).save(favicon_output, "PNG")

print("Logo and Favicon transparent processing complete!")
