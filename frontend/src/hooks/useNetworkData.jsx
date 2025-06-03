import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useNetworkData = (research) => {
    const [networkData, setNetworkData] = useState(research.analysis ? research.analysis : null);
    const [originalNetworkData, setOriginalNetworkData] = useState(research.analysis ? research.analysis : null);
    const [customizedNetworkData, setCustomizedNetworkData] = useState(null);
    const [communities, setCommunities] = useState([]);
    const [communityMap, setCommunityMap] = useState({});
    const [networkStats, setNetworkStats] = useState({});

    const calculateNetworkStats = useCallback(() => {
        if (!networkData) return;

        const { nodes, links } = networkData;
        const numNodes = nodes.length;
        const numEdges = links.length;
        const inDegreeMap = {};
        const outDegreeMap = {};
        let reciprocalEdges = 0;

        links.forEach((link) => {
            inDegreeMap[link.target] = (inDegreeMap[link.target] || 0) + 1;
            outDegreeMap[link.source] = (outDegreeMap[link.source] || 0) + 1;

            if (
                links.some((l) => l.source === link.target && l.target === link.source)
            ) {
                reciprocalEdges++;
            }
        });

        const reciprocity = numEdges > 0 ? (reciprocalEdges / numEdges).toFixed(2) : 0;

        setNetworkStats({
            numNodes,
            numEdges,
            reciprocity,
            inDegreeMap,
            outDegreeMap,
        });
    }, [networkData]);

    const fetchCommunityData = useCallback(async () => {
        if (!networkData) {
            toast.error("Data not found");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/history/analyze/communities?algorithm=${research.analysis?.algorithm || "louvain"}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nodes: networkData.nodes,
                    links: networkData.links,
                }),
            });
            
            const data = await response.json();
            if (data.communities && data.nodes) {
                setCommunities(data.communities);

                const newCommunityMap = {};
                data.nodes.forEach((node) => {
                    if (node.community !== undefined) {
                        newCommunityMap[node.id.toString().trim()] = node.community;
                    }
                });

                setCommunityMap(newCommunityMap);

                const updatedNodes = networkData.nodes.map((node) => {
                    const normalizedId = node.id.toString().trim();
                    const community = newCommunityMap[normalizedId];
                    if (community !== undefined) {
                        return { ...node, community };
                    }
                    return node;
                });

                setNetworkData({
                    nodes: updatedNodes,
                    links: networkData.links,
                });

                setOriginalNetworkData({
                    nodes: updatedNodes,
                    links: networkData.links,
                });

                toast.success(`Detected ${data.communities.length} communities in the network.`);
            } else {
                toast.error("No community data returned from server.");
            }
        } catch (error) {
            console.error("Error during community detection:", error);
            toast.error("An error occurred during community detection.");
        }
    }, [networkData, research.analysis?.algorithm]);

    useEffect(() => {
        if (networkData && networkData.nodes?.length > 0) {
            fetchCommunityData();
        }
    }, []);

    useEffect(() => {
        calculateNetworkStats();
    }, [calculateNetworkStats]);

    return {
        networkData,
        setNetworkData,
        originalNetworkData,
        setOriginalNetworkData,
        customizedNetworkData,
        setCustomizedNetworkData,
        communities,
        setCommunities,
        communityMap,
        setCommunityMap,
        networkStats,
        fetchCommunityData,
        calculateNetworkStats
    };
}; 