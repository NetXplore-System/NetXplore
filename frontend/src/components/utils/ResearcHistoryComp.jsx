import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { addToMain } from "../../redux/images/imagesSlice";

import { useNetworkData } from '../../hooks/useNetworkData';
import { useNetworkFilters } from '../../hooks/useNetworkFilters';
import ResearchInfo from './ResearchInfo';
import NetworkVisualizationLayout from './ResearchHistory/NetworkVisualizationLayout';
import { networkUtils } from './ResearchHistory/utils';

import "../../styles/NetworkVisualization.css";

const ResearchHistory = ({ research }) => {
    const dispatch = useDispatch();
    const forceGraphRef = useRef(null);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState("statistics");
    const [showDataTable, setShowDataTable] = useState(false);
    const [showCustomizationToolbar, setShowCustomizationToolbar] = useState(false);

    const [selectedMetric, setSelectedMetric] = useState(null);
    const [showDensity, setShowDensity] = useState(false);
    const [densityValue, setDensityValue] = useState(0);
    const [showDiameter, setShowDiameter] = useState(false);
    const [diameterValue, setDiameterValue] = useState(0);

    const [visualizationSettings, setVisualizationSettings] = useState(
        networkUtils.getDefaultVisualizationSettings()
    );

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

    // Add function to reverse link direction for directed graphs
    const reverseLinksDirection = (links) => {
        return links.map(link => ({
            ...link,
            source: link.target,
            target: link.source
        }));
    };

    // Add function to get processed network data with correct arrow direction
    const getProcessedNetworkData = () => {
        if (!networkData) return null;
        
        let processedData = { ...networkData };
        
        // Reverse arrow direction if it's a directed graph (from target to source)
        if (research.filters?.directed) {
            processedData = {
                ...networkData,
                links: reverseLinksDirection(networkData.links)
            };
        }
        
        return processedData;
    };

    const handleToggleMetric = (metric) => {
        setSelectedMetric(selectedMetric === metric ? null : metric);
    };

    const handleDensityMetric = () => {
        if (networkData) {
            const density = networkUtils.calculateDensity(networkData.nodes, networkData.links);
            setDensityValue(density.toFixed(4));
        }
        setShowDensity(!showDensity);
    };

    const handleDiameterMetric = () => {
        setShowDiameter(!showDiameter);
        if (!showDiameter && networkData) {
            const diameter = networkUtils.calculateDiameter(networkData.nodes, networkData.links);
            setDiameterValue(diameter);
        }
    };

    const handleNetworkCustomization = (settings) => {
        setVisualizationSettings(settings);
        if (!networkData) return;

        // Use processed data (with reversed arrows if directed) for customization
        const dataToCustomize = getProcessedNetworkData();
        const customizedData = networkUtils.applyCustomization(dataToCustomize, settings);
        setCustomizedNetworkData(customizedData);
    };

    const handleScreenshot = () => {
        const canvas = document.querySelector(".force-graph-container canvas");
        if (canvas) {
            dispatch(addToMain({ data: canvas.toDataURL("image/png") }));
            toast.success("Screenshot captured and saved to gallery");
        } else {
            toast.error("Could not capture screenshot - canvas not found");
        }
    };

    const handleResetAll = () => {
        if (!originalNetworkData) return;

        setNetworkData(JSON.parse(JSON.stringify(originalNetworkData)));
        setCustomizedNetworkData(null);
        setSelectedMetric(null);
        setShowDensity(false);
        setDensityValue(0);
        setShowDiameter(false);
        setDiameterValue(0);
        setVisualizationSettings(networkUtils.getDefaultVisualizationSettings());

        toast.success("Network reset to original state.");
    };

    const handleNodeClick = (node) => {
        if (networkWasRestored) {
            console.log('Node clicked:', node);
        }
    };

    // Use processed network data for filtered nodes and links
    const processedNetworkData = getProcessedNetworkData();
    const filteredNodes = processedNetworkData ? processedNetworkData.nodes : [];
    const filteredLinks = processedNetworkData
        ? processedNetworkData.links.filter(
            (link) =>
                filteredNodes.some((node) => node.id === link.source) &&
                filteredNodes.some((node) => node.id === link.target)
        )
        : [];

    const sidebarProps = {
        activeSection,
        setActiveSection,
        sidebarCollapsed,
        setSidebarCollapsed: (collapsed) => setSidebarCollapsed(collapsed),
        networkStats,
        communities,
        selectedMetric,
        handleToggleMetric,
        showDensity,
        showDiameter,
        densityValue,
        diameterValue,
        handleDensityMetric,
        handleDiameterMetric,
        showDataTable,
        setShowDataTable,
        strongConnectionsActive,
        handleStrongConnections,
        networkWasRestored,
        handleRestoreNetwork,
        activityFilterEnabled,
        handleActivityFilter,
        showOnlyIntraCommunityLinks,
        handleToggleCommunitiesFilter: () => handleToggleCommunitiesFilter(forceGraphRef),
        highlightCentralNodes,
        handleHighlightCentralNodes: () => handleHighlightCentralNodes(selectedMetric),
        research
    };

    const visualizationProps = {
        networkData: processedNetworkData,
        filteredNodes,
        filteredLinks,
        customizedNetworkData,
        selectedMetric,
        highlightCentralNodes,
        visualizationSettings,
        handleNodeClick,
        networkWasRestored,
        forceGraphRef,
        showCustomizationToolbar,
        setShowCustomizationToolbar,
        communities,
        handleNetworkCustomization,
        showDataTable,
        setShowDataTable,
        handleScreenshot,
        handleResetAll,
        strongConnectionsActive,
        activityFilterEnabled,
        showOnlyIntraCommunityLinks,
        isDirectedGraph: research.filters?.directed || false
    };

    useEffect(() => {
        if (forceGraphRef.current) {
            forceGraphRef.current.zoomToFit(400, 100);
        }
    }, [networkData]);

    return (
        <div className="research-history-container">
            <ResearchInfo research={research} />
            
            <Card className="network-visualization-card mt-3">
                <Card.Body className="p-0">
                    {!networkData ? (
                        <div className="text-center p-5">
                            <h3 className="mb-4">Loading Network Data...</h3>
                            <p className="text-muted mb-4">
                                Please wait while we load the research data.
                            </p>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <NetworkVisualizationLayout
                            sidebarProps={sidebarProps}
                            visualizationProps={visualizationProps}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ResearchHistory;