import os
import re
import json
import networkx as nx
from datetime import datetime
from collections import defaultdict
import logging
logger = logging.getLogger("graph_builder")


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
    use_triads=False,
    include_messages=False,
    normalize=False,
    history_length=None,
    is_for_save=False,
    platform="wikipedia",
    algorithm="louvain"  
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
