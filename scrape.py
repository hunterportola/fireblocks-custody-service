import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# The starting point for the crawl
START_URL = "https://developers.fireblocks.com/reference"
# The base domain, to ensure we don't leave the docs site
BASE_URL = "https://developers.fireblocks.com"

# A set of URLs we need to visit. A set automatically handles duplicates.
urls_to_visit = {START_URL}
# A set of URLs we have already successfully visited
visited_urls = set()

all_page_content = "" # We'll add the text from every page here

print("🤖 Starting crawler...")

# The main loop. It continues as long as we have new pages to scrape.
while urls_to_visit:
    # Take a URL from the set to process
    current_url = urls_to_visit.pop()
    
    # Add it to our list of visited URLs
    visited_urls.add(current_url)
    print(f"📄 Scraping: {current_url}")

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'}
        response = requests.get(current_url, headers=headers)
        response.raise_for_status() # Check for errors

        soup = BeautifulSoup(response.text, 'html.parser')
        article = soup.find('article')

        if article:
            # Add a separator and the content of this page to our master string
            all_page_content += f"\n\n--- Content from: {current_url} ---\n\n"
            all_page_content += article.get_text(separator='\n', strip=True)

        # Find all link tags on the current page
        for link_tag in soup.find_all('a', href=True):
            # Turn relative links (like "/docs/next-page") into absolute links
            full_url = urljoin(BASE_URL, link_tag['href'])

            # This is the magic: we only add the link to our to-do list if...
            # 1. It starts with our target path (BASE_URL + "/docs")
            # 2. We have NOT visited it before
            if full_url.startswith(BASE_URL + "/docs") and full_url not in visited_urls:
                urls_to_visit.add(full_url)
    
    except requests.exceptions.HTTPError as err:
        print(f"   -> Skipping URL due to HTTP Error: {err}")
    except Exception as err:
        print(f"   -> Skipping URL due to an error: {err}")

# Once the loop is finished, write all the collected content to the file at once
with open("agent.md", "w", encoding='utf-8') as f:
    f.write(all_page_content)

print(f"\n✅ Success! Scraped {len(visited_urls)} pages and saved everything to agent.md.")