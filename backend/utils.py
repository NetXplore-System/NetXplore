from typing import List, Tuple, Any
from datetime import datetime
from collections import defaultdict, deque
import networkx as nx
import re
from collections import  defaultdict
from typing import List, Tuple, Dict
import os
import logging

logger = logging.getLogger(__name__)

MEDIA_RE = re.compile(r'\b(Media|image|video|GIF|sticker|Contact card) omitted\b', re.I)
timestamp_pattern = r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4},?\s\d{1,2}:\d{2}(?::\d{2})?\b"
spam_messages = [
    "הקבוצה נוצרה על ידי",
    "צורפו על ידי",
    "This message was deleted",
    "צורף/ה",
    "הצטרף/ה לקבוצה באמצעות קישור ההזמנה",
    "תמונת הקבוצה השתנתה על ידי",
    "תיאור הקבוצה שונה על ידי",
    "GIF הושמט",
    "סטיקר הושמט",
    "כרטיס איש קשר הושמט",
    "השמע הושמט",
    "סרטון הווידאו הושמט",
    "הוחלף למספר חדש. הקש/י כדי לשלוח הודעה או להוסיף מספר חדש.",
    "שם הקבוצה השתנה על ידי",
    "צירפת את",
    "הצטרף/ה",
    "צירף/ה",
    "התמונה הושמטה",
    "הודעה זו נמחקה",
    "צורפת על ידי" ,
    "הקבוצה נוצרה על ידי",
    "ההודעה נמחקה על ידי",
    "ההודעות והשיחות מוצפנות מקצה לקצה. לאף אחד מחוץ לצ'אט הזה, גם לא ל-WhatsApp, אין אפשרות לקרוא אותן ולהאזין להן.",
    "הצטרפת לקבוצה דרך קישור הזמנה של הקבוצה",
]
UPLOAD_FOLDER = "./uploads/" 


def detect_date_format(first_line: str) -> list[str]:
    if re.search(r"\[\d{1,2}[.]\d{1,2}[.]\d{4},\s\d{2}:\d{2}:\d{2}\]", first_line):
        return ["%d.%m.%Y, %H:%M:%S", "%d.%m.%Y, %H:%M"]
    elif re.search(r"\d{1,2}/\d{1,2}/\d{2,4},\s\d{1,2}:\d{2}", first_line):
        return ["%m/%d/%y, %H:%M", "%m/%d/%Y, %H:%M"]
    else:
        return ["%d/%m/%y, %H:%M", "%d.%m.%Y, %H:%M"]

def parse_date_time(date_str: str | None, time_str: str | None) -> datetime | None:
    if not date_str:
        return None
    try:
        if time_str:
            return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        else:
            return datetime.strptime(f"{date_str} 00:00:00", "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise ValueError("Invalid date/time format. Expected format: YYYY-MM-DD and HH:MM:SS")


def apply_comparison_filters(network_data, node_filter, min_weight):
    if not network_data or "nodes" not in network_data or "links" not in network_data:
        return network_data

    filtered_nodes = []
    if node_filter:
        filtered_nodes = [
            node for node in network_data["nodes"]
            if node_filter.lower() in node["id"].lower()
        ]
    else:
        filtered_nodes = network_data["nodes"]

    node_ids = {node["id"] for node in filtered_nodes}

    filtered_links = [
        link for link in network_data["links"]
        if (link["weight"] >= min_weight and
            (get_node_id(link["source"]) in node_ids) and
            (get_node_id(link["target"]) in node_ids))
    ]

    return {"nodes": filtered_nodes, "links": filtered_links}


def get_node_id(node_ref):
    if isinstance(node_ref, dict) and "id" in node_ref:
        return node_ref["id"]
    return node_ref


def find_common_nodes(original_data, comparison_data):
    original_ids = {node["id"] for node in original_data["nodes"]}
    comparison_ids = {node["id"] for node in comparison_data["nodes"]}
    return original_ids.intersection(comparison_ids)


def mark_common_nodes(network_data, common_node_ids):
    for node in network_data["nodes"]:
        node["isCommon"] = node["id"] in common_node_ids
    return network_data


def get_network_metrics(original_data, comparison_data, metrics_list):
    """Calculate network metrics for comparison."""
    if not metrics_list:
        return {}

    metrics_names = [m.strip() for m in metrics_list.split(",")]
    results = {}

    results["node_count"] = {
        "original": len(original_data["nodes"]),
        "comparison": len(comparison_data["nodes"]),
        "difference": len(comparison_data["nodes"]) - len(original_data["nodes"]),
        "percent_change": (
            ((len(comparison_data["nodes"]) - len(original_data["nodes"])) / len(original_data["nodes"])) * 100
            if len(original_data["nodes"]) > 0 else 0
        )
    }

    results["link_count"] = {
        "original": len(original_data["links"]),
        "comparison": len(comparison_data["links"]),
        "difference": len(comparison_data["links"]) - len(original_data["links"]),
        "percent_change": (
            ((len(comparison_data["links"]) - len(original_data["links"])) / len(original_data["links"])) * 100
            if len(original_data["links"]) > 0 else 0
        )
    }

    return results


def calculate_sequential_weights(
    sequence: List[Tuple[str, str]],
    n_prev: int = 3
) -> Dict[Tuple[str, str], float]:
    scheme = {2: [0.7, 0.3], 3: [0.5, 0.3, 0.2]}
    if n_prev not in scheme:
        raise ValueError("n_prev must be 2 or 3")
    weights = scheme[n_prev]

    window: deque = deque(maxlen=n_prev)
    edge_w: Dict[Tuple[str, str], float] = defaultdict(float)

    for curr, _ in sequence:
        seen: set[str] = set()
        for idx, prev in enumerate(reversed(window)):
            if prev == curr or prev in seen:
                continue 
            edge_w[(prev, curr)] += weights[idx]
            seen.add(prev)
        window.append(curr)

    return dict(edge_w)


def normalize_links_by_target(links: List[Dict[str, object]]) -> List[Dict[str, object]]:
    """Divide each link weight by the sum of incoming weights of its *target* node."""
    totals: Dict[str, float] = defaultdict(float)
    for link in links:
        totals[link["target"]] += link["weight"]
    for link in links:
        denom = totals[link["target"]]
        if denom:
            link["weight"] = round(link["weight"] / denom, 4)
    return links

async def extract_data(
    lines: List[str],
    start_datetime: datetime | None,
    end_datetime: datetime | None,
    limit: int,
    limit_type: str,
    min_length: int,
    max_length: int,
    keywords: str,
    min_messages: int,
    max_messages: int,
    active_users: int,
    selected_users: str,
    username: str,
    anonymize: bool,
    date_formats: List[str],
    for_history_network: bool = False  
) -> List[Tuple[str, str]]:

    keyword_list = [kw.strip().lower() for kw in keywords.split(",")] if keywords else []
    selected_user_list = [user.strip().lower() for user in selected_users.split(",")] if selected_users else []
    messages = []
    user_message_count = defaultdict(int)
    anonymized_map = {}
    nodes = set()
    edges_counter = defaultdict(int)
    previous_sender = None
    
    logger.info(f"🔹 Converted: start_datetime={start_datetime}, end_datetime={end_datetime}")

    filtered_lines = []
    current_message = ""
    current_datetime = None
    MEDIA_RE = re.compile(r'\b(Media|image|video|GIF|sticker|Contact card) omitted\b', re.I)

    for line in lines:
        line = re.sub(r"[\u200f\u202f\u202a\u202b\u202c\u202d\u202e\u200d]", "", line).strip()
        match = re.search(timestamp_pattern, line)

        if match:
            date_part = match.group()
            parsed = False
            for fmt in date_formats:
                try:
                    dt = datetime.strptime(date_part, fmt)
                    parsed = True
                    break
                except ValueError:
                    continue
            if not parsed:
                continue

            if not ": " in line:
                continue
            if any(spam in line for spam in spam_messages):
                continue
            if MEDIA_RE.search(line):
                continue

            if current_message and current_datetime:
                if (not start_datetime or current_datetime >= start_datetime) and \
                (not end_datetime or current_datetime <= end_datetime):
                    filtered_lines.append(current_message.strip())

            current_message = line
            current_datetime = dt
        else:
            if current_datetime:
                current_message += " " + line.strip()

    if current_message and current_datetime:
        if (not start_datetime or current_datetime >= start_datetime) and \
        (not end_datetime or current_datetime <= end_datetime):
            filtered_lines.append(current_message.strip())


    all_messages: List[Tuple[str, str]] = []
    for index, line in enumerate(filtered_lines):
        try:
            match = re.search(timestamp_pattern, line)
            timestamp = match.group()
            message_part = line.split(timestamp, 1)[1].strip(" -[]")
            sender, message_content = message_part.split(": ", 1)
            sender = sender.strip("~").replace("\u202a", "").strip()
            message_length = len(message_content)
            if (min_length and message_length < min_length) or (max_length and message_length > max_length):
                continue

            if username and sender.lower() != username.lower():
                continue

            if keywords and not any(kw in message_content.lower() for kw in keyword_list):
                continue

            all_messages.append((sender, message_content))

        except Exception as e:
            logger.error(f"Error processing line: {line.strip()} - {e}")
            continue


    if for_history_network:
        if limit:
            if limit_type == "last":
                selected_messages = all_messages[-limit:]
            else:
                selected_messages = all_messages[:limit]
        else:
            if limit_type == "last":
                selected_messages = all_messages[::-1]
            else:
                selected_messages = all_messages
    else:
        if limit:
            if limit_type == "last":
                selected_messages = all_messages[-limit:][::-1]
            else:
                selected_messages = all_messages[:limit]
        else:
            if limit_type == "last":
                selected_messages = all_messages[::-1]
            else:
                selected_messages = all_messages
        
    for line in selected_messages:
        sender, message_content = line
        user_message_count[sender] += 1
            
        if sender:
            if anonymize:
                sender = anonymize_name(sender, anonymized_map)

            nodes.add(sender)
            if previous_sender and previous_sender != sender:
                edge = tuple(sorted([previous_sender, sender]))
                edges_counter[edge] += 1
            previous_sender = sender
            
        messages.append((sender, message_content))

    if for_history_network:
        return {"messages": messages, "all_messages": filtered_lines}
    
    filtered_users = {
        user: count for user, count in user_message_count.items()
        if (not min_messages or count >= min_messages) and (not max_messages or count <= max_messages)
    }

    if active_users:
        sorted_users = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:active_users]
        filtered_users = dict(sorted_users)
    
    if selected_users:
        filtered_users = {user: count for user, count in filtered_users.items()
                            if user.lower() in selected_user_list}

    messages = [msg for msg in messages if msg[0] in filtered_users]
        
    filtered_nodes = set(filtered_users.keys())
    if anonymize:
        filtered_nodes = {anonymize_name(node, anonymized_map) for node in filtered_nodes}

    nodes_list = [
        {
            "id": node,
            "messages": user_message_count.get(node, 0),
            "degree": 0,  
            "betweenness": 0,
            "closeness": 0,
            "eigenvector": 0,
            "pagerank": 0
        }
        for node in filtered_nodes
    ]

    links_list = []
    for edge, weight in edges_counter.items():
        source, target = edge
        if source in filtered_nodes and target in filtered_nodes:
            links_list.append({
                "source": source,
                "target": target,
                "weight": weight
            })

    is_connected = False
    if nodes_list and links_list:
        G = nx.Graph()
        G.add_nodes_from([node["id"] for node in nodes_list])
        G.add_weighted_edges_from([(link["source"], link["target"], link["weight"]) for link in links_list])

        is_connected = nx.is_connected(G)

        if is_connected:
            degree_centrality = nx.degree_centrality(G)
            betweenness_centrality = nx.betweenness_centrality(G, weight="weight")
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank = nx.pagerank(G)

            for node in nodes_list:
                node_id = node["id"]
                node.update({
                    "degree": round(degree_centrality.get(node_id, 0), 4),
                    "betweenness": round(betweenness_centrality.get(node_id, 0), 4),
                    "closeness": round(closeness_centrality.get(node_id, 0), 4),
                    "eigenvector": round(eigenvector_centrality.get(node_id, 0), 4),
                    "pagerank": round(pagerank.get(node_id, 0), 4)
                })
        else:
            largest_cc = max(nx.connected_components(G), key=len)
            G_subgraph = G.subgraph(largest_cc).copy()

            degree_centrality = nx.degree_centrality(G_subgraph)
            betweenness_centrality = nx.betweenness_centrality(G_subgraph, weight="weight")
            closeness_centrality = nx.closeness_centrality(G_subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(G_subgraph, max_iter=1000)
            pagerank = nx.pagerank(G_subgraph)

            for node in nodes_list:
                node_id = node["id"]
                if node_id in largest_cc:
                    node.update({
                        "degree": round(degree_centrality.get(node_id, 0), 4),
                        "betweenness": round(betweenness_centrality.get(node_id, 0), 4),
                        "closeness": round(closeness_centrality.get(node_id, 0), 4),
                        "eigenvector": round(eigenvector_centrality.get(node_id, 0), 4),
                        "pagerank": round(pagerank.get(node_id, 0), 4)
                    })
    return {
        "messages": messages,
        "nodes": nodes_list,
        "links": links_list,
        "is_connected": is_connected
    }


def anonymize_name(name: str, mapping: dict[str, str]) -> str:
    if name not in mapping:
        if name.startswith('+972') or name.startswith('\u202a+972'):
            alias = f'Phone_{sum(a.startswith("Phone_") for a in mapping.values())+1}'
        else:
            alias = f'User_{len(mapping)+1}'
        mapping[name] = alias
    return mapping[name]



def clean_filter_value(key: str, value: Any):
    if key in ["min_messages", "max_messages", "active_users"]:
        if isinstance(value, str) and not value.strip():
            return None
        return int(value) if value is not None else None
    elif isinstance(value, str) and not value.strip():
        return None
    return value

# TODO: decide when we call this function 
def delete_old_files():
    """Delete files older than 20 hours based on their timestamp in the filename."""
    now = datetime.now()

    for filename in os.listdir(UPLOAD_FOLDER):
        if "-" in filename and filename.endswith(".txt"):
            name, timestamp_str = filename.rsplit("-", 1)
            timestamp_str = timestamp_str.replace(".txt", "")

            try:
                file_time = datetime.fromtimestamp(int(timestamp_str) / 1000)
                if now - file_time > timedelta(hours=20):
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    os.remove(file_path)
                    logger.info(f"Deleted old file: {file_path}")
            except ValueError:
                logger.warning(f"Skipping file with invalid timestamp format: {filename}")
                
                
                
def calculate_comparison_stats(original_nodes, comparison_nodes):
    if not original_nodes or not comparison_nodes:
        return None

    original_node_count = len(original_nodes)
    comparison_node_count = len(comparison_nodes)

    node_difference = comparison_node_count - original_node_count
    node_change_percent = (
        ((comparison_node_count - original_node_count) / original_node_count) * 100
        if original_node_count
        else 0
    )

    original_node_ids = {node.get("id") for node in original_nodes}
    comparison_node_ids = {node.get("id") for node in comparison_nodes}

    common_nodes = original_node_ids.intersection(comparison_node_ids)
    common_nodes_count = len(common_nodes)

    return {
        "original_node_count": original_node_count,
        "comparison_node_count": comparison_node_count,
        "node_difference": node_difference,
        "node_change_percent": round(node_change_percent, 2),
        "common_nodes_count": common_nodes_count,
    }