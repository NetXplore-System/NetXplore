import os
import json
import logging
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
    apply_comparison_filters,
    find_common_nodes,
    mark_common_nodes,
    get_network_metrics,
    calculate_sequential_weights,
    extract_data,
    normalize_links_by_target
)


UPLOAD_FOLDER = "uploads"  

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
    anonymize: bool = Query(False),
    directed: bool = Query(False),
    use_history: bool = Query(False),
    normalize: bool = Query(False),
    history_length: int = Query(3),
    is_for_save: bool = False,
):
    try:
        logger.info(
            f"Analyzing file: {filename}, directed={directed}, history={use_history}, normalize={normalize}"
        )
        path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(path):
            raise HTTPException(404, f"File '{filename}' not found")

        try:
            start_dt = parse_date_time(start_date, start_time)
            end_dt = parse_date_time(end_date, end_time)
        except ValueError as e:
            raise HTTPException(400, str(e))

        raw_lines = open(path, encoding="utf-8").readlines()
        date_fmts = detect_date_format(raw_lines[0])

        result = await extract_data(
            raw_lines,
            start_dt,
            end_dt,
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
            date_fmts,
            True if directed else False,
        )

        if directed and use_history:
            selected_messages = result["messages"]
            if not selected_messages:
                raise HTTPException(400, "No messages found after filtering.")

            seq_weights = calculate_sequential_weights(selected_messages, history_length)
            user_counts: Dict[str, int] = defaultdict(int)
            for sender, _ in selected_messages:
                user_counts[sender] += 1

            sel_user_list = [u.strip().lower() for u in selected_users.split(',')] if selected_users else []
            filtered_users = {
                u: c for u, c in user_counts.items()
                if (not min_messages or c >= min_messages) and (not max_messages or c <= max_messages)
            }
            if active_users:
                filtered_users = dict(sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:active_users])
            if sel_user_list:
                filtered_users = {u: c for u, c in filtered_users.items() if u.lower() in sel_user_list}

            nodes = set(filtered_users.keys())
            if not nodes:
                raise HTTPException(400, "No data to analyze after filtering.")

            links = [
                {"source": prev, "target": curr, "weight": w}
                for (prev, curr), w in seq_weights.items()
                if prev in nodes and curr in nodes
            ]

            if normalize:
                links = normalize_links_by_target(links)
                logger.info("Weights normalized by target totals")

            G = nx.DiGraph()
            G.add_nodes_from(nodes)
            for link in links:
                G.add_edge(link["source"], link["target"], weight=link["weight"])

            deg = nx.degree_centrality(G)
            btw = nx.betweenness_centrality(G, weight="weight", normalized=True)
            if nx.is_connected(G.to_undirected()):
                cls = nx.closeness_centrality(G)
                eig = nx.eigenvector_centrality(G, max_iter=1000)
                pr = nx.pagerank(G, alpha=0.85)
            else:
                comp = max(nx.connected_components(G.to_undirected()), key=len)
                sub = G.subgraph(comp).copy()
                cls = nx.closeness_centrality(sub)
                eig = nx.eigenvector_centrality(sub, max_iter=1000)
                pr = nx.pagerank(sub, alpha=0.85)

            nodes_out = [
                {"id": u, "messages": user_counts[u],
                 "degree": round(deg.get(u, 0), 4),
                 "betweenness": round(btw.get(u, 0), 4),
                 "closeness": round(cls.get(u, 0), 4),
                 "eigenvector": round(eig.get(u, 0), 4),
                 "pagerank": round(pr.get(u, 0), 4)}
                for u in nodes
            ]
            return JSONResponse({"nodes": nodes_out, "links": links, "messages": selected_messages if is_for_save else None, "is_connected": nx.is_connected(G.to_undirected())}, status_code=200)

     
        return JSONResponse({"nodes": result["nodes"], "links": result["links"], "messages": result["messages"] if is_for_save else None, "is_connected": result["is_connected"]}, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze_network error", e)
        raise HTTPException(500, str(e))



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
        algorithm: str = Query("louvain"),
        directed: bool = Query(False),
        use_history: bool = Query(False),
        normalize: bool = Query(False),
        history_length: int = Query(3),
):
    try:
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time, limit, limit_type,
            min_length, max_length, keywords, min_messages, max_messages,
            active_users, selected_users, username, anonymize,
            directed, use_history, normalize, history_length
        )
        logger.info(f"Analyzing communities in file: {network_result} using algorithm: {algorithm}")
        if not network_result:
            logger.error("No network data found.")
            raise HTTPException(status_code=400, detail="No network data found.")
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
