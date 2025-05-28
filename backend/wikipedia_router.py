from fastapi import APIRouter, Request, HTTPException
import requests
from bs4 import BeautifulSoup
import logging
import re
import json
from typing import List, Dict, Any
from datetime import datetime
import os
from models import Research, NetworkAnalysis  
from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict
import networkx as nx
from fastapi import Query
from community import community_louvain
from networkx.algorithms import community as nx_community

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
    txt_path = f"uploads/{filename}.txt"
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
                comment_text = text  
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

@router.post("/convert-wikipedia-to-txt")
async def convert_to_txt(request: Request):
    data = await request.json()
    filename = data.get("filename")
    section_title = data.get("section_title")
    if not filename or not section_title:
        raise HTTPException(status_code=400, detail="Missing filename or section_title")
    
    json_path = f"{filename}.json"
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail=f"File {json_path} not found")
    
    with open(json_path, "r", encoding="utf-8") as f:
        content = json.load(f)
    
    selected_section = next((s for s in content["content"][0]["sections"] if s["title"] == section_title), None)
    if not selected_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    txt_lines = []
    for comment in selected_section["comments"]:
        try:
            timestamp_match_he = re.match(r"(\d+):(\d+), (\d+) ב([א-ת]+) (\d+)", comment['timestamp'])
            
            timestamp_match_en = re.match(r"(\d+):(\d+), (\d+) ([A-Za-z]+) (\d+)", comment['timestamp'])
            
            timestamp_match_alt = re.match(r"(\d+):(\d+), (\d+)/(\d+)/(\d+)", comment['timestamp'])
            
            if timestamp_match_he:
                hour, minute, day, month_he, year = timestamp_match_he.groups()
                
                month_map_he = {
                    "ינואר": "01", "פברואר": "02", "מרץ": "03", "אפריל": "04",
                    "מאי": "05", "יוני": "06", "יולי": "07", "אוגוסט": "08",
                    "ספטמבר": "09", "אוקטובר": "10", "נובמבר": "11", "דצמבר": "12"
                }
                month = month_map_he.get(month_he, "01")
                
                whatsapp_date = f"{day.zfill(2)}/{month}/{year}"
                whatsapp_time = f"{hour.zfill(2)}:{minute.zfill(2)}:00"
                whatsapp_timestamp = f"[{whatsapp_date}, {whatsapp_time}]"
                
            elif timestamp_match_en:
                hour, minute, day, month_en, year = timestamp_match_en.groups()
                
                month_map_en = {
                    "January": "01", "February": "02", "March": "03", "April": "04",
                    "May": "05", "June": "06", "July": "07", "August": "08",
                    "September": "09", "October": "10", "November": "11", "December": "12",
                    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05",
                    "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Sept": "09",
                    "Oct": "10", "Nov": "11", "Dec": "12"
                }
                month = month_map_en.get(month_en, "01")
                
                whatsapp_date = f"{day.zfill(2)}/{month}/{year}"
                whatsapp_time = f"{hour.zfill(2)}:{minute.zfill(2)}:00"
                whatsapp_timestamp = f"[{whatsapp_date}, {whatsapp_time}]"
                
            elif timestamp_match_alt:
                hour, minute, day, month, year = timestamp_match_alt.groups()
                
                whatsapp_date = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
                whatsapp_time = f"{hour.zfill(2)}:{minute.zfill(2)}:00"
                whatsapp_timestamp = f"[{whatsapp_date}, {whatsapp_time}]"
                
            else:
                all_numbers = re.findall(r'\d+', comment['timestamp'])
                if len(all_numbers) >= 5: 
                    hour = all_numbers[0]
                    minute = all_numbers[1]
                    day = all_numbers[2]
                    month = all_numbers[3]
                    year = all_numbers[4]
                    
                    whatsapp_date = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
                    whatsapp_time = f"{hour.zfill(2)}:{minute.zfill(2)}:00"
                    whatsapp_timestamp = f"[{whatsapp_date}, {whatsapp_time}]"
                else:
                    print(f"Could not parse timestamp format: {comment['timestamp']}")
                    whatsapp_timestamp = "[01/01/2000, 12:00:00]"
            
            line = f"{whatsapp_timestamp} {comment['username']}: {comment['text']}"
            txt_lines.append(line)
            
        except Exception as e:
            print(f"Error processing comment: {e}, timestamp: {comment.get('timestamp', 'No timestamp')}")
            whatsapp_timestamp = "[01/01/2000, 12:00:00]"
            line = f"{whatsapp_timestamp} {comment.get('username', 'Unknown')}: {comment.get('text', '')}"
            txt_lines.append(line)
    
    txt_content = "\n".join(txt_lines)
    
    os.makedirs("uploads", exist_ok=True)
    
    txt_path = f"uploads/{filename}.txt"
    
    with open(txt_path, "w", encoding="utf-8") as txt_file:
        txt_file.write(txt_content)
    
    graph_data = build_graph_from_txt(txt_path)
    
    return {
            "message": "TXT created",
            "path": txt_path,
            "nodes": graph_data["nodes"],
            "links": graph_data["links"]
        }


def build_graph_from_txt(
    txt_path,
    limit=None,
    limit_type="first",
    min_length=None,
    max_length=None,
    anonymize=False,
    keywords=None,
    min_messages=None,
    max_messages=None,
    active_users=None,
    selected_users=None,
    username=None,
    start_date=None,
    start_time=None,
    end_date=None,
    end_time=None
):
    from utils import parse_date_time

    nodes = []
    links = []
    usernames = set()
    user_message_count = defaultdict(int)
    edges_counter = defaultdict(int)
    anonymized_map = {}

    with open(txt_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    filtered_lines = []

    start_dt = parse_date_time(start_date, start_time) if start_date or start_time else None
    end_dt = parse_date_time(end_date, end_time) if end_date or end_time else None

    for line in lines:
        match = re.match(r"\[([\d/\.]+), ([\d:]+)\] ([^:]+):(.*)", line)
        if match:
            date, time, user, text = match.groups()
            text = text.strip()
            user = user.strip()

            if (min_length is not None and len(text) < min_length) or (max_length is not None and len(text) > max_length):
                continue


            if keywords:
                keyword_list = [k.strip().lower() for k in keywords.split(",")]
                if not any(k in text.lower() for k in keyword_list):
                    continue

            timestamp_str = f"{date} {time}"
            try:
                message_dt = datetime.strptime(timestamp_str, "%d/%m/%Y %H:%M:%S")
                if (start_dt and message_dt < start_dt) or (end_dt and message_dt > end_dt):
                    continue
            except:
                pass   

            if username and username.strip().lower() != user.lower():
                continue

            filtered_lines.append((user, text))

    if limit and limit > 0:
        if limit_type == "last":
            filtered_lines = filtered_lines[-limit:]
        elif limit_type == "random":
            import random
            random.shuffle(filtered_lines)
            filtered_lines = filtered_lines[:limit]
        else:  
            filtered_lines = filtered_lines[:limit]

    previous_user = None

    for user, text in filtered_lines:
        original_user = user
        if anonymize:
            if user not in anonymized_map:
                anonymized_map[user] = f"User_{len(anonymized_map) + 1}"
            user = anonymized_map[user]

        usernames.add(user)
        user_message_count[user] += 1

        if previous_user and previous_user != user:
            edge = tuple(sorted([previous_user, user]))
            edges_counter[edge] += 1
        previous_user = user

    if min_messages or max_messages or active_users or selected_users:
        filtered_users = {u: c for u, c in user_message_count.items()
                          if (not min_messages or c >= min_messages) and
                             (not max_messages or c <= max_messages)}

        if active_users:
            sorted_users = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)
            filtered_users = dict(sorted_users[:active_users])

        if selected_users:
            selected_set = set([u.strip().lower() for u in selected_users.split(",")])
            filtered_users = {u: c for u, c in filtered_users.items() if u.lower() in selected_set}

        usernames = set(filtered_users.keys())

    G = nx.Graph()
    G.add_nodes_from(usernames)

    for edge, weight in edges_counter.items():
        if edge[0] in usernames and edge[1] in usernames:
            G.add_edge(edge[0], edge[1], weight=weight)

    is_connected = nx.is_connected(G) if len(G.nodes()) > 0 else False

    try:
        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G, weight="weight")
        if is_connected:
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank = nx.pagerank(G)
        else:
            largest_cc = max(nx.connected_components(G), key=len)
            subgraph = G.subgraph(largest_cc).copy()
            closeness_centrality = nx.closeness_centrality(subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(subgraph, max_iter=1000)
            pagerank = nx.pagerank(subgraph)
    except Exception as e:
        logger.warning(f"Error calculating metrics: {e}")
        degree_centrality = {}
        betweenness_centrality = {}
        closeness_centrality = {}
        eigenvector_centrality = {}
        pagerank = {}

    nodes_list = [
        {
            "id": user,
            "name": user,
            "group": 1,
            "messages": user_message_count.get(user, 0),
            "degree": round(degree_centrality.get(user, 0), 4),
            "betweenness": round(betweenness_centrality.get(user, 0), 4),
            "closeness": round(closeness_centrality.get(user, 0), 4),
            "eigenvector": round(eigenvector_centrality.get(user, 0), 4),
            "pagerank": round(pagerank.get(user, 0), 4)
        }
        for user in usernames
    ]

    links_list = [
        {"source": a, "target": b, "weight": w}
        for (a, b), w in edges_counter.items()
        if a in usernames and b in usernames
    ]

    logger.info(f"Created Wikipedia graph with {len(nodes_list)} nodes and {len(links_list)} links")

    return {
        "nodes": nodes_list,
        "links": links_list,
        "is_connected": is_connected
    }

def extract_massages(file_content, platform="whatsapp", limit_type="first", limit=None):

    messages = []
    
    lines = file_content.strip().split('\n')
    
    for line in lines:
        if platform == "whatsapp":
            match = re.match(r"\[([\d/\.]+), ([\d:]+)\] ([^:]+): (.*)", line)
            if match:
                date, time, username, text = match.groups()
                try:
                    if '/' in date:
                        day, month, year = date.split('/')
                    elif '.' in date:
                        day, month, year = date.split('.')
                    else:
                        continue
                    
                    hour, minute, second = time.split(':')
                    timestamp = f"{day}/{month}/{year}, {hour}:{minute}:{second}"
                    
                    if min_length <= len(text) <= max_length:
                        messages.append({
                            "timestamp": timestamp,
                            "user": username.strip(),
                            "message": text.strip()
                        })
                except:
                    continue
        
        elif platform == "wikipedia":
            match_with_tilde = re.match(r"\[([\d/\.]+), ([\d:]+)\] ~ ([^:]+): (.*)", line)
            match_without_tilde = re.match(r"\[([\d/\.]+), ([\d:]+)\] ([^:]+): (.*)", line)
            
            if match_with_tilde:
                date, time, username, text = match_with_tilde.groups()
            elif match_without_tilde:
                date, time, username, text = match_without_tilde.groups()
            else:
                continue
            try:
                if '/' in date:
                    day, month, year = date.split('/')
                elif '.' in date:
                    day, month, year = date.split('.')
                else:
                    continue
                
                hour, minute, second = time.split(':')
                timestamp = f"{day}/{month}/{year}, {hour}:{minute}:{second}"
                
                if min_length <= len(text) <= max_length:
                    messages.append({
                        "timestamp": timestamp,
                        "user": username.strip(),
                        "message": text.strip()
                    })
            except:
                continue
    
    if limit and limit > 0:
        if limit_type == "first":
            messages = messages[:limit]
        elif limit_type == "last":
            messages = messages[-limit:]
        elif limit_type == "random":
            import random
            random.shuffle(messages)
            messages = messages[:limit]
    
    print(f"🔹 Found {len(messages)} messages in {platform} format.")
    return messages

@router.get("/analyze/wikipedia-communities/{filename}")
async def analyze_wikipedia_communities(
    filename: str,
    algorithm: str = Query("louvain", description="Algorithm: louvain, girvan_newman, greedy_modularity"),
    limit: int = Query(50),
    min_length: int = Query(None),
    max_length: int = Query(None),
    limit_type: str = Query("first"),
    anonymize: bool = Query(False),
    keywords: str = Query(None),
    min_messages: int = Query(None),
    max_messages: int = Query(None),
    active_users: int = Query(None),
    selected_users: str = Query(None),
    username: str = Query(None),
    start_date: str = Query(None),
    start_time: str = Query(None),
    end_date: str = Query(None),
    end_time: str = Query(None)
):
    try:
        txt_path = f"uploads/{filename}.txt"
        if not os.path.exists(txt_path):
            raise HTTPException(status_code=404, detail=f"TXT file {txt_path} not found.")

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

        if not graph_data["nodes"] or not graph_data["links"]:
            logger.warning("No nodes or links found in Wikipedia data")
            return {
                "nodes": [],
                "links": [],
                "communities": [],
                "node_communities": {},
                "algorithm": algorithm,
                "num_communities": 0,
                "modularity": None,
                "warning": "No data found for community analysis"
            }

        G = nx.Graph()

        for node in graph_data["nodes"]:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in graph_data["links"]:
            source = link["source"]
            target = link["target"]
            weight = link.get("weight", 1)
            G.add_edge(source, target, weight=weight)

        communities = {}
        node_communities = {}

        if algorithm == "louvain":
            partition = community_louvain.best_partition(G)
            node_communities = partition
            for node, community_id in partition.items():
                communities.setdefault(community_id, []).append(node)

        elif algorithm == "girvan_newman":
            communities_iter = nx_community.girvan_newman(G)
            communities_list = list(next(communities_iter))
            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i

        elif algorithm == "greedy_modularity":
            communities_list = list(nx_community.greedy_modularity_communities(G))
            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity"
            )

        communities_list = []
        for community_id, nodes in communities.items():
            community_nodes_data = [node for node in graph_data["nodes"] if node["id"] in nodes]

            avg_betweenness = sum(node["betweenness"] for node in community_nodes_data) / len(community_nodes_data) if community_nodes_data else 0
            avg_pagerank = sum(node["pagerank"] for node in community_nodes_data) / len(community_nodes_data) if community_nodes_data else 0
            avg_messages = sum(node["messages"] for node in community_nodes_data) / len(community_nodes_data) if community_nodes_data else 0

            communities_list.append({
                "id": community_id,
                "size": len(nodes),
                "nodes": nodes,
                "avg_betweenness": round(avg_betweenness, 4),
                "avg_pagerank": round(avg_pagerank, 4),
                "avg_messages": round(avg_messages, 2)
            })

        communities_list.sort(key=lambda x: x["size"], reverse=True)

        for node in graph_data["nodes"]:
            node_id = node["id"]
            if node_id in node_communities:
                node["community"] = node_communities[node_id]

        modularity = community_louvain.modularity(node_communities, G) if algorithm == "louvain" else None

        logger.info(f"Found {len(communities)} communities using {algorithm} algorithm")

        return {
            "nodes": graph_data["nodes"],
            "links": graph_data["links"],
            "communities": communities_list,
            "node_communities": node_communities,
            "algorithm": algorithm,
            "num_communities": len(communities),
            "modularity": round(modularity, 4) if modularity is not None else None,
            "is_connected": graph_data.get("is_connected", False)
        }

    except Exception as e:
        logger.error(f"Error in Wikipedia community analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing communities: {str(e)}")
