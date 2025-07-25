import os
import re
import json
import requests
from bs4 import BeautifulSoup, Tag


URL_TO_SCRAPE = "https://docs.ogc.org/DRAFTS/21-038r1.html"
OUTPUT_JSON_FILE = "./data/standard.json"
HTML_CACHE_FILE = "./data/standard.html"


def fetch_or_load_html(url, cache_file):
    if os.path.exists(cache_file):
        print(f"Loading cached HTML from {cache_file}")
        with open(cache_file, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        print(f"Downloading HTML from {url}")
        response = requests.get(url)
        response.encoding = 'utf-8'
        html = response.text
        with open(cache_file, 'w', encoding='utf-8') as f:
            f.write(html)
        return html


def clean_text(text):
    """Clean and format text by handling whitespace and line breaks properly."""
    if not text:
        return ""
    
    # Replace <br> tags with spaces before extracting text
    text = re.sub(r'<br\s*/?>', ' ', text, flags=re.IGNORECASE)
    
    # Replace multiple spaces with single spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Clean up common formatting issues
    text = text.strip()
    
    return text


def format_text_with_structure(soup_element, remove_title=True):
    """Extract and format text while preserving document structure."""
    if not soup_element:
        return ""
    
    # Clone to avoid modifying original
    element = BeautifulSoup(str(soup_element), 'html.parser')
    
    # Remove the first heading if requested
    if remove_title:
        first_heading = element.find(re.compile(r'h[1-6]'))
        if first_heading:
            # Remove the entire div containing the heading if it only contains the heading
            heading_div = first_heading.find_parent('div')
            if heading_div and len([child for child in heading_div.children if isinstance(child, Tag)]) == 1:
                heading_div.decompose()
            else:
                first_heading.decompose()
    
    # Handle different block elements that should create line breaks
    block_elements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'th', 'td']
    
    for tag_name in block_elements:
        for tag in element.find_all(tag_name):
            # Add newlines before and after block elements
            if tag.string:
                tag.string.replace_with(f"\n{tag.get_text()}\n")
            else:
                # For tags with mixed content, add newlines around the tag
                tag.insert(0, "\n")
                tag.append("\n")
    
    # Handle list items specially
    for li in element.find_all('li'):
        li.insert(0, "• ")
    
    # Handle table cells
    for td in element.find_all(['td', 'th']):
        td.append(" | ")
    
    # Extract text and clean it up
    text = element.get_text()
    
    # Clean up excessive newlines while preserving paragraph breaks
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Max 2 consecutive newlines
    text = re.sub(r'^\n+|\n+$', '', text)  # Remove leading/trailing newlines
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space
    text = re.sub(r' *\n *', '\n', text)  # Clean spaces around newlines
    
    return text.strip()


def html_to_markdown(soup_element, base_url):
    """Convert HTML to markdown format."""
    if not soup_element:
        return ""
    
    # Clone the element
    element = BeautifulSoup(str(soup_element), 'html.parser')
    
    # Remove the first heading to avoid duplication with title
    first_heading = element.find(re.compile(r'h[1-6]'))
    if first_heading:
        # Remove the entire div containing the heading if it only contains the heading
        heading_div = first_heading.find_parent('div')
        if heading_div and len([child for child in heading_div.children if isinstance(child, Tag)]) == 1:
            heading_div.decompose()
        else:
            first_heading.decompose()
    
    # Convert various HTML elements to markdown
    
    # Headers (h1-h6)
    for i in range(1, 7):
        for heading in element.find_all(f'h{i}'):
            heading_text = heading.get_text().strip()
            heading.replace_with(f"\n{'#' * i} {heading_text}\n\n")
    
    # Bold and strong
    for tag in element.find_all(['strong', 'b']):
        tag.replace_with(f"**{tag.get_text()}**")
    
    # Italic and emphasis
    for tag in element.find_all(['em', 'i']):
        tag.replace_with(f"*{tag.get_text()}*")
    
    # Underline (using HTML since markdown doesn't have native underline)
    for tag in element.find_all('u'):
        tag.replace_with(f"<u>{tag.get_text()}</u>")
    
    # Code (inline)
    for tag in element.find_all('code'):
        if not tag.find_parent('pre'):  # Don't process code inside pre blocks
            tag.replace_with(f"`{tag.get_text()}`")
    
    # Code blocks (pre)
    for tag in element.find_all('pre'):
        code_content = tag.get_text()
        tag.replace_with(f"\n```\n{code_content}\n```\n")
    
    # Links
    for tag in element.find_all('a'):
        href = tag.get('href', '')
        text = tag.get_text()
        if href:
            # Prepend base URL to relative links starting with #
            if href.startswith('#'):
                href = base_url + href
            tag.replace_with(f"[{text}]({href})")
        else:
            tag.replace_with(text)
    
    # Unordered lists
    for ul in element.find_all('ul'):
        list_items = []
        for li in ul.find_all('li', recursive=False):
            list_items.append(f"- {li.get_text().strip()}")
        ul.replace_with('\n' + '\n'.join(list_items) + '\n')
    
    # Ordered lists
    for ol in element.find_all('ol'):
        list_items = []
        for i, li in enumerate(ol.find_all('li', recursive=False), 1):
            list_items.append(f"{i}. {li.get_text().strip()}")
        ol.replace_with('\n' + '\n'.join(list_items) + '\n')
    
    # Tables
    for table in element.find_all('table'):
        markdown_table = []
        all_rows = table.find_all('tr')
        
        if not all_rows:
            continue
        
        # Find the maximum number of columns across all rows
        max_columns = 0
        table_data = []
        
        for tr in all_rows:
            row_cells = []
            for cell in tr.find_all(['th', 'td']):
                row_cells.append(cell.get_text().strip())
            table_data.append(row_cells)
            max_columns = max(max_columns, len(row_cells))
        
        # If we have data, create the markdown table
        if table_data and max_columns > 0:
            # Process header row (first row)
            header_row = table_data[0]
            # Pad header row to max_columns if needed
            while len(header_row) < max_columns:
                header_row.append('')
            markdown_table.append('| ' + ' | '.join(header_row) + ' |')
            
            # Create separator row based on max_columns
            markdown_table.append('|' + '---|' * max_columns)
            
            # Process data rows
            for row_data in table_data[1:]:
                # Pad row to max_columns if needed
                while len(row_data) < max_columns:
                    row_data.append('')
                markdown_table.append('| ' + ' | '.join(row_data) + ' |')
        
        if markdown_table:
            table.replace_with('\n' + '\n'.join(markdown_table) + '\n')
    
    # Paragraphs
    for p in element.find_all('p'):
        text = p.get_text().strip()
        if text:
            p.replace_with(f"\n{text}\n")
    
    # Line breaks
    for br in element.find_all('br'):
        br.replace_with('\n')
    
    # Extract the final text
    markdown = element.get_text()
    
    # Clean up excessive newlines while preserving paragraph breaks
    markdown = re.sub(r'\n\s*\n\s*\n+', '\n\n', markdown)  # Max 2 consecutive newlines
    markdown = re.sub(r'^\n+|\n+$', '', markdown)  # Remove leading/trailing newlines
    markdown = re.sub(r'[ \t]+', ' ', markdown)  # Multiple spaces/tabs to single space
    markdown = re.sub(r' *\n *', '\n', markdown)  # Clean spaces around newlines
    
    return markdown.strip()


def extract_entries(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    main = soup.find('main', class_='main-section')
    if not main:
        return []
    
    # Find all divs in order that contain an h1–h6 as the first child
    heading_divs = []
    for div in main.find_all('div'):
        first = next((child for child in div.children if isinstance(child, Tag)), None)
        if first and re.fullmatch(r'h[1-6]', first.name):
            heading_divs.append(div)
    
    entries = []
    stack = []
    
    for i, div in enumerate(heading_divs):
        heading = next((child for child in div.children if isinstance(child, Tag) and re.fullmatch(r'h[1-6]', child.name)), None)
        if not heading:
            continue
        
        level = int(heading.name[1])
        entry_id = div.get('id', '')
        a_tag = heading.find('a', class_='header')
        
        # Extract and clean title
        raw_title = a_tag.get_text() if a_tag else heading.get_text()
        title = clean_text(raw_title)
        
        # Start from the current div
        collected = [str(div)]
        
        # Look ahead to grab sibling divs until next heading (any level)
        for sibling in div.find_next_siblings():
            first_tag = next((child for child in sibling.children if isinstance(child, Tag)), None)
            if first_tag and re.fullmatch(r'h[1-6]', first_tag.name):
                break
            collected.append(str(sibling))
        
        # Parse the collected HTML
        raw_html = '\n'.join(collected).strip()
        section_soup = BeautifulSoup(raw_html, 'html.parser')
        
        # Remove all nested heading divs (subsections) from this section's content
        for j in range(i + 1, len(heading_divs)):
            nested_div = heading_divs[j]
            nested_heading = next((child for child in nested_div.children if isinstance(child, Tag) and re.fullmatch(r'h[1-6]', child.name)), None)
            if nested_heading:
                nested_level = int(nested_heading.name[1])
                # If we encounter a heading at same or higher level, stop removing
                if nested_level <= level:
                    break
                
                # Find and remove this nested div from our section content
                nested_id = nested_div.get('id')
                if nested_id:
                    # Remove by ID
                    nested_in_section = section_soup.find('div', id=nested_id)
                    if nested_in_section:
                        nested_in_section.decompose()
                else:
                    # Remove by content matching (fallback)
                    nested_title = clean_text(nested_heading.get_text())
                    matching_divs = section_soup.find_all('div')
                    for match_div in matching_divs:
                        match_heading = next((child for child in match_div.children if isinstance(child, Tag) and re.fullmatch(r'h[1-6]', child.name)), None)
                        if match_heading and clean_text(match_heading.get_text()) == nested_title:
                            match_div.decompose()
                            break
        
        # Extract formatted text (without title) and markdown
        formatted_text = format_text_with_structure(section_soup, remove_title=True)
        markdown_content = html_to_markdown(section_soup, base_url)
        
        # Create entry
        entry = {
            'link': entry_id,
            'title': title,
            'text': formatted_text,
            'markdown': markdown_content,
            'parent': None,
            'children': []
        }
        
        # Maintain parent/child hierarchy
        while stack and stack[-1]['level'] >= level:
            stack.pop()
        
        if stack:
            parent = stack[-1]['entry']
            entry['parent'] = parent['link']
            parent['children'].append(entry['link'])
        
        entries.append(entry)
        stack.append({'level': level, 'entry': entry})
    
    return entries


if __name__ == "__main__":
    html_doc = fetch_or_load_html(URL_TO_SCRAPE, cache_file=HTML_CACHE_FILE)
    data = extract_entries(html_doc, URL_TO_SCRAPE)
    
    with open(OUTPUT_JSON_FILE, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Data extracted and written to {OUTPUT_JSON_FILE}")
    print(f"Extracted {len(data)} entries")
