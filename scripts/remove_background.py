import sys
from PIL import Image, ImageDraw, ImageFilter

def flood_fill_transparency(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Create a mask for the background
    mask = Image.new("L", (width, height), 0)
    
    # Identify background seeds (corners)
    seeds = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    
    # Sample the average background color from seeds
    bg_samples = [img.getpixel(s) for s in seeds]
    
    # Use flood fill on the mask to find all connected background
    # We use a tolerance for the check
    def get_diff(c1, c2):
        return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))

    # We'll use PIL's FloodFill-like logic but manual for better tolerance
    pixels = img.load()
    mask_pixels = mask.load()
    stack = seeds
    visited = set(seeds)
    
    tolerance = 50 # Adjust as needed
    
    while stack:
        x, y = stack.pop()
        mask_pixels[x, y] = 255
        
        for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                # If the color is close to any of the original background samples
                curr_color = pixels[nx, ny]
                if any(get_diff(curr_color, bg) < tolerance for bg in bg_samples):
                    visited.add((nx, ny))
                    stack.append((nx, ny))

    # Blur the mask slightly to soften edges
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1))
    
    # Apply the mask to the alpha channel
    datas = img.getdata()
    mask_datas = mask.getdata()
    
    new_data = []
    for i in range(len(datas)):
        r, g, b, a = datas[i]
        m = mask_datas[i]
        # Invert mask (255 is background/transparent, 0 is logo/opaque)
        alpha = min(a, 255 - m)
        new_data.append((r, g, b, int(alpha)))
    
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Flood-fill processed image saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_background.py <input> <output>")
    else:
        flood_fill_transparency(sys.argv[1], sys.argv[2])
