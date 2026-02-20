import os
import time
import pytesseract
from PIL import Image, ImageOps, ImageEnhance
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TARGET_URL = "https://epaper.hindustantimes.com/"
SAVE_DIR = "selenium_ht_results"
os.makedirs(SAVE_DIR, exist_ok=True)

def find_and_crop_article(image_path, keyword):
    """Processes the image and crops the article area around the keyword."""
    img = Image.open(image_path)
    
    # Pre-processing for small newspaper text
    processed = img.convert('L')
    processed = ImageOps.autocontrast(processed)
    enhancer = ImageEnhance.Sharpness(processed)
    processed = enhancer.enhance(3.0)
    
    # Use PSM 3 (Fully automatic page segmentation) for newspaper columns
    data = pytesseract.image_to_data(processed, config='--oem 3 --psm 3', output_type=pytesseract.Output.DICT)
    
    keyword = keyword.lower().strip()
    matching_coords = []

    for i in range(len(data['text'])):
        if keyword in data['text'][i].lower():
            matching_coords.append({
                "x": data['left'][i], "y": data['top'][i],
                "w": data['width'][i], "h": data['height'][i]
            })

    if not matching_coords:
        return None

    # Calculate article block bounds (using wide padding for full context)
    min_x = max(0, min(c['x'] for c in matching_coords) - 1000)
    min_y = max(0, min(c['y'] for c in matching_coords) - 800)
    max_x = min(img.width, max(c['x'] + c['w'] for c in matching_coords) + 1000)
    max_y = min(img.height, max(c['y'] + c['h'] for c in matching_coords) + 1200)

    return img.crop((min_x, min_y, max_x, max_y))

def run_selenium_scraper():
    keyword = input("\nEnter keyword to find (e.g., Sanjjeev): ").strip()
    
    chrome_options = Options()
    # High-DPI Force: This makes the browser render text 3x larger internally
    chrome_options.add_argument("--force-device-scale-factor=3")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    try:
        driver.get(TARGET_URL)
        print("⏳ Waiting for initial load...")
        time.sleep(15)

        # Iterate through pages 1 to 3
        for page_num in range(1, 4):
            print(f"📄 Scanning Page {page_num}...")
            
            # Technique: Zoom in slightly using ActionChains to trigger high-res tiles
            actions = ActionChains(driver)
            actions.send_keys(Keys.CONTROL, '+').perform()
            
            # Wait for the "Sanjjeev" name and other text to sharpen
            print("⏳ Sharpening canvas tiles (20s)...")
            time.sleep(20) 

            screenshot_name = f"page_{page_num}_highres.png"
            driver.save_screenshot(screenshot_name)

            print(f"🔍 Analyzing OCR for '{keyword}'...")
            result_img = find_and_crop_article(screenshot_name, keyword)

            if result_img:
                final_path = os.path.join(SAVE_DIR, f"Extracted_Article_{keyword}_P{page_num}.png")
                result_img.save(final_path)
                print(f"✅ SUCCESS: Article saved to {final_path}")
                break
            else:
                print(f"⏭️ Not found on page {page_num}. Moving to next...")
                # Find the 'Next Page' button or use ArrowRight
                driver.find_element("tag name", "body").send_keys(Keys.ARROW_RIGHT)
                time.sleep(5)

    finally:
        driver.quit()
        # Clean up temporary full-page screenshots
        for i in range(1, 4):
            if os.path.exists(f"page_{i}_highres.png"):
                os.remove(f"page_{i}_highres.png")

if __name__ == "__main__":
    run_selenium_scraper()