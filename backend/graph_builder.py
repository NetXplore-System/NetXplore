import re
import networkx as nx
from datetime import datetime
from collections import defaultdict
import logging
from utils import calculate_sequential_weights, normalize_links_by_target,MEDIA_RE, spam_messages
from utils import parse_date_time

logger = logging.getLogger("graph_builder")

from collections import defaultdict

def debug_check_target_weights(links):
    target_totals = defaultdict(float)
    for link in links:
        target_totals[link["target"]] += link["weight"]

    for target, total in target_totals.items():
        print(f"Target: {target}, Total Weight: {round(total, 4)}")

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
    end_time=None,
    directed=False,
    use_history=False,
    include_messages=False,
    normalize=False,
    history_length=3,
    message_weights=None,
    is_for_save=False,
    platform="wikipedia",
    algorithm="louvain"  
):
   

    def parse_whatsapp_datetime(date_str, time_str):
        timestamp_str = f"{date_str} {time_str}"
        
        formats_to_try = [
            "%d.%m.%Y %H:%M:%S",    
            "%d/%m/%Y %H:%M:%S",    
            "%m/%d/%y, %H:%M",      
            "%m/%d/%Y, %H:%M",      
            "%d.%m.%Y %H:%M",       
            "%d/%m/%Y %H:%M",       
        ]
        
        for fmt in formats_to_try:
            try:
                return datetime.strptime(timestamp_str, fmt)
            except ValueError:
                continue
        
        if ',' in timestamp_str:
            try:
                date_part, time_part = timestamp_str.split(', ')
                return datetime.strptime(f"{date_part} {time_part}", "%m/%d/%y %H:%M")
            except ValueError:
                pass
        
        return None

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
        
        if not match:
            match = re.match(r"([\d/]+), ([\d:]+) - ([^:]+):(.*)", line)
            
        if not match:
            match = re.match(r"([\d/]+), ([\d:]+) - (.*?):(.*)", line)

        if match:
            date, time, user, text = match.groups()
            text = text.strip()
            user = user.strip()

            user = user.lstrip('~ ')

            if (min_length is not None and min_length != '' and len(text) < int(min_length)) or (max_length is not None and max_length != '' and len(text) > int(max_length)):
                continue

            if keywords:
                keyword_list = [k.strip().lower() for k in keywords.split(",")]
                if not any(k in text.lower() for k in keyword_list):
                    continue

            message_dt = parse_whatsapp_datetime(date, time)
            if message_dt:
                if (start_dt and message_dt < start_dt) or (end_dt and message_dt > end_dt):
                    continue

            try:
                if any(spam in text for spam in spam_messages) or MEDIA_RE.search(text):
                    continue
            except NameError:
                pass

            if username and username.strip().lower() != user.lower():
                continue

            filtered_lines.append((user, text))

    if limit and limit != '' and int(limit) > 0:
        if limit_type == "last":
            filtered_lines = filtered_lines[-int(limit):]
        elif limit_type == "random":
            import random
            random.shuffle(filtered_lines)
            filtered_lines = filtered_lines[:int(limit)]
        else:  
            filtered_lines = filtered_lines[:int(limit)]

    all_messages = []
    for user, text in filtered_lines:
        if anonymize:
            if user not in anonymized_map:
                anonymized_map[user] = f"User_{len(anonymized_map) + 1}"
            user = anonymized_map[user]
        usernames.add(user)
        user_message_count[user] += 1
        all_messages.append((user, text))

    if use_history:
        history_n = int(history_length) if history_length else 3
        edges = calculate_sequential_weights(all_messages, n_prev=history_n, message_weights=message_weights)
        for (source, target), weight in edges.items():
            edge = (source, target)
            edges_counter[edge] += weight
    else:
        previous_user = None
        for user, _ in all_messages:
            if previous_user and previous_user != user:
                edge = (user, previous_user) if directed else tuple(sorted([user, previous_user]))
                edges_counter[edge] += 1
            previous_user = user

    if min_messages or max_messages or active_users or selected_users:
        filtered_users = {u: c for u, c in user_message_count.items()
                          if (not min_messages or min_messages == '' or c >= int(min_messages)) and
                             (not max_messages or max_messages == '' or c <= int(max_messages))}

        if active_users and active_users != '':
            sorted_users = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)
            filtered_users = dict(sorted_users[:int(active_users)])

        if selected_users:
            selected_set = set([u.strip().lower() for u in selected_users.split(",")])
            filtered_users = {u: c for u, c in filtered_users.items() if u.lower() in selected_set}

        usernames = set(filtered_users.keys())


    G = nx.DiGraph() if directed else nx.Graph()
    G.add_nodes_from(usernames)

    for edge, weight in edges_counter.items():
        if edge[0] in usernames and edge[1] in usernames:
            G.add_edge(edge[0], edge[1], weight=weight)

    if directed:
        is_connected = nx.is_weakly_connected(G) if len(G.nodes()) > 0 else False
    else:
        is_connected = nx.is_connected(G) if len(G.nodes()) > 0 else False

    try:
        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G, weight="weight")
        if is_connected:
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank = nx.pagerank(G)
        else:
            
            largest_cc = max(nx.weakly_connected_components(G), key=len) if directed else max(nx.connected_components(G), key=len)
            subgraph = G.subgraph(largest_cc).copy()
            closeness_centrality = nx.closeness_centrality(subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(subgraph, max_iter=1000)
            pagerank = nx.pagerank(subgraph)
    except Exception as e:
        logger.error(f"Error calculating centrality measures: {e}")
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
        {"source": a, "target": b, "weight": round(w, 3)}
        for (a, b), w in edges_counter.items()
        if a in usernames and b in usernames
    ]
    
    if normalize:
        print(" NORMALIZE FLAG IS TRUE")
        links_list = normalize_links_by_target(links_list)
        debug_check_target_weights(links_list)


    print(f"links_list: {links_list}")
    return {
        "nodes": nodes_list,
        "links": links_list,
        "is_connected": is_connected,
        "messages": all_messages
    }