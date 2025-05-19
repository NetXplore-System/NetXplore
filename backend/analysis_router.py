import os
import json
import logging
import re
from datetime import datetime
from collections import defaultdict
from typing import Dict

import networkx as nx
from community import community_louvain
from networkx.algorithms import community as nx_community

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse

from utils import (
    parse_date_time,
    detect_date_format,
    anonymize_name,
    apply_comparison_filters,
    find_common_nodes,
    mark_common_nodes,
    get_network_metrics,
    calculate_sequential_weights,
    extract_data,
    MEDIA_RE,
    timestamp_pattern,
    spam_messages
)


UPLOAD_FOLDER = "Uploads"  # Ensure this folder exists or adjust as needed

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/analyze/network/{filename}")
async def analyze_network(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
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
    try:
        logger.info(f"Analyzing file: {filename}, Anonymization: {anonymize}, Limit Type: {limit_type}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            raise HTTPException(detail=f"File '{filename}' not found.", status_code=404)

        nodes = set()
        user_message_count = defaultdict(int)
        edges_counter = defaultdict(int)
        previous_sender = None
        anonymized_map = {}


        keyword_list = [kw.strip().lower() for kw in keywords.split(",")] if keywords else []
        selected_user_list = [user.strip().lower() for user in selected_users.split(",")] if selected_users else []
        start_datetime = None
        end_datetime = None


        try:
            start_datetime = parse_date_time(start_date, start_time)
            end_datetime = parse_date_time(end_date, end_time)
        except ValueError as e:
            logger.error(f"Error parsing date/time: {e}")
            raise HTTPException(detail=str(e), status_code=400)

            
        logger.info(f"🔹 Converted: start_datetime={start_datetime}, end_datetime={end_datetime}")

        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        
        date_formats = detect_date_format(lines[0])
        filtered_lines = []
        current_message = ""
        current_datetime = None

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

        
        if limit_type == "last":
            selected_lines = filtered_lines[::-1]
        else:
            selected_lines = filtered_lines

        logger.info(f"🔹 Processing {len(selected_lines)} messages (Limit Type: {limit_type})")

        for i, line in enumerate(selected_lines):
            match = re.search(timestamp_pattern, line)
            try:
                timestamp = match.group()
                message_part = line.split(timestamp, 1)[1].strip(" -[]")
                sender, message_content = message_part.split(": ", 1)
                sender = sender.strip("~").replace("\u202a", "").strip()
                message_length = len(message_content)
                if (min_length and message_length < min_length) or (max_length and message_length > max_length):
                    logger.info(f"🔹 Message length {message_length} is out of bounds ({min_length}, {max_length}) index: {i}")
                    continue

                if username and sender.lower() != username.lower():
                    logger.info(f"🔹 Sender {sender} does not match username {username}. index: {i}")
                    continue

                if keywords and not any(kw in message_content.lower() for kw in keyword_list):
                    logger.info(f"🔹 Message does not contain keywords: {message_content}. index: {i}")
                    continue

                logger.info(f"🔹 Sender: {sender}, Message: {message_content}, line: {line}")

                user_message_count[sender] += 1
                
                if sender:
                    if anonymize:
                        sender = anonymize_name(sender, anonymized_map)

                    nodes.add(sender)
                    if previous_sender and previous_sender != sender:
                        edge = tuple(sorted([previous_sender, sender]))
                        edges_counter[edge] += 1
                    previous_sender = sender
                    
                if limit and sum(user_message_count.values()) >= limit:
                    logger.info(f"🔹 Reached limit of {limit} messages")
                    break
                    
            except Exception as e:
                logger.error(f"Error processing line: {line.strip()} - {e}. index: {i}")
                continue
            
        logger.info(f'🔹 Found {user_message_count} ')

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

        filtered_nodes = set(filtered_users.keys())
        if anonymize:
            filtered_nodes = {anonymize_name(node, anonymized_map) for node in filtered_nodes}

        G = nx.Graph()
        G.add_nodes_from(filtered_nodes)
        
        if G.number_of_nodes() == 0:
            logger.error("Warning: The graph is empty. No connectivity or centrality metrics can be calculated.")
            raise HTTPException(detail="The graph is empty. No data to analyze.", status_code=400)
            
        for (source, target), weight in edges_counter.items():
            if source in filtered_nodes and target in filtered_nodes:
                G.add_edge(source, target, weight=weight)

        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G, weight="weight", normalized=True)
        if not nx.is_connected(G):
            logger.warning("Warning: The graph is not fully connected. Betweenness centrality might be inaccurate.")

        if nx.is_connected(G):
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank_centrality = nx.pagerank(G, alpha=0.85)
        else:
            largest_cc = max(nx.connected_components(G), key=len)
            G_subgraph = G.subgraph(largest_cc).copy()
            closeness_centrality = nx.closeness_centrality(G_subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(G_subgraph, max_iter=1000)
            pagerank_centrality = nx.pagerank(G_subgraph, alpha=0.85)

        nodes_list = [
            { 
                "id": node,
                "messages": user_message_count.get(node, 0),
                "degree": round(degree_centrality.get(node, 0), 4),
                "betweenness": round(betweenness_centrality.get(node, 0), 4),
                "closeness": round(closeness_centrality.get(node, 0), 4),
                "eigenvector": round(eigenvector_centrality.get(node, 0), 4),
                "pagerank": round(pagerank_centrality.get(node, 0), 4),
            }
            for node in filtered_nodes
        ]

        links_list = []
        for edge, weight in edges_counter.items():
            source, target = edge

            if anonymize:
                source = anonymized_map.get(source, source)
                target = anonymized_map.get(target, target)

            if source in filtered_nodes and target in filtered_nodes:
                links_list.append({
                    "source": source,
                    "target": target,
                    "weight": weight
                })
        return JSONResponse(content={"nodes": nodes_list, "links": links_list}, status_code=200)
    except Exception as e:
        logger.error("Error:", e)
        raise HTTPException(detail=str(e), status_code=500)



@router.get("/analyze/decaying-network/{filename}")
async def analyze_decaying_network(
    filename: str,
    start_date: str = Query(None),
    start_time: str = Query(None),
    end_date: str = Query(None),
    end_time: str = Query(None),
    limit: int = Query(None),
    limit_type: str = Query("first"),
    min_length: int = Query(None),
    max_length: int = Query(None),
    keywords: str = Query(None),
    min_messages: int = Query(None),
    max_messages: int = Query(None),
    active_users: int = Query(None),
    selected_users: str = Query(None),
    username: str = Query(None),
    anonymize: bool = Query(False),
    n_prev: int = Query(3)
):
    try:
       
        selected_user_list = [u.strip().lower() for u in selected_users.split(",")] if selected_users else []
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            logger.error(f"File '{filename}' not found.")
            raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
        
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        try:
            start_datetime = parse_date_time(start_date, start_time)
            end_datetime = parse_date_time(end_date, end_time)
        except ValueError as e:
            logger.error(f"Error parsing date/time: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        date_formats = detect_date_format(lines[0])
        
        selected_messages = await extract_data(
            lines,
            start_datetime,
            end_datetime,
            limit,
            limit_type,
            min_length,
            max_length,
            keywords,
            min_messages,
            max_messages,
            active_users,
            selected_users,
            username,
            anonymize,
            date_formats,
            True
        )
        
        logger.info(f"found {len(selected_messages)} messages after filtering")
        if not selected_messages:
            logger.error("No messages found after filtering.")
            raise HTTPException(status_code=400, detail="No messages found after filtering.")
        
        seq_weights = calculate_sequential_weights(selected_messages, n_prev)

        user_counts: Dict[str, int] = defaultdict(int)
        for sender, _ in selected_messages:
            user_counts[sender] += 1

        filtered_users = {u: c for u, c in user_counts.items()
                          if (not min_messages or c >= min_messages)
                          and (not max_messages or c <= max_messages)}
        if active_users:
            top = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:active_users]
            filtered_users = dict(top)
        if selected_user_list:
            filtered_users = {u: c for u, c in filtered_users.items()
                              if u.lower() in selected_user_list}

        filtered_nodes = set(filtered_users.keys())

        G = nx.Graph()
        G.add_nodes_from(filtered_nodes)
        if not filtered_nodes:
            raise HTTPException(status_code=400, detail="No data to analyze after filtering.")

        for (prev, curr), w in seq_weights.items():
            if prev in filtered_nodes and curr in filtered_nodes:
                G.add_edge(prev, curr, weight=round(w, 2))

        deg = nx.degree_centrality(G)
        btw = nx.betweenness_centrality(G, weight="weight", normalized=True)
        if nx.is_connected(G):
            cls = nx.closeness_centrality(G)
            eig = nx.eigenvector_centrality(G, max_iter=1000)
            pr = nx.pagerank(G, alpha=0.85)
        else:
            comp = max(nx.connected_components(G), key=len)
            sub = G.subgraph(comp).copy()
            cls = nx.closeness_centrality(sub)
            eig = nx.eigenvector_centrality(sub, max_iter=1000)
            pr = nx.pagerank(sub, alpha=0.85)

        nodes_list = [
            {"id": u, "messages": user_counts.get(u, 0),
             "degree": round(deg.get(u, 0), 4),
             "betweenness": round(btw.get(u, 0), 4),
             "closeness": round(cls.get(u, 0), 4),
             "eigenvector": round(eig.get(u, 0), 4),
             "pagerank": round(pr.get(u, 0), 4)}
            for u in filtered_nodes
        ]

        links_list = [
            {"source": prev, "target": curr, "weight": w}
            for (prev, curr), w in seq_weights.items()
            if prev in filtered_nodes and curr in filtered_nodes
        ]

        return JSONResponse(content={"nodes": nodes_list, "links": links_list}, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in decaying network analysis:", e)
        raise HTTPException(status_code=500, detail=str(e))





@router.get("/analyze/compare-networks")
async def analyze_network_comparison(
        original_filename: str = Query(...),
        comparison_filename: str = Query(...),
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        min_weight: int = Query(1),
        node_filter: str = Query(""),
        highlight_common: bool = Query(False),
        metrics: str = Query(None)
):
    try:
        logger.info(f"Analyzing comparison between {original_filename} and {comparison_filename}")

        original_result = await analyze_network(
            original_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        comparison_result = await analyze_network(
            comparison_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        if hasattr(original_result, 'body'):
            original_data = json.loads(original_result.body)
        else:
            original_data = original_result

        if hasattr(comparison_result, 'body'):
            comparison_data = json.loads(comparison_result.body)
        else:
            comparison_data = comparison_result

        filtered_original = apply_comparison_filters(original_data, node_filter, min_weight)
        filtered_comparison = apply_comparison_filters(comparison_data, node_filter, min_weight)

        if highlight_common:
            common_nodes = find_common_nodes(filtered_original, filtered_comparison)
            mark_common_nodes(filtered_original, common_nodes)
            mark_common_nodes(filtered_comparison, common_nodes)

        return JSONResponse(content={
            "original": filtered_original,
            "comparison": filtered_comparison,
            "metrics": get_network_metrics(filtered_original, filtered_comparison, metrics)
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in network comparison: {e}")
        raise HTTPException(detail=str(e), status_code=500)


@router.get("/analyze/communities/{filename}")
async def analyze_communities(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False),
        algorithm: str = Query("louvain")
):
    try:
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time, limit, limit_type,
            min_length, max_length, keywords, min_messages, max_messages,
            active_users, selected_users, username, anonymize
        )

        if hasattr(network_result, 'body'):
            network_data = json.loads(network_result.body)
        else:
            network_data = network_result

        if "error" in network_data:
            logger.error(f"Error in network analysis: {network_data['error']}")
            raise HTTPException(detail=network_data["error"], status_code=400)

        G = nx.Graph()

        if not network_data["links"]:
            logger.error("No links found in the input data.")
            return JSONResponse(
                content={
                    "nodes": network_data["nodes"],
                    "links": [],
                    "communities": [],
                    "node_communities": {},
                    "algorithm": algorithm,
                    "num_communities": 0,
                    "modularity": None,
                    "warning": "No links found in the input data."
                },
                status_code=200
            )

        for node in network_data["nodes"]:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in network_data["links"]:
            source = link["source"]
            target = link["target"]
            weight = link.get("weight", 1)

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            G.add_edge(source, target, weight=weight)

        communities = {}
        node_communities = {}

        if algorithm == "louvain":
            partition = community_louvain.best_partition(G)
            node_communities = partition

            for node, community_id in partition.items():
                if community_id not in communities:
                    communities[community_id] = []
                communities[community_id].append(node)

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
                detail=f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity",
                status_code=400
            )
            

        communities_list = [
            {
                "id": community_id,
                "size": len(nodes),
                "nodes": nodes,
                "avg_betweenness": sum(network_data["nodes"][i]["betweenness"]
                                       for i, node in enumerate(network_data["nodes"])
                                       if node["id"] in nodes) / len(nodes) if nodes else 0,
                "avg_pagerank": sum(network_data["nodes"][i]["pagerank"]
                                    for i, node in enumerate(network_data["nodes"])
                                    if node["id"] in nodes) / len(nodes) if nodes else 0,
            }
            for community_id, nodes in communities.items()
        ]

        communities_list.sort(key=lambda x: x["size"], reverse=True)

        for i, node in enumerate(network_data["nodes"]):
            node_id = node["id"]
            if node_id in node_communities:
                network_data["nodes"][i]["community"] = node_communities[node_id]

        return JSONResponse(content={
            "nodes": network_data["nodes"],
            "links": network_data["links"],
            "communities": communities_list,
            "node_communities": node_communities,
            "algorithm": algorithm,
            "num_communities": len(communities),
            "modularity": community_louvain.modularity(node_communities, G) if algorithm == "louvain" else None
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in community detection: {e}")
        raise HTTPException(detail=str(e), status_code=500)


