from typing import List, Tuple, Any
from datetime import datetime
from collections import defaultdict
import networkx as nx


async def extract_messages(lines: List[str], start_date: str, end_date: str, start_time: str, end_time: str, limit: int, limit_type: str, min_length: int, max_length: int, keywords: str, min_messages: int, max_messages: int, active_users: int, selected_users: str, username: str, anonymize: bool) -> List[Tuple[str, str]]:

    keyword_list = [kw.strip().lower() for kw in keywords.split(",")] if keywords else []
    selected_user_list = [user.strip().lower() for user in selected_users.split(",")] if selected_users else []
   
    start_datetime = None
    end_datetime = None

    if start_date and start_time:
        start_datetime = datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M:%S")
    elif start_date:
        start_datetime = datetime.strptime(f"{start_date} 00:00:00", "%Y-%m-%d %H:%M:%S")

    if end_date and end_time:
        end_datetime = datetime.strptime(f"{end_date} {end_time}", "%Y-%m-%d %H:%M:%S")
    elif end_date:
        end_datetime = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")

    print(f"🔹 Converted: start_datetime={start_datetime}, end_datetime={end_datetime}")

    filtered_lines = []

    for line in lines:
        if line.startswith("[") and "]" in line:
            date_part = line.split("] ")[0].strip("[]")
            try:
                current_datetime = datetime.strptime(date_part, "%d.%m.%Y, %H:%M:%S")
            except ValueError:
                continue
            
            if "~" not in line:
                continue
            
            if "צירפת את" in line or "הצטרף/ה" in line or "צירף/ה" in line or "התמונה הושמטה" in line or "צורפת על ידי" in line or "הודעה זו נמחקה" in line or "הקבוצה נוצרה על ידי" in line:
                    continue
            
            if ((start_datetime and current_datetime >= start_datetime) or not start_datetime) and \
                    ((end_datetime and current_datetime <= end_datetime) or not end_datetime):
                filtered_lines.append(line)
        else:
            if filtered_lines:
                filtered_lines[-1] += line 
            else:
                filtered_lines.append(line)

    print(f"🔹 Found {len(filtered_lines)} messages in the date range.")

    if limit and limit_type == "first":
        selected_lines = filtered_lines[:limit]
    elif limit and limit_type == "last":
        selected_lines = filtered_lines[-limit:]
    else:
        selected_lines = filtered_lines

    print(f"🔹 Processing {len(selected_lines)} messages (Limit Type: {limit_type})")

    messages = []
    user_message_count = defaultdict(int)
    anonymized_map = {}
    nodes = set()
    edges_counter = defaultdict(int)
    previous_sender = None

    for index, line in enumerate(selected_lines):
        try:
            if "omitted" in line or "omitted" in line:
                continue

            if line.startswith("[") and "]" in line and ": " in line:
                _, message_part = line.split("] ", 1)
                parts = message_part.split(":", 1)
                sender = parts[0].strip("~").replace("\u202a", "").strip()
                message_content = parts[1].strip() if len(parts) > 1 else ""
                message_length = len(message_content)
                if (min_length and message_length < min_length) or (max_length and message_length > max_length):
                    continue

                if username and sender.lower() != username.lower():
                    continue

                if keywords and not any(kw in message_content.lower() for kw in keyword_list):
                    continue

                if sender:
                    if anonymize:
                        sender = anonymize_name(sender, anonymized_map)

                    nodes.add(sender)
                    if previous_sender and previous_sender != sender:
                        edge = tuple(sorted([previous_sender, sender]))
                        edges_counter[edge] += 1
                    previous_sender = sender
                if "הצטרף" in message_content:
                    continue
                messages.append((sender, message_content))
                user_message_count[sender] += 1
        except Exception as e:
            print(f"Error processing line: {line.strip()} - {e}")
            continue

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
            "degree": 0,  # Will be calculated if graph is not empty
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

    # Only calculate network metrics if we have nodes and links
    is_connected = False
    if nodes_list and links_list:
        G = nx.Graph()
        G.add_nodes_from([node["id"] for node in nodes_list])
        G.add_weighted_edges_from([(link["source"], link["target"], link["weight"]) for link in links_list])

        is_connected = nx.is_connected(G)

        if is_connected:
            # Calculate centrality measures
            degree_centrality = nx.degree_centrality(G)
            betweenness_centrality = nx.betweenness_centrality(G, weight="weight")
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank = nx.pagerank(G)

            # Update node metrics
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
            # Handle disconnected graph
            largest_cc = max(nx.connected_components(G), key=len)
            G_subgraph = G.subgraph(largest_cc).copy()

            # Calculate metrics for largest connected component
            degree_centrality = nx.degree_centrality(G_subgraph)
            betweenness_centrality = nx.betweenness_centrality(G_subgraph, weight="weight")
            closeness_centrality = nx.closeness_centrality(G_subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(G_subgraph, max_iter=1000)
            pagerank = nx.pagerank(G_subgraph)

            # Update metrics for nodes in largest component
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


def anonymize_name(name, anonymized_map):
    if name.startswith("\u202a+972") or name.startswith("+972"):
        name = f"Phone_{len(anonymized_map) + 1}"
    if name not in anonymized_map:
        anonymized_map[name] = f"User_{len(anonymized_map) + 1}"
    return anonymized_map[name]



def clean_filter_value(key: str, value: Any):
    if key in ["min_messages", "max_messages", "active_users"]:
        if isinstance(value, str) and not value.strip():
            return None
        return int(value) if value is not None else None
    elif isinstance(value, str) and not value.strip():
        return None
    return value
