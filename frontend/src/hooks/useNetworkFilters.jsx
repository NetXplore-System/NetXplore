import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useNetworkFilters = (networkData, setNetworkData, originalNetworkData, setOriginalNetworkData, communityMap) => {
    const [strongConnectionsActive, setStrongConnectionsActive] = useState(false);
    const [highlightCentralNodes, setHighlightCentralNodes] = useState(false);
    const [networkWasRestored, setNetworkWasRestored] = useState(false);
    const [activityFilterEnabled, setActivityFilterEnabled] = useState(false);
    const [showOnlyIntraCommunityLinks, setShowOnlyIntraCommunityLinks] = useState(false);

    const handleStrongConnections = useCallback(() => {
        if (!networkData) return;

        if (strongConnectionsActive) {
            setNetworkData(originalNetworkData);
            setStrongConnectionsActive(false);
            setNetworkWasRestored(false);
        } else {
            const threshold = 0.2;
            const filteredNodes = networkData.nodes.filter(
                (node) => node.betweenness >= threshold
            );
            const filteredLinks = networkData.links.filter(
                (link) =>
                    filteredNodes.some((node) => node.id === link.source) &&
                    filteredNodes.some((node) => node.id === link.target)
            );

            setNetworkData({ nodes: filteredNodes, links: filteredLinks });
            setStrongConnectionsActive(true);
        }
    }, [networkData, originalNetworkData, strongConnectionsActive, setNetworkData]);

    const handleHighlightCentralNodes = useCallback((selectedMetric) => {
        if (!networkData) return;

        setHighlightCentralNodes(!highlightCentralNodes);
        setNetworkWasRestored(false);

        if (!highlightCentralNodes) {
            let centralityMeasure = "degree";
            if (selectedMetric === "Betweenness Centrality")
                centralityMeasure = "betweenness";
            else if (selectedMetric === "Closeness Centrality")
                centralityMeasure = "closeness";
            else if (selectedMetric === "Eigenvector Centrality")
                centralityMeasure = "eigenvector";
            else if (selectedMetric === "PageRank Centrality")
                centralityMeasure = "pagerank";

            const updatedNodes = networkData.nodes.map((node) => {
                const centralityValue = node[centralityMeasure] || 0;
                const sortedNodes = [...networkData.nodes].sort(
                    (a, b) => (b[centralityMeasure] || 0) - (a[centralityMeasure] || 0)
                );

                const thresholdIndex = Math.floor(sortedNodes.length * 0.2);
                const threshold =
                    thresholdIndex >= 0 && thresholdIndex < sortedNodes.length
                        ? sortedNodes[thresholdIndex][centralityMeasure] || 0
                        : 0;

                return {
                    ...node,
                    highlighted: centralityValue >= threshold,
                };
            });

            setNetworkData({
                ...networkData,
                nodes: updatedNodes,
            });
        } else {
            const resetNodes = networkData.nodes.map((node) => ({
                ...node,
                highlighted: false,
            }));

            setNetworkData({
                ...networkData,
                nodes: resetNodes,
            });
        }
    }, [networkData, highlightCentralNodes, setNetworkData]);

    const handleActivityFilter = useCallback(() => {
        if (!networkData) return;

        const newState = !activityFilterEnabled;
        setActivityFilterEnabled(newState);

        if (newState) {
            if (!originalNetworkData) {
                setOriginalNetworkData(networkData);
                setNetworkWasRestored(false);
            }

            const connectionCounts = {};
            networkData.nodes.forEach((node) => {
                connectionCounts[node.id] = 0;
            });

            networkData.links.forEach((link) => {
                const sourceId =
                    typeof link.source === "object" ? link.source.id : link.source;
                const targetId =
                    typeof link.target === "object" ? link.target.id : link.target;

                connectionCounts[sourceId] = (connectionCounts[sourceId] || 0) + 1;
                connectionCounts[targetId] = (connectionCounts[targetId] || 0) + 1;
            });

            const activityThreshold = 2; // Define threshold
            const activeNodes = networkData.nodes.filter(
                (node) => connectionCounts[node.id] >= activityThreshold
            );

            const activeLinks = networkData.links.filter((link) => {
                const sourceId =
                    typeof link.source === "object" ? link.source.id : link.source;
                const targetId =
                    typeof link.target === "object" ? link.target.id : link.target;

                return (
                    activeNodes.some((node) => node.id === sourceId) &&
                    activeNodes.some((node) => node.id === targetId)
                );
            });

            setNetworkData({
                nodes: activeNodes,
                links: activeLinks,
            });
        } else {
            if (originalNetworkData) {
                setNetworkData(originalNetworkData);
                setNetworkWasRestored(true);
            }
        }
    }, [networkData, originalNetworkData, activityFilterEnabled, setNetworkData, setOriginalNetworkData]);

    const handleRestoreNetwork = useCallback(() => {
        if (originalNetworkData) {
            if (networkWasRestored) {
                setNetworkWasRestored(false);
            } else {
                setNetworkData(originalNetworkData);
                setNetworkWasRestored(true);

                if (activityFilterEnabled) {
                    setActivityFilterEnabled(false);
                }
            }
        }
    }, [originalNetworkData, networkWasRestored, activityFilterEnabled, setNetworkData]);

    const handleToggleCommunitiesFilter = useCallback((forceGraphRef) => {
        if (!networkData || !originalNetworkData) return;

        if (!communityMap || Object.keys(communityMap).length === 0) {
            toast.error("Community data not found. Detecting communities...");
            return;
        }

        const newState = !showOnlyIntraCommunityLinks;
        setShowOnlyIntraCommunityLinks(newState);

        if (newState) {
            const filteredLinks = networkData.links.filter((link) => {
                const sourceId =
                    typeof link.source === "object" ? link.source.id : link.source;
                const targetId =
                    typeof link.target === "object" ? link.target.id : link.target;

                const sourceCommunity = communityMap[sourceId?.toString().trim()];
                const targetCommunity = communityMap[targetId?.toString().trim()];

                if (sourceCommunity === undefined || targetCommunity === undefined) {
                    return false;
                }

                return sourceCommunity === targetCommunity;
            });

            const connectedNodeIds = new Set();
            filteredLinks.forEach((link) => {
                const sourceId =
                    typeof link.source === "object" ? link.source.id : link.source;
                const targetId =
                    typeof link.target === "object" ? link.target.id : link.target;
                connectedNodeIds.add(sourceId);
                connectedNodeIds.add(targetId);
            });

            const communities = [...new Set(Object.values(communityMap))];
            const radius = 500;
            const angleStep = (2 * Math.PI) / communities.length;

            const communityCenters = {};
            communities.forEach((community, index) => {
                const angle = index * angleStep;
                communityCenters[community] = {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                };
            });

            const communityColors = [
                "#313659", "#5f6289", "#324b4a", "#158582", "#9092bc", "#c4c6f1",
                "#ff9800", "#4caf50", "#2196f3", "#e91e63", "#9c27b0", "#795548",
            ];

            const updatedNodes = networkData.nodes
                .filter((node) => connectedNodeIds.has(node.id))
                .map((node) => {
                    const community = communityMap[node.id?.toString().trim()];
                    const center = communityCenters[community];
                    const jitter = 30;

                    return {
                        ...node,
                        community,
                        originalX: node.x,
                        originalY: node.y,
                        x: center.x + (Math.random() * jitter * 2 - jitter),
                        y: center.y + (Math.random() * jitter * 2 - jitter),
                        color: communityColors[Number(community) % communityColors.length],
                    };
                });

            setNetworkData({
                nodes: updatedNodes,
                links: filteredLinks,
            });

            toast.success(
                `Showing only intra-community links and hiding isolated nodes. Removed ${networkData.links.length - filteredLinks.length} cross-community links.`
            );
        } else {
            const restoredNodes = originalNetworkData.nodes.map((node) => {
                const currentNode = networkData.nodes.find((n) => n.id === node.id);
                if (
                    currentNode &&
                    currentNode.originalX !== undefined &&
                    currentNode.originalY !== undefined
                ) {
                    return {
                        ...node,
                        x: currentNode.originalX,
                        y: currentNode.originalY,
                    };
                }
                return node;
            });

            setNetworkData({
                nodes: restoredNodes,
                links: originalNetworkData.links,
            });

            toast.success("Showing all links in the network.");
        }

        if (forceGraphRef.current) {
            setTimeout(() => {
                forceGraphRef.current.d3ReheatSimulation();
                forceGraphRef.current.zoomToFit(400);
            }, 100);
        }
    }, [networkData, originalNetworkData, communityMap, showOnlyIntraCommunityLinks, setNetworkData]);

    return {
        strongConnectionsActive,
        highlightCentralNodes,
        networkWasRestored,
        activityFilterEnabled,
        showOnlyIntraCommunityLinks,
        handleStrongConnections,
        handleHighlightCentralNodes,
        handleActivityFilter,
        handleRestoreNetwork,
        handleToggleCommunitiesFilter
    };
}; 