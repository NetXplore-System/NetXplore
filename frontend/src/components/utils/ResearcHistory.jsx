import { Row, Col, Card } from 'react-bootstrap';
import { graphMetrics } from "../../constants/graphMetrics";
import { useState, useEffect, useRef } from 'react';
import NetworkCustomizationToolbar from '../NetworkCustomizationToolbar';
import NetworkGraph from '../network/NetworkGraph';
import NetworkDataTable from '../NetworkDataTable';
import { useNetworkData } from './hooks/useNetworkData';
import { useNetworkFilters } from './hooks/useNetworkFilters';
import ResearchInfo from './ResearchInfo';
import NetworkMetricsPanel from './NetworkMetricsPanel';

const ResearchHistory = ({ research }) => {
    const [showMetrics, setShowMetrics] = useState(true);
    const [showDataTable, setShowDataTable] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [showDensity, setShowDensity] = useState(false);
    const [densityValue, setDensityValue] = useState(0);
    const [showDiameter, setShowDiameter] = useState(false);
    const [diameterValue, setDiameterValue] = useState(0);
    const [visualizationSettings, setVisualizationSettings] = useState({
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
    });


    const forceGraphRef = useRef(null);

    const {
        networkData,
        setNetworkData,
        originalNetworkData,
        setOriginalNetworkData,
        customizedNetworkData,
        setCustomizedNetworkData,
        communities,
        communityMap,
        networkStats
    } = useNetworkData(research);

    const {
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
    } = useNetworkFilters(networkData, setNetworkData, originalNetworkData, setOriginalNetworkData, communityMap);

    const handleToggleMetric = (metric) => {
        setSelectedMetric(selectedMetric === metric ? null : metric);
    };

    const handleDensityMetric = () => {
        if (networkData) {
            const density = calculateDensity(networkData.nodes, networkData.links);
            setDensityValue(density.toFixed(4));
        }
        setShowDensity(!showDensity);
    };

    const handleDiameterMetric = () => {
        setShowDiameter(!showDiameter);
        if (!showDiameter && networkData) {
            const diameter = calculateDiameter(networkData.nodes, networkData.links);
            setDiameterValue(diameter);
        }
    };

    const handleNetworkCustomization = (settings) => {
        setVisualizationSettings(settings);
        if (!networkData) return;

        const customizedNodes = JSON.parse(JSON.stringify(networkData.nodes));
        const customizedLinks = JSON.parse(JSON.stringify(networkData.links));

        for (const node of customizedNodes) {
            let nodeSize = settings.nodeSizes.min;
            let nodeColor = settings.customColors.defaultNodeColor;

            const sizeByValue = (metric) => {
                const maxVal = Math.max(...customizedNodes.map((n) => n[metric] || 0));
                const ratio = maxVal > 0 ? (node[metric] || 0) / maxVal : 0;
                return settings.nodeSizes.min + ratio * (settings.nodeSizes.max - settings.nodeSizes.min);
            };

            if (settings.sizeBy === "messages") nodeSize = sizeByValue("messages");
            else if (settings.sizeBy === "degree") nodeSize = sizeByValue("degree");
            else if (settings.sizeBy === "betweenness") nodeSize = sizeByValue("betweenness");
            else if (settings.sizeBy === "pagerank") nodeSize = sizeByValue("pagerank");

            node.size = nodeSize;
            node.color = nodeColor;
        }

        setCustomizedNetworkData({
            nodes: customizedNodes,
            links: customizedLinks,
        });
    };

    // Utility functions for calculations (these would ideally be moved to a separate utils file)
    const calculateDensity = (nodes, links) => {
        if (nodes.length <= 1) return 0;
        return (2 * links.length) / (nodes.length * (nodes.length - 1));
    };

    const calculateDiameter = (nodes, links) => {
        // Simplified diameter calculation - in practice you'd use a proper graph algorithm
        return nodes.length > 0 ? Math.floor(Math.log2(nodes.length)) + 1 : 0;
    };


    const filteredNodes = networkData ? networkData.nodes : [];
    const filteredLinks = networkData
        ? networkData.links.filter(
            (link) =>
                filteredNodes.some((node) => node.id === link.source) &&
                filteredNodes.some((node) => node.id === link.target)
        )
        : [];

    const handleNodeClick = (node) => {
        if (networkWasRestored) {
            console.log('Node clicked:', node);
        }
    };


    useEffect(() => {
        if (forceGraphRef.current) {
            forceGraphRef.current.zoomToFit(400, 100);
        }
    }, [showMetrics, networkData]);

    return (
        <>
            <ResearchInfo research={research} />

            <div className='graph-container my-3'>
                <Row className="mt-4">
                    <NetworkMetricsPanel
                        showMetrics={showMetrics}
                        setShowMetrics={setShowMetrics}
                        selectedMetric={selectedMetric}
                        onToggleMetric={handleToggleMetric}
                        showDataTable={showDataTable}
                        setShowDataTable={setShowDataTable}
                        handleDensityMetric={handleDensityMetric}
                        handleDiameterMetric={handleDiameterMetric}
                        strongConnectionsActive={strongConnectionsActive}
                        handleStrongConnections={handleStrongConnections}
                        highlightCentralNodes={highlightCentralNodes}
                        handleHighlightCentralNodes={() => handleHighlightCentralNodes(selectedMetric)}
                        networkWasRestored={networkWasRestored}
                        handleRestoreNetwork={handleRestoreNetwork}
                        activityFilterEnabled={activityFilterEnabled}
                        handleActivityFilter={handleActivityFilter}
                        showOnlyIntraCommunityLinks={showOnlyIntraCommunityLinks}
                        handleToggleCommunitiesFilter={() => handleToggleCommunitiesFilter(forceGraphRef)}
                        networkStats={{
                            ...networkStats,
                            communities: communities ? communities.length : 0
                        }}
                        graphMetrics={graphMetrics}
                    />


                    <Col lg={9} md={12} className="graph-area">
                        {networkData && (
                            <NetworkCustomizationToolbar
                                networkData={networkData}
                                communities={communities}
                                onApplyCustomization={handleNetworkCustomization}
                                initialSettings={visualizationSettings}
                            />
                        )}

                        {(showDensity || showDiameter) && (
                            <Card className="density-card">
                                {showDensity && (
                                    <h5 className="fw-bold">Graph Density: {densityValue}</h5>
                                )}
                                {showDiameter && (
                                    <h5 className="fw-bold">Graph Diameter: {diameterValue}</h5>
                                )}
                            </Card>
                        )}

                        <Card className="graph-card">
                            <div className="graph-placeholder">
                                {networkData && (
                                    <div className="graph-container">
                                        <NetworkGraph
                                            networkData={networkData}
                                            filteredNodes={filteredNodes}
                                            filteredLinks={filteredLinks}
                                            customizedNetworkData={customizedNetworkData}
                                            selectedMetric={selectedMetric}
                                            highlightCentralNodes={highlightCentralNodes}
                                            showMetrics={showMetrics}
                                            visualizationSettings={visualizationSettings}
                                            handleNodeClick={handleNodeClick}
                                            networkWasRestored={networkWasRestored}
                                            forceGraphRef={forceGraphRef}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>

                        {showDataTable && networkData && (
                            <NetworkDataTable
                                networkData={networkData}
                                onClose={() => setShowDataTable(false)}
                            />
                        )}
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default ResearchHistory;