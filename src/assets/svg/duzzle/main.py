import os
import glob
import re

# Folder containing SVG files
svg_folder = "./"  

# Find all SVG files in the folder
svg_files = glob.glob(os.path.join(svg_folder, "*.svg"))

for file in svg_files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    modified = False

    # 3️⃣ Change width="800px" or height="800px" to 40px
    content = re.sub(r'width="\d+px"', 'width="30px"', content)
    content = re.sub(r'height="\d+px"', 'height="30px"', content)
    modified = True

    # 4️⃣ If width or height is missing, add width="40px" height="40px"
    if 'width="' not in content or 'height="' not in content:
        content = re.sub(r'(<svg[^>]+)', r'\1 width="30px" height="30px"', content, 1)
        modified = True

    # Save only if modifications were made
    if modified:
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)

print(f"Processed {len(svg_files)} SVG files!")
