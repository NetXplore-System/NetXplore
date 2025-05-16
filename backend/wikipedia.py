from fastapi import APIRouter, Request, HTTPException
import requests
from bs4 import BeautifulSoup
import logging
import re
import json
from typing import List, Dict, Any
from datetime import datetime
import os

router = APIRouter()
logger = logging.getLogger("wikipedia")
logging.basicConfig(level=logging.INFO)

@router.post("/fetch-wikipedia-data")
async def fetch_wikipedia_data(request: Request):
    data = await request.json()
    url = data.get("url")

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
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.find("h1", id="firstHeading").get_text(strip=True)
        metadata = extract_metadata(soup)
        content_data = extract_main_content(soup, url)

        discussion_graph = None
        opinions = {"for": 0, "against": 0, "neutral": 0}

        opinion_users = {
            "for": [],
            "against": [],
            "neutral": []
        }


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


        with open("wikipedia_data.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        logger.info(f"Successfully extracted Wikipedia content for: {title}")
        return result
    except Exception as e:
        logger.error(f"Error fetching Wikipedia data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/analyze/network/{filename}")
async def analyze_network(filename: str, 
                          limit: int = 50,
                          min_length: int = 0,
                          max_length: int = 100,
                          limit_type: str = "first",
                          anonymize: bool = False):

    file_path = f"{filename}.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {file_path} not found.")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    
    if not links and "content" in data and len(data["content"]) > 0:
        if "discussion_graph" in data["content"][0]:
            links = data["content"][0]["discussion_graph"].get("links", [])
            if not nodes and "nodes" in data["content"][0]["discussion_graph"]:
                nodes = data["content"][0]["discussion_graph"].get("nodes", [])
    
    logger.info(f"Found {len(nodes)} nodes and {len(links)} links in {filename}")

    result = {
        "nodes": data.get("nodes", []),
        "links": data.get("links", [])
    }

    return result

    
def extract_metadata(soup):
    metadata = {}
    last_modified = soup.find("li", id="footer-info-lastmod")
    if last_modified:
        metadata["last_modified"] = last_modified.get_text(strip=True)
    return metadata


def count_indent_colons(text):
    match = re.match(r'^(:+)', text)
    return len(match.group(1)) if match else 0


def extract_user_and_timestamp(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    timestamp_link = soup.select_one('a.ext-discussiontools-init-timestamplink')
    if timestamp_link:
        timestamp = timestamp_link.get_text(strip=True)
        user_links = timestamp_link.find_parent().select('a[title^="User:"], a[title^="משתמש:"]')
        if user_links:
            username = user_links[0].get_text(strip=True)
            return username, timestamp

    user_links = soup.find_all("a", title=re.compile(r"^(User|משתמש):"))
    for user_link in user_links:
        username = user_link.get_text(strip=True)
        parent = user_link.find_parent()
        if not parent:
            continue
        siblings = parent.find_all_next(["a", "span", "time", "bdi"], limit=5)
        for sib in siblings:
            text = sib.get_text(strip=True)
            if re.search(r'\d{1,2}[:\.]\d{2}.*?\d{4}', text):
                return username, text

    html_text = str(soup)
    match = re.search(
        r'<a[^>]+title="(?:User|משתמש):([^"]+)"[^>]*>.*?</a>.*?(?:שיחה|talk|discussion).*?(\d{1,2}[:\.]\d{2}.*?\d{4})',
        html_text,
        re.DOTALL
    )
    if match:
        return match.group(1).strip(), match.group(2).strip()

    text = soup.get_text(separator=" ", strip=True)
    match_text_signature = re.search(
        r'([א-תA-Za-z0-9_\-\'\" ]{2,40})\s*-\s*(?:שיחה|talk)\s+(\d{1,2}[:\.]\d{2},?\s+\d{1,2}\s+[א-ת]+\s+\d{4})',
        text
    )
    if match_text_signature:
        return match_text_signature.group(1).strip(), match_text_signature.group(2).strip()

    return None, None


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
    seen_ids = set()

    content_div = soup.find("div", class_="mw-parser-output")
    if not content_div:
        content_div = soup.find("div", id="mw-content-text")
    if not content_div:
        logger.warning("Could not find any suitable content div")
        return []

    all_elements = content_div.find_all(
        ['h1', 'h2', 'h3', 'h4', 'li', 'p', 'div', 'dl', 'dd', 'dt', 'strong', 'b', 'span']
    )

    sections = []
    current_section = {"title": "Top", "comments": [], "participants": set(), "opinion_count": {"for": 0, "against": 0, "neutral": 0}}

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

        elif element.name in ['li', 'p', 'div', 'dd']:
            text = element.get_text(strip=True)
            if not text or len(text) < 5:
                continue

            html = str(element)
            indentation = count_indent_colons(text)
            username, timestamp = extract_user_and_timestamp(html)

            if username and timestamp:
                comment_text = re.sub(r'\s*' + re.escape(username) + r'.*$', '', text)
                opinion = analyze_comment_for_opinion(comment_text)
                current_section["opinion_count"][opinion] += 1
                
                element_id = element.get('id', "")
                reply_to_username = extract_reply_to_from_id(element_id)

                comment = {
                    "indentation": indentation,
                    "username": username,
                    "timestamp": timestamp,
                    "text": comment_text.strip(),
                    "opinion": opinion,
                    "reply_to": reply_to_username
                }

                current_section["participants"].add(username)
                current_section["comments"].append(comment)

    if current_section["comments"]:
        current_section["participants"] = list(current_section["participants"])
        current_section["participant_count"] = len(current_section["participants"])
        sections.append(current_section)

    for section in sections:
        tree = build_conversation_tree(section["comments"])
        for idx, node in tree.items():
            if node["parent"] is not None:
                parent_username = section["comments"][node["parent"]]["username"]
                section["comments"][idx]["reply_to"] = parent_username
        
        indentation_groups = {}
        for i, comment in enumerate(section["comments"]):
            indent = comment["indentation"]
            if indent not in indentation_groups:
                indentation_groups[indent] = []
            indentation_groups[indent].append(i)
        
        for indent, comment_indices in indentation_groups.items():
            if indent == 0 and len(comment_indices) > 1:
                try:
                    sorted_indices = sorted(comment_indices, 
                                        key=lambda i: section["comments"][i]["timestamp"])
                    
                    for j in range(1, len(sorted_indices)):
                        current_idx = sorted_indices[j]
                        prev_idx = sorted_indices[j-1]
                        
                        if section["comments"][current_idx].get("reply_to") is None:
                            section["comments"][current_idx]["reply_to"] = section["comments"][prev_idx]["username"]
                except Exception as e:
                    logger.warning(f"Error sorting comments by timestamp: {e}")
                    
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
        logger.info(f"Talk indicators checked: {talk_indicators}")
        logger.info(f"URL: {url}")
        logger.info(f"Decoded URL: {decoded_url}")

    return content_data

def extract_discussion_graph(soup, url):
 
    content_div = soup.find("div", class_="mw-parser-output")
    if not content_div:
        logger.warning("Could not find content div with class 'mw-parser-output'")
        return {"nodes": [], "links": []}
    
    comment_elements = content_div.select("[data-mw-comment-start], [id^='c-'], dl dd, dl dt")
    logger.info(f"Found {len(comment_elements)} potential comment elements")
    
    comments = []
    users = set()
    
    for element in comment_elements:
        text = element.get_text(strip=True)
        if not text or len(text) < 10:
            continue
        
        comment_html = str(element)
        username, timestamp = extract_user_and_timestamp(comment_html)
        
        if not username:
            if element.has_attr('id') and element['id'].startswith('c-'):
                id_parts = element['id'].split('-')
                if len(id_parts) > 1:
                    username = id_parts[1]
                    timestamp_elem = element.select_one('a.ext-discussiontools-init-timestamplink')
                    if timestamp_elem:
                        timestamp = timestamp_elem.get_text(strip=True)
        
        if username:
            indentation = 0
            parent_element = element.parent
            while parent_element:
                if parent_element.name == 'dl':
                    indentation += 1
                parent_element = parent_element.parent
            
            if indentation == 0 and text.startswith(':'):
                indentation = len(re.match(r'^(:+)', text).group(1))
            
            users.add(username)

            reply_to_username = extract_reply_to_from_id(element.get('id', ""))
            if reply_to_username and reply_to_username != username:
                users.add(reply_to_username)

            comments.append({
                "id": len(comments),
                "username": username,
                "timestamp": timestamp if timestamp else "",
                "indentation": indentation,
                "element_id": element.get('id', ""),
                "parent_id": None  
            })
            logger.info(f"Found comment by '{username}' with indentation {indentation}")
    
    conversation_tree = []
    comment_stack = []
    
    for comment in comments:
        indentation = comment["indentation"]
        
        while comment_stack and comment_stack[-1]["indentation"] >= indentation:
            comment_stack.pop()
        
        if comment_stack:
            parent_comment = comment_stack[-1]
            comment["parent_id"] = parent_comment["id"]
            conversation_tree.append({
                "source": comment["username"],
                "target": parent_comment["username"],
                "value": 1   
            })
            logger.info(f"Comment by '{comment['username']}' is a reply to '{parent_comment['username']}'")
        
        comment_stack.append(comment)
    
    nodes = [{"id": user, "name": user, "group": 1} for user in users]
    links = conversation_tree
    
    return {
        "nodes": nodes,
        "links": links
    }