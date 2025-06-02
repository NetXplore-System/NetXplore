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
                
                

def calculate_comparison_stats(original_nodes, comparison_nodes, original_links=None, comparison_links=None):
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

    # Calculate edge count if links are provided
    original_link_count = len(original_links) if original_links else 0
    comparison_link_count = len(comparison_links) if comparison_links else 0
    link_difference = comparison_link_count - original_link_count
    link_change_percent = (
        ((comparison_link_count - original_link_count) / original_link_count) * 100
        if original_link_count
        else 0
    )

    # Calculate network density if links and nodes are provided
    original_density = (
        (original_link_count / ((original_node_count * (original_node_count - 1)) / 2))
        if original_node_count > 1 else 0
    )
    comparison_density = (
        (comparison_link_count / ((comparison_node_count * (comparison_node_count - 1)) / 2))
        if comparison_node_count > 1 else 0
    )
    density_difference = comparison_density - original_density
    density_change_percent = (
        ((comparison_density - original_density) / original_density) * 100
        if original_density
        else 0
    )

    return {
        "original_node_count": original_node_count,
        "comparison_node_count": comparison_node_count,
        "node_difference": node_difference,
        "node_change_percent": round(node_change_percent, 2),
        "common_nodes_count": common_nodes_count,
        "original_link_count": original_link_count,
        "comparison_link_count": comparison_link_count,
        "link_difference": link_difference,
        "link_change_percent": round(link_change_percent, 2),
        "original_density": round(original_density, 4),
        "comparison_density": round(comparison_density, 4),
        "density_difference": round(density_difference, 4),
        "density_change_percent": round(density_change_percent, 2)
    }