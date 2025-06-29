from fastapi import APIRouter, Request, HTTPException
import requests
from bs4 import BeautifulSoup
import logging
import re
import json
from datetime import datetime
import os
from collections import defaultdict
import networkx as nx
from fastapi import Query
from community import community_louvain
from networkx.algorithms import community as nx_community
from analyzers.factory import get_analyzer
from typing import Optional
import json
from graph_builder import build_graph_from_txt
from requests.exceptions import HTTPError, RequestException


router = APIRouter()
logger = logging.getLogger("wikipedia")
logging.basicConfig(level=logging.DEBUG)
logger.setLevel(logging.DEBUG)

@router.post("/fetch-wikipedia-data")
async def fetch_wikipedia_data(request: Request):
    data = await request.json()
    url = data.get("url")
    filename = data.get("save_as", "wikipedia_data")

    if not url:
        raise HTTPException(status_code=400, detail="Missing Wikipedia URL")
    if "wikipedia.org" not in url:
        raise HTTPException(status_code=400, detail="Invalid Wikipedia URL")

    logger.info(f"Fetching URL: {url}")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  

    except HTTPError as http_err:
        logger.error(f"HTTP error while fetching Wikipedia URL: {http_err}")
        raise HTTPException(
            status_code=400,
            detail="The provided Wikipedia URL is invalid or does not exist. Please try a different link."
        )
    except RequestException as req_err:
        logger.error(f"Request error: {req_err}")
        raise HTTPException(
            status_code=400,
            detail="Unable to connect to Wikipedia. Please check your network or try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching Wikipedia data: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while trying to fetch the Wikipedia page."
        )

    try:
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.find("h1", id="firstHeading").get_text(strip=True)
        metadata = extract_metadata(soup)
        content_data = extract_main_content(soup, url)

        discussion_graph = None
        opinions = {"for": 0, "against": 0, "neutral": 0}
        opinion_users = {"for": [], "against": [], "neutral": []}

        if content_data and len(content_data) > 0 and 'discussion_graph' in content_data[0]:
            discussion_graph = content_data[0]['discussion_graph']
            for section in content_data[0]["sections"]:
                opinions["for"] += section["opinion_count"]["for"]
                opinions["against"] += section["opinion_count"]["against"]
                opinions["neutral"] += section["opinion_count"]["neutral"]
                for comment in section["comments"]:
                    username = comment["username"]
                    opinion = comment["opinion"]
                    if username not in opinion_users[opinion]:
                        opinion_users[opinion].append(username)

        result = {
            "title": title,
            "url": url,
            "metadata": metadata,
            "content": content_data,
            "opinions": opinions,
            "opinion_users": opinion_users
        }

        if discussion_graph:
            result["nodes"] = discussion_graph["nodes"]
            result["links"] = discussion_graph["links"]
            degree_map = {}
            for link in discussion_graph["links"]:
                source = link["source"]
                target = link["target"]
                degree_map[source] = degree_map.get(source, 0) + 1
                degree_map[target] = degree_map.get(target, 0) + 1
            for node in discussion_graph["nodes"]:
                node_id = node["id"]
                node["degree"] = degree_map.get(node_id, 0)

        target_dir = "uploads"
        os.makedirs(target_dir, exist_ok=True)
        json_path = os.path.join(target_dir, f"{filename}.json")

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        logger.info(f"Successfully extracted Wikipedia content for: {title}")
        return result

    except Exception as e:
        logger.error(f"Error fetching Wikipedia data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    
@router.get("/analyze/wikipedia/{filename}")
async def analyze_network(
    filename: str,
    start_date: str = Query(None),
    start_time: str = Query(None),
    end_date: str = Query(None),
    end_time: str = Query(None),
    limit: int = Query(50),
    limit_type: str = Query("first"),
    min_length: int = Query(None),
    max_length: int = Query(None),
    keywords: str = Query(None),
    min_messages: int = Query(None),
    max_messages: int = Query(None),
    active_users: int = Query(None),
    selected_users: str = Query(None),
    username: str = Query(None),
    anonymize: bool = Query(False)
):
    base_path = "uploads"
    txt_path = os.path.join(base_path, f"{filename}.txt")


    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail=f"TXT file {txt_path} not found.")

    try:
        from utils import parse_date_time
        start_datetime = parse_date_time(start_date, start_time)
        end_datetime = parse_date_time(end_date, end_time)
    except Exception:
        start_datetime = None
        end_datetime = None

    graph_data = build_graph_from_txt(
        txt_path,
        limit=limit,
        limit_type=limit_type,
        min_length=min_length,
        max_length=max_length,
        anonymize=anonymize,
        keywords=keywords,
        min_messages=min_messages,
        max_messages=max_messages,
        active_users=active_users,
        selected_users=selected_users,
        username=username,
        start_date=start_date,
        start_time=start_time,
        end_date=end_date,
        end_time=end_time
    )

    logger.info(f"Built graph from TXT with {len(graph_data['nodes'])} nodes and {len(graph_data['links'])} links")

    return {
        "nodes": graph_data["nodes"],
        "links": graph_data["links"]
    }


def extract_metadata(soup):
    metadata = {}
    last_modified = soup.find("li", id="footer-info-lastmod")
    if last_modified:
        metadata["last_modified"] = last_modified.get_text(strip=True)
    return metadata


def count_indent_colons(text):
    text = text.strip()
    colon_count = 0
    for char in text:
        if char == ':':
            colon_count += 1
        else:
            break
    return colon_count

def extract_user_and_timestamp(html_content):
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    timestamp_link = soup.select_one('a.ext-discussiontools-init-timestamplink')
    if timestamp_link:
        timestamp = timestamp_link.get_text(strip=True)
        
        parent = timestamp_link.find_parent()
        if parent:
            user_links = parent.select('a[title^="User:"], a[title^="משתמש:"]')
            if user_links:
                parent_text = parent.get_text()
                ts_pos = parent_text.find(timestamp)
                
                best_user = None
                best_dist = float('inf')
                
                for link in user_links:
                    username = link.get_text(strip=True)
                    username = clean_username(username)
                    if username:
                        name_pos = parent_text.find(username)
                        if name_pos != -1:
                            dist = abs(ts_pos - name_pos)
                            if dist < best_dist:
                                best_user = username
                                best_dist = dist
                
                if best_user:
                    return best_user, timestamp
    
    text = soup.get_text(separator=" ", strip=True)
    
    signature_patterns = [
        r'([א-תA-Za-z0-9_\-\s]{2,50}?)\s*[-–—]?\s*שיחה\s*‏?\s*(\d{1,2}[:\.]\d{2}.*?\d{4})',
        r'([a-zA-Z0-9_\-\s]{2,50}?)\s*[-–—]?\s*talk\s*‏?\s*(\d{1,2}[:\.]\d{2}.*?\d{4})',
        r'([א-תA-Za-z0-9_\-\s]{2,50}?)\s*[-–—]\s*(\d{1,2}[:\.]\d{2}.*?\d{4})',
    ]
    
    for pattern in signature_patterns:
        matches = list(re.finditer(pattern, text))
        if matches:
            match = matches[-1]
            username = match.group(1).strip()
            timestamp = match.group(2).strip()
            
            username = clean_username(username)
            if username and is_valid_username(username):
                return username, timestamp
    
    return None, None


def clean_username(username):
   
    if not username:
        return None
    
    username = re.sub(r'[\u200F\u200E\u202D\u202C\u2066\u2067\u2068\u2069]', '', username)
    
    prefixes_to_remove = [
        r'^[.\s]*המידע נמחק.*?(?=\s[A-Za-z])',
        r'^[.\s]*הודעה נמחקה.*?(?=\s[A-Za-z])',
        r'^[.\s]*תגובה נמחקה.*?(?=\s[A-Za-z])',
        r'^[.\s]*\n+',
        r'^\.',
    ]
    
    for prefix in prefixes_to_remove:
        username = re.sub(prefix, '', username, flags=re.DOTALL)
    
    username_match = re.search(r'([א-תA-Za-z0-9_\-\s]{2,50})', username.strip())
    if username_match:
        username = username_match.group(1).strip()
    
    username = re.sub(r'[-–—]*$', '', username)
    
    username = re.sub(r'\s+', ' ', username)
    
    return username if len(username) >= 2 else None

def is_valid_username(username):
   
    if not username or len(username) < 2:
        return False
    
    invalid_patterns = [
        r'^(המידע|תגובה|ערך|מקור|דיון|הצעה|פרלמנט)$',
        r'^\d+$',  
        r'^[^\w\s]+$',  
        r'(נמחק|הוסר|נמחקה)',  
    ]
    
    for pattern in invalid_patterns:
        if re.search(pattern, username, re.IGNORECASE):
            return False
    
    if username.strip() == '':
        return False
        
    return True

def extract_individual_comment_text(element, username, timestamp):
    
    if not element:
        return ""
    
    full_text = element.get_text(separator=" ", strip=True)
    
    signature_pattern = r'([א-תA-Za-z0-9_\-\s]{2,50}?)\s*[-–—]?\s*שיחה\s*‏?\s*(\d{1,2}[:\.]\d{2}.*?\d{4})'
    signature_matches = list(re.finditer(signature_pattern, full_text))
    
    if len(signature_matches) == 1:
        match = signature_matches[0]
        comment_text = full_text[:match.start()].strip()
        return clean_extracted_comment(comment_text)
    
    target_username_clean = username.lower().replace(' ', '').replace('-', '')
    target_timestamp_clean = timestamp.replace(' ', '').replace('(IDT)', '')
    
    target_sig_start = None
    target_sig_end = None
    
    for match in signature_matches:
        sig_username = clean_username(match.group(1).strip())
        sig_timestamp = match.group(2).strip()
        
        if (sig_username and 
            sig_username.lower().replace(' ', '').replace('-', '') == target_username_clean and
            target_timestamp_clean in sig_timestamp.replace(' ', '').replace('(IDT)', '')):
            target_sig_start = match.start()
            target_sig_end = match.end()
            break
    
    if target_sig_start is not None:
        previous_sig_end = 0
        for match in signature_matches:
            if match.end() < target_sig_start and match.end() > previous_sig_end:
                previous_sig_end = match.end()
        
        comment_text = full_text[previous_sig_end:target_sig_start].strip()
        return clean_extracted_comment(comment_text)
    
    return clean_extracted_comment(full_text)


def clean_extracted_comment(text):
  
    if not text:
        return ""
    
    text = text.strip()
    
    text = re.sub(r'^[::\s]+', '', text)
    
    text = re.sub(r'[א-תA-Za-z0-9_\-\s]{2,50}?\s*[-–—]?\s*שיחה\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?$', '', text, flags=re.MULTILINE)
    text = re.sub(r'[a-zA-Z0-9_\-\s]{2,50}?\s*[-–—]?\s*talk\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?$', '', text, flags=re.MULTILINE)
    
    text = re.sub(r'\s*תגובה\s*$', '', text)
    
    text = re.sub(r'^\s*[.\s]*המידע נמחק.*?\n', '', text, flags=re.DOTALL)
    text = re.sub(r'^\s*[.\s]*תגובה נמחקה.*?\n', '', text, flags=re.DOTALL)
    
    text = re.sub(r'\d{1,2}[:\.]\d{2}.*?\d{4}', '', text)
    
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def clean_comment_text(text):
   
    if not text:
        return ""
    
    text = re.sub(r'^[.\s]*המידע נמחק.*?\n', '', text, flags=re.DOTALL)
    text = re.sub(r'^[.\s]*תגובה נמחקה.*?\n', '', text, flags=re.DOTALL)
    
    text = re.sub(r'^[::\s]+', '', text)
    
    text = re.sub(r'[א-תA-Za-z0-9_\-\s]{2,30}\s*[-–—]?\s*שיחה\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?$', '', text)
    text = re.sub(r'[a-zA-Z0-9_\-\s]{2,30}\s*[-–—]?\s*talk\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?$', '', text)
    
    return text.strip()


def analyze_comment_for_opinion(text):
    text_lower = text.lower().strip()
    
    if text_lower.startswith("בעד") or text_lower.startswith("בעד "):
        return "for"
    elif text_lower.startswith("נגד") or text_lower.startswith("נגד "):
        return "against"
    
    indicators_for = ["אני בעד", "אני תומך", "i agree", "{{בעד}}"]
    indicators_against = ["אני נגד", "אני מתנגד", "i disagree", "{{נגד}}"]
    
    if any(ind in text_lower for ind in indicators_for):
        return "for"
    elif any(ind in text_lower for ind in indicators_against):
        return "against"
    
    return "neutral"


def build_conversation_tree(comments):
    tree = {}
    stack = []
    for i, comment in enumerate(comments):
        tree[i] = {"comment": comment, "parent": None, "responders": []}
        indentation = comment["indentation"]
        while stack and stack[-1]["indentation"] >= indentation:
            stack.pop()
        if stack:
            parent_index = stack[-1]["index"]
            tree[i]["parent"] = parent_index
            tree[parent_index]["responders"].append(i)
        stack.append({"index": i, "indentation": indentation})
    return tree

def extract_reply_to_from_id(element_id: str) -> str:
  
    if not element_id or not element_id.startswith("c-"):
        return None

    parts = element_id[2:].split("-")

    date_indices = [i for i, part in enumerate(parts) if re.match(r'\d{4}', part)]

    if len(date_indices) < 2:
        return None        
    reply_to_index = date_indices[1] - 1
    if 0 <= reply_to_index < len(parts):
        reply_to = parts[reply_to_index]
        if reply_to in ["דיון", "הצעה", "פרלמנט"]:
            return None
        return reply_to.replace("_", " ")

    return None


def process_wiki_talk_page(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    content_div = soup.find("div", class_="mw-parser-output") or soup.find("div", id="mw-content-text")
    if not content_div:
        logger.warning("Could not find any suitable content div")
        return []

    all_elements = content_div.find_all([
        'h1', 'h2', 'h3', 'h4', 'li', 'p', 'div', 'dl', 'dd', 'dt'
    ])

    sections = []
    current_section = {
        "title": "Top",
        "comments": [],
        "participants": set(),
        "opinion_count": {"for": 0, "against": 0, "neutral": 0}
    }

    pending_text = ""

    for element in all_elements:
        if element.name.startswith('h'):
            if current_section["comments"]:
                current_section["participants"] = list(current_section["participants"])
                current_section["participant_count"] = len(current_section["participants"])
                sections.append(current_section)

            section_title = element.get_text(strip=True)
            current_section = {
                "title": section_title,
                "comments": [],
                "participants": set(),
                "opinion_count": {"for": 0, "against": 0, "neutral": 0}
            }
            pending_text = ""

        elif element.name in ['li', 'p', 'div', 'dd']:
            html = str(element)
            username, timestamp = extract_user_and_timestamp(html)

            if username and timestamp:
                comment_text = extract_individual_comment_text(element, username, timestamp)

                lines = pending_text.splitlines()
                filtered_lines = [
                    line for line in lines if not re.search(
                        r"(תגובה אחרונה|Last comment|תגובות\b|comments\b|אנשים בשיחה|participants)",
                        line,
                        flags=re.IGNORECASE
                    )
                ]
                pending_text = " ".join(filtered_lines).strip()


                full_text = (pending_text + "\n" + comment_text).strip() if pending_text else comment_text
                pending_text = ""  

                element_text = element.get_text(strip=True)
                indentation_from_colons = count_indent_colons(element_text)
                indentation_from_html = 0
                parent = element.parent
                while parent:
                    if parent.name in ['dd', 'dt']:
                        indentation_from_html += 1
                    parent = parent.parent
                indentation = max(indentation_from_colons, indentation_from_html)

                opinion = analyze_comment_for_opinion(full_text)
                current_section["opinion_count"][opinion] += 1

                comment = {
                    "indentation": indentation,
                    "username": username,
                    "timestamp": timestamp,
                    "text": full_text.replace("\n", " ").strip(),

                    "opinion": opinion,
                    "reply_to": None
                }

                current_section["participants"].add(username)
                current_section["comments"].append(comment)

            else:
                text = element.get_text(strip=True)
                if text:
                    pending_text += "\n" + text

    if current_section["comments"]:
        current_section["participants"] = list(current_section["participants"])
        current_section["participant_count"] = len(current_section["participants"])
        sections.append(current_section)

    for section in sections:
        comments = section["comments"]
        stack = []

        for i, comment in enumerate(comments):
            indent = comment["indentation"]

            while stack and comments[stack[-1]]["indentation"] >= indent:
                stack.pop()

            if stack:
                parent_index = stack[-1]
                comment["reply_to"] = comments[parent_index]["username"]
            else:
                comment["reply_to"] = None

            stack.append(i)

    return sections


def build_discussion_graph_from_sections(sections):
    users = set()
    links = []
    link_pairs = set() 

    for section in sections:
        conversation_tree = build_conversation_tree([comment for comment in section["comments"]])
        
        for comment_id, comment_data in conversation_tree.items():
            if comment_data["parent"] is not None:
                source_user = section["comments"][comment_id]["username"]
                target_user = section["comments"][comment_data["parent"]]["username"]
                
                link_key = f"{source_user}-{target_user}"
                if link_key not in link_pairs:
                    link_pairs.add(link_key)
                    links.append({
                        "source": source_user,
                        "target": target_user,
                        "value": 1
                    })
                    users.add(source_user)
                    users.add(target_user)
        
        for comment in section["comments"]:
            user = comment["username"]
            reply_to = comment.get("reply_to")

            users.add(user)
            if reply_to:
                users.add(reply_to)
                link_key = f"{user}-{reply_to}"
                if link_key not in link_pairs:
                    link_pairs.add(link_key)
                    links.append({
                        "source": user,
                        "target": reply_to,
                        "value": 1
                    })
    nodes = [{"id": user, "name": user, "group": 1} for user in users]
    
    logger.info(f"Created discussion graph with {len(nodes)} nodes and {len(links)} links")
    
    return {"nodes": nodes, "links": links}

def extract_main_content(soup, url):
    content_data = []

    from urllib.parse import unquote
    decoded_url = unquote(url)

    logger.info(f"Original URL: {url}")
    logger.info(f"Decoded URL: {decoded_url}")

    talk_indicators = [
        "/שיחה", "שיחת", "שיחה:",
        "/שיחת", "/talk", "/discussion",
        "talk:", "discussion:"
    ]

    found_indicator = False
    for indicator in talk_indicators:
        if indicator.lower() in decoded_url.lower():
            logger.info(f"Found talk indicator: '{indicator}' in URL")
            found_indicator = True

    is_talk_page = found_indicator or any(indicator.lower() in decoded_url.lower() for indicator in talk_indicators)
    logger.info(f"Is talk page determination: {is_talk_page}")

    if is_talk_page:
        logger.info("Detected talk page, processing discussions")

        talk_page_data = process_wiki_talk_page(str(soup))
        logger.info(f"Processed talk page, found {len(talk_page_data)} sections")

        discussion_graph = build_discussion_graph_from_sections(talk_page_data)

        logger.info(f"Extracted discussion graph with {len(discussion_graph['nodes'])} nodes and {len(discussion_graph['links'])} links")

        if talk_page_data:
            content_data.append({
                "type": "talk_page",
                "sections": talk_page_data,
                "discussion_graph": discussion_graph
            })
        else:
            logger.warning("No sections found in talk page")
    else:
        logger.info("Not a talk page, skipping discussion processing")

    return content_data


@router.post("/convert-wikipedia-to-txt")
async def convert_wikipedia_to_txt(request: Request):
    data = await request.json()
    filename = data.get("filename")
    section_title = data.get("section_title")

    if not filename or not section_title:
        raise HTTPException(status_code=400, detail="Missing filename or section_title")

    base_path = "uploads"
    json_path = os.path.join(base_path, f"{filename}.json")
    txt_path = os.path.join(base_path, f"{filename}.txt")

    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail=f"File {json_path} not found")

    with open(json_path, "r", encoding="utf-8") as f:
        content = json.load(f)

    selected_section = next((s for s in content["content"][0]["sections"] if s["title"] == section_title), None)
    if not selected_section:
        raise HTTPException(status_code=404, detail="Section not found")

    txt_lines = []
    prev_username = None

    for i, comment in enumerate(selected_section["comments"]):
        try:
            timestamp = comment["timestamp"]
            username = comment["username"]
            text = clean_comment_text_for_txt(comment["text"])

            timestamp_match_he = re.match(r"(\d+):(\d+), (\d+) ב([א-ת]+) (\d+)", timestamp)
            timestamp_match_en = re.match(r"(\d+):(\d+), (\d+) ([A-Za-z]+) (\d+)", timestamp)
            timestamp_match_alt = re.match(r"(\d+):(\d+), (\d+)/(\d+)/(\d+)", timestamp)

            if timestamp_match_he:
                hour, minute, day, month_he, year = timestamp_match_he.groups()
                month_map_he = {
                    "ינואר": "01", "פברואר": "02", "מרץ": "03", "אפריל": "04", "מאי": "05", "יוני": "06",
                    "יולי": "07", "אוגוסט": "08", "ספטמבר": "09", "אוקטובר": "10", "נובמבר": "11", "דצמבר": "12"
                }
                month = month_map_he.get(month_he, "01")
            elif timestamp_match_en:
                hour, minute, day, month_en, year = timestamp_match_en.groups()
                month_map_en = {
                    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
                    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
                }
                month = month_map_en.get(month_en, "01")
            elif timestamp_match_alt:
                hour, minute, day, month, year = timestamp_match_alt.groups()
            else:
                all_numbers = re.findall(r'\d+', timestamp)
                if len(all_numbers) >= 5:
                    hour, minute, day, month, year = all_numbers[:5]
                else:
                    day, month, year, hour, minute = "01", "01", "2000", "12", "00"

            whatsapp_date = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
            whatsapp_time = f"{hour.zfill(2)}:{minute.zfill(2)}:00"
            whatsapp_timestamp = f"[{whatsapp_date}, {whatsapp_time}]"

            line = f"{whatsapp_timestamp} {username}: {text}"
            if prev_username and prev_username != username:
                line += f" (reply_to: {prev_username})"

            prev_username = username

        except Exception as e:
            username = comment.get("username", "Unknown")
            text = comment.get("text", "")
            line = f"[01/01/2000, 12:00:00] {username}: {text}"

        txt_lines.append(line)

    os.makedirs(base_path, exist_ok=True)
    with open(txt_path, "w", encoding="utf-8") as txt_file:
        txt_file.write("\n".join(txt_lines))

    graph_data = build_graph_from_txt(txt_path)

    return {
        "message": "TXT created with clean user names and reply info",
        "path": txt_path,
        "nodes": graph_data["nodes"],
        "links": graph_data["links"]
    }


def clean_comment_text_for_txt(text):
 
    if not text:
        return ""
    
    text = re.sub(r'[א-תA-Za-z0-9_\-\s]{2,50}?-שיחה\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?תגובה\s*$', '', text)
    text = re.sub(r'[a-zA-Z0-9_\-\s]{2,50}?-talk\s*‏?\s*\d{1,2}[:\.]\d{2}.*?\d{4}.*?$', '', text)
    
    text = re.sub(r'\s*תגובה\s*$', '', text)
    
    text = re.sub(r'‏', '', text) 
    
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text



@router.get("/analyze/wikipedia-communities/{filename}")
async def analyze_communities(
    filename: str,
    platform: str = Query("wikipedia"),
    algorithm: str = Query("louvain"),
    limit: Optional[int] = Query(50),
    limit_type: str = Query("first"),
    min_length: Optional[int] = Query(None),
    max_length: Optional[int] = Query(None),
    anonymize: bool = Query(False),
    keywords: Optional[str] = Query(None),
    min_messages: Optional[int] = Query(None),
    max_messages: Optional[int] = Query(None),
    active_users: Optional[int] = Query(None),
    selected_users: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None)
):
    analyzer = get_analyzer(platform)
    return await analyzer.detect_communities(
        filename=filename,
        platform=platform,
        algorithm=algorithm,
        limit=limit,
        limit_type=limit_type,
        min_length=min_length,
        max_length=max_length,
        anonymize=anonymize,
        keywords=keywords,
        min_messages=min_messages,
        max_messages=max_messages,
        active_users=active_users,
        selected_users=selected_users,
        username=username,
        start_date=start_date,
        start_time=start_time,
        end_date=end_date,
        end_time=end_time
    )