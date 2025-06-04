export const networkUtils = {
    /**
     * Calculate network density
     */
    calculateDensity: (nodes, links) => {
        if (nodes.length <= 1) return 0;
        return (2 * links.length) / (nodes.length * (nodes.length - 1));
    },

    /**
     * Calculate network diameter (simplified calculation)
     */
    calculateDiameter: (nodes, links) => {
        return nodes.length > 0 ? Math.floor(Math.log2(nodes.length)) + 1 : 0;
    },

    /**
     * Get default visualization settings
     */
    getDefaultVisualizationSettings: () => ({
        colorBy: "default",
        sizeBy: "default",
        highlightUsers: [],
        highlightCommunities: [],
        communityNames: {},
        communityColors: {},
        customColors: {
            defaultNodeColor: "#050d2d",
            highlightNodeColor: "#00c6c2",
            communityColors: [
                "#313659", "#5f6289", "#324b4a", "#158582", "#9092bc", "#c4c6f1",
            ],
            edgeColor: "rgba(128, 128, 128, 0.6)",
        },
        nodeSizes: { min: 15, max: 40 },
        colorScheme: "default",
        showImportantNodes: false,
        importantNodesThreshold: 0.5,
    }),

    /**
     * Apply customization settings to network data
     */
    applyCustomization: (networkData, settings) => {
        const customizedNodes = JSON.parse(JSON.stringify(networkData.nodes));
        const customizedLinks = JSON.parse(JSON.stringify(networkData.links));

        const sizeByValue = (node, metric) => {
            const maxVal = Math.max(...customizedNodes.map((n) => n[metric] || 0));
            const ratio = maxVal > 0 ? (node[metric] || 0) / maxVal : 0;
            return settings.nodeSizes.min + ratio * (settings.nodeSizes.max - settings.nodeSizes.min);
        };

        for (const node of customizedNodes) {
            let nodeSize = settings.nodeSizes.min;
            let nodeColor = settings.customColors.defaultNodeColor;

            // Apply size based on metric
            if (settings.sizeBy === "messages") nodeSize = sizeByValue(node, "messages");
            else if (settings.sizeBy === "degree") nodeSize = sizeByValue(node, "degree");
            else if (settings.sizeBy === "betweenness") nodeSize = sizeByValue(node, "betweenness");
            else if (settings.sizeBy === "pagerank") nodeSize = sizeByValue(node, "pagerank");

            // Apply color based on settings
            if (settings.colorBy === "community" && node.community !== undefined) {
                const communityId = parseInt(node.community, 10);
                nodeColor = settings.communityColors?.[communityId] ?? 
                    settings.customColors.communityColors[communityId % settings.customColors.communityColors.length];
            }

            node.size = nodeSize;
            node.color = nodeColor;
        }

        return {
            nodes: customizedNodes,
            links: customizedLinks,
        };
    },

    /**
     * Format network statistics for display
     */
    formatNetworkStats: (networkStats, communities) => ({
        ...networkStats,
        communities: communities ? communities.length : 0
    }),

    /**
     * Filter nodes and links based on search criteria
     */
    filterNetworkData: (networkData, filterText) => {
        if (!networkData || !filterText) return networkData;

        const filteredNodes = networkData.nodes.filter((node) =>
            node.id.toLowerCase().includes(filterText.toLowerCase())
        );

        const filteredLinks = networkData.links.filter(
            (link) =>
                filteredNodes.some((node) => node.id === link.source) &&
                filteredNodes.some((node) => node.id === link.target)
        );

        return {
            nodes: filteredNodes,
            links: filteredLinks
        };
    }
}; 