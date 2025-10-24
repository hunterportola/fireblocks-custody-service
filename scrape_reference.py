import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# --- Configuration ---
# The starting point for the API reference crawl
START_URL = "https://developers.fireblocks.com/reference/introduction"
# The base domain
BASE_URL = "https://developers.fireblocks.com"
# The output filename for this crawl
OUTPUT_FILE = "api_reference.md"
# The path we want to stay within
TARGET_PATH = "/reference"
# --- End Configuration ---

urls_to_visit = {START_URL}
visited_urls = set()
all_page_content = ""

print(f"🤖 Starting API Reference crawler for '{TARGET_PATH}'...")

while urls_to_visit:
    current_url = urls_to_visit.pop()
    
    # Don't visit the same page twice
    if current_url in visited_urls:
        continue

    visited_urls.add(current_url)
    print(f"📄 Scraping: {current_url}")

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'}
        response = requests.get(current_url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # ** This is the main change **
        # The API reference content is in a 'div' with the class 'Block-content'
        main_content = soup.find('div', class_='Block-content')

        if main_content:
            all_page_content += f"\n\n--- Content from: {current_url} ---\n\n"
            all_page_content += main_content.get_text(separator='\n', strip=True)

        # Find all links to continue crawling
        for link_tag in soup.find_all('a', href=True):
            full_url = urljoin(BASE_URL, link_tag['href'])

            # ** This is the other main change **
            # Filter for links within the /reference/ section
            if full_url.startswith(BASE_URL + TARGET_PATH) and full_url not in visited_urls:
                # To avoid crawling other languages, we can add a simple filter
                if "/ja/" not in full_url and "/ko/" not in full_url:
                    urls_to_visit.add(full_url)
    
    except requests.exceptions.HTTPError as err:
        print(f"   -> Skipping URL due to HTTP Error: {err}")
    except Exception as err:
        print(f"   -> Skipping URL due to an error: {err}")

with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
    f.write(all_page_content)

print(f"\n✅ Success! Scraped {len(visited_urls)} pages and saved content to {OUTPUT_FILE}.")