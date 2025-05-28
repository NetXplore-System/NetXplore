import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Tabs,
  Tab,
  Accordion,
  Badge,
  ListGroup,
  OverlayTrigger,
  Tooltip,
  Container,
  Modal,
} from "react-bootstrap";
import {
  FileBarGraph,
  ChevronLeft,
  ChevronRight,
  BarChartFill,
  GearFill,
  NodePlus,
  PaletteFill,
  ArrowsCollapse,
  ArrowsExpand,
  NodeMinus,
  People,
  Activity,
  ImageFill,
  Table,
  Search,
  Diagram3Fill,
  GraphUp,
  Grid3x3,
  Download,
  ZoomIn,
  Link as LinkIcon,
  InfoCircleFill,
  Save,
  Eye,
  Share,
} from "react-bootstrap-icons";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { addToMain } from "../../redux/images/imagesSlice";

import NetworkCustomizationToolbar from "../../components/NetworkCustomizationToolbar";
import NetworkGraph from "../../components/network/NetworkGraph";
import NetworkDataTable from "../../components/NetworkDataTable";
import { graphMetrics } from "../../constants/graphMetrics";

import { detectCommunities } from "../../components/utils/ApiService";

import "../../styles/NetworkVisualization.css";

const NetworkVisualization = ({
  networkData,
  originalNetworkData,
  communities,
  communityMap,
  setCommunities,
  setCommunityMap,
  handleNetworkAnalysis,
  formData,
  setNetworkData,
  setOriginalNetworkData,
  uploadedFileName,
  filters,
  setShouldFetchCommunities,
  selectedMetric,
  setSelectedMetric,
  message,
  setMessage,
  shouldShowUserFilters = true,
}) => {
  const dispatch = useDispatch();
  const forceGraphRef = useRef(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("statistics");
  const [activeTab, setActiveTab] = useState("visualization");
  const [showHelp, setShowHelp] = useState(false);

  const [showDensity, setShowDensity] = useState(false);
  const [densityValue, setDensityValue] = useState(0);
  const [showDiameter, setShowDiameter] = useState(false);
  const [diameterValue, setDiameterValue] = useState(0);
  const [networkStats, setNetworkStats] = useState({});
  const [strongConnectionsActive, setStrongConnectionsActive] = useState(false);
  const [highlightCentralNodes, setHighlightCentralNodes] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [customizedNetworkData, setCustomizedNetworkData] = useState(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showOnlyIntraCommunityLinks, setShowOnlyIntraCommunityLinks] =
    useState(false);
  const [isDirectedGraph, setIsDirectedGraph] = useState(
    formData.isDirectedGraph
  );
  const [networkWasRestored, setNetworkWasRestored] = useState(false);
  const [showRemoveNodeModal, setShowRemoveNodeModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activityFilterEnabled, setActivityFilterEnabled] = useState(false);
  const [activityThreshold, setActivityThreshold] = useState(2);
  const [showCustomizationToolbar, setShowCustomizationToolbar] =
    useState(false);

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
        "#313659",
        "#5f6289",
        "#324b4a",
        "#158582",
        "#9092bc",
        "#c4c6f1",
      ],
      edgeColor: "rgba(128, 128, 128, 0.6)",
    },
    nodeSizes: {
      min: 15,
      max: 40,
    },
    colorScheme: "default",
    showImportantNodes: false,
    importantNodesThreshold: 0.5,
  });

  useEffect(() => {
    if (!networkData && uploadedFileName) {
      handleNetworkAnalysis();
    }
  }, []);

  useEffect(() => {
    setIsDirectedGraph(formData.isDirectedGraph);
  }, [formData.isDirectedGraph]);

  useEffect(() => {
    if (networkData) {
      calculateNetworkStats();

      if (networkData.nodes && networkData.links) {
        updateFilteredData();
      }
    }
  }, [networkData, filters.filter]);

  const updateFilteredData = () => {
    if (!networkData) return;

    const filtered = networkData.nodes.filter((node) =>
      node.id.toLowerCase().includes(filters.filter.toLowerCase())
    );

    setFilteredNodes(filtered);

    const filteredEdges = networkData.links.filter(
      (link) =>
        filtered.some(
          (node) =>
            node.id === link.source ||
            (typeof link.source === "object" && node.id === link.source.id)
        ) &&
        filtered.some(
          (node) =>
            node.id === link.target ||
            (typeof link.target === "object" && node.id === link.target.id)
        )
    );

    setFilteredLinks(filteredEdges);
  };

  const calculateNetworkStats = () => {
    if (!networkData) return;

    const { nodes, links } = networkData;
    const numNodes = nodes.length;
    const numEdges = links.length;
    const inDegreeMap = {};
    const outDegreeMap = {};
    let reciprocalEdges = 0;

    links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      inDegreeMap[targetId] = (inDegreeMap[targetId] || 0) + 1;
      outDegreeMap[sourceId] = (outDegreeMap[sourceId] || 0) + 1;

      if (
        links.some((l) => {
          const lSource = typeof l.source === "object" ? l.source.id : l.source;
          const lTarget = typeof l.target === "object" ? l.target.id : l.target;
          return lSource === targetId && lTarget === sourceId;
        })
      ) {
        reciprocalEdges++;
      }
    });

    const reciprocity =
      numEdges > 0 ? (reciprocalEdges / numEdges).toFixed(2) : 0;

    setNetworkStats({
      numNodes,
      numEdges,
      reciprocity,
      inDegreeMap,
      outDegreeMap,
    });
  };

  const handleToggleMetric = (metric) => {
    setSelectedMetric(selectedMetric === metric ? null : metric);
  };

  const handleDensityMetric = () => {
    const density = calculateDensity(networkData.nodes, networkData.links);
    setDensityValue(density.toFixed(4));
    setShowDensity(!showDensity);
  };

  const calculateDensity = (nodes, links) => {
    const n = nodes.length;
    const m = links.length;
    if (n < 2) return 0;
    return (2 * m) / (n * (n - 1));
  };

  const handleDiameterMetric = () => {
    setShowDiameter(!showDiameter);
    if (!showDiameter && networkData) {
      const diameter = calculateDiameter(networkData.nodes, networkData.links);
      setDiameterValue(diameter);
    }
  };

  const calculateDiameter = (nodes, links) => {
    if (nodes.length < 2) return 0;

    const distances = {};
    nodes.forEach((node) => {
      distances[node.id] = {};
      nodes.forEach(
        (n) => (distances[node.id][n.id] = node.id === n.id ? 0 : Infinity)
      );
    });

    links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      distances[sourceId][targetId] = 1;
      distances[targetId][sourceId] = 1;
    });

    nodes.forEach((k) => {
      nodes.forEach((i) => {
        nodes.forEach((j) => {
          if (
            distances[i.id][j.id] >
            distances[i.id][k.id] + distances[k.id][j.id]
          ) {
            distances[i.id][j.id] =
              distances[i.id][k.id] + distances[k.id][j.id];
          }
        });
      });
    });

    let maxDistance = 0;
    nodes.forEach((i) => {
      nodes.forEach((j) => {
        if (distances[i.id][j.id] !== Infinity) {
          maxDistance = Math.max(maxDistance, distances[i.id][j.id]);
        }
      });
    });

    return maxDistance;
  };

  const fetchCommunityData = () => {
    if (!uploadedFileName || !networkData || !networkData.nodes) {
      toast.error("No data available for community detection");
      return;
    }

    const params = filters.buildNetworkFilterParams();

    const isWikipedia = formData.platform === "wikipedia";
    const isWhatsApp = formData.platform === "whatsapp";

    const detectFn = isWikipedia
      ? detectWikipediaCommunities
      : detectCommunities;

    toast.promise(detectFn(uploadedFileName, params), {
      loading: "Detecting communities...",
      success: (data) => {
        if (data.communities && data.nodes) {
          const newCommunityMap = {};
          data.nodes.forEach((node) => {
            if (node.community !== undefined) {
              newCommunityMap[node.id.toString().trim()] = node.community;
            }
          });

          const updatedNodes = networkData.nodes.map((node) => {
            const normalizedId = node.id.toString().trim();
            const community = newCommunityMap[normalizedId];
            return community !== undefined ? { ...node, community } : node;
          });

          const updatedOriginalNodes = originalNetworkData.nodes.map((node) => {
            const normalizedId = node.id.toString().trim();
            const community = newCommunityMap[normalizedId];
            return community !== undefined ? { ...node, community } : node;
          });

          setNetworkData({
            nodes: updatedNodes,
            links: networkData.links,
          });

          setOriginalNetworkData({
            nodes: updatedOriginalNodes,
            links: originalNetworkData.links,
          });

          setCommunities(data.communities || []);
          setCommunityMap(newCommunityMap);

          loadCommunityColors(data.communities);

          return `Detected ${data.communities.length} communities in the network.`;
        } else {
          return "No community data returned from server.";
        }
      },
      error: (error) => {
        return error?.message || "Error detecting communities.";
      },
    });
  };

  const loadCommunityColors = (communities) => {
    if (!communities || communities.length === 0) {
      console.log("No communities to set colors for");
      return;
    }

    const communityColors = {};
    const communityNames = {};

    communities.forEach((community, index) => {
      const communityId = community.id;
      const colorArray = visualizationSettings.customColors.communityColors;
      communityColors[communityId] = colorArray[index % colorArray.length];
      communityNames[communityId] = `Community ${communityId}`;
    });

    const updatedSettings = {
      ...visualizationSettings,
      communityColors: communityColors,
      communityNames: communityNames,
      colorBy: "community",
      highlightCommunities: [],
    };

    setVisualizationSettings(updatedSettings);
    handleNetworkCustomization(updatedSettings);
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
        return (
          settings.nodeSizes.min +
          ratio * (settings.nodeSizes.max - settings.nodeSizes.min)
        );
      };

      if (settings.sizeBy === "messages") nodeSize = sizeByValue("messages");
      else if (settings.sizeBy === "degree") nodeSize = sizeByValue("degree");
      else if (settings.sizeBy === "betweenness")
        nodeSize = sizeByValue("betweenness");
      else if (settings.sizeBy === "pagerank")
        nodeSize = sizeByValue("pagerank");

      if (settings.colorBy === "community" && node.community !== undefined) {
        const communityId = parseInt(node.community, 10);
        nodeColor =
          settings.communityColors?.[communityId] ??
          settings.customColors.communityColors[
            communityId % settings.customColors.communityColors.length
          ];
      } else if (settings.colorBy === "degree") {
        const maxDegree = Math.max(
          ...customizedNodes.map((n) => n.degree || 0)
        );
        const ratio = maxDegree > 0 ? (node.degree || 0) / maxDegree : 0;
        nodeColor = interpolateColor(
          "#ffefca",
          settings.customColors.defaultNodeColor,
          ratio
        );
      } else if (settings.colorBy === "betweenness") {
        const maxBtw = Math.max(
          ...customizedNodes.map((n) => n.betweenness || 0)
        );
        const ratio = maxBtw > 0 ? (node.betweenness || 0) / maxBtw : 0;
        nodeColor = interpolateColor("#ffefca", "#FF5733", ratio);
      } else if (settings.colorBy === "pagerank") {
        const maxPR = Math.max(...customizedNodes.map((n) => n.pagerank || 0));
        const ratio = maxPR > 0 ? (node.pagerank || 0) / maxPR : 0;
        nodeColor = interpolateColor("#ffefca", "#3366CC", ratio);
      } else if (
        settings.colorBy === "custom" &&
        settings.highlightUsers.includes(node.id)
      ) {
        nodeColor = settings.customColors.highlightNodeColor;
      }

      if (
        settings.highlightCommunities?.includes(parseInt(node.community, 10))
      ) {
        node.isHighlightedCommunity = true;
      } else {
        node.isHighlightedCommunity = false;
      }

      if (settings.showImportantNodes) {
        const threshold = settings.importantNodesThreshold || 0.5;
        const maxBetweenness = Math.max(
          ...customizedNodes.map((n) => n.betweenness || 0)
        );
        const maxPageRank = Math.max(
          ...customizedNodes.map((n) => n.pagerank || 0)
        );
        const isImportant =
          node.betweenness / maxBetweenness > threshold ||
          node.pagerank / maxPageRank > threshold;

        if (isImportant) {
          nodeColor = settings.customColors.highlightNodeColor;
          nodeSize = Math.max(nodeSize, settings.nodeSizes.max * 0.8);
        }
      }

      node.size = nodeSize;
      node.color = nodeColor;
    }

    setCustomizedNetworkData({
      nodes: customizedNodes,
      links: customizedLinks,
    });
  };

  const interpolateColor = (color1, color2, ratio) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const handleHighlightCentralNodes = () => {
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
  };

  const handleStrongConnections = () => {
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
      const filteredLinks = networkData.links.filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        return (
          filteredNodes.some((node) => node.id === sourceId) &&
          filteredNodes.some((node) => node.id === targetId)
        );
      });

      setNetworkData({ nodes: filteredNodes, links: filteredLinks });
      setStrongConnectionsActive(true);
    }
  };

  const handleRestoreNetwork = () => {
    setNetworkWasRestored((prev) => !prev);
    if (activityFilterEnabled) {
      setActivityFilterEnabled(false);
    }
  };

  const handleRestoreGraphToOriginal = () => {
    if (originalNetworkData) {
      setNetworkData(JSON.parse(JSON.stringify(originalNetworkData)));
      setNetworkWasRestored(false);
      setActivityFilterEnabled(false);
    }
  };

  const handleNodeClick = (node) => {
    if (networkWasRestored) {
      setSelectedNode(node);
      setShowRemoveNodeModal(true);
    }
  };

  const handleRemoveNode = () => {
    if (!selectedNode || !networkData) return;

    const updatedNodes = networkData.nodes.filter(
      (node) => node.id !== selectedNode.id
    );

    const updatedLinks = networkData.links.filter((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      return sourceId !== selectedNode.id && targetId !== selectedNode.id;
    });

    if (!originalNetworkData) {
      setOriginalNetworkData(JSON.parse(JSON.stringify(networkData)));
    }

    setNetworkData({
      nodes: updatedNodes,
      links: updatedLinks,
    });

    setShowRemoveNodeModal(false);
    setSelectedNode(null);
  };

  const handleActivityFilter = () => {
    if (!networkData) return;

    const newState = !activityFilterEnabled;
    setActivityFilterEnabled(newState);

    if (newState) {
      if (!originalNetworkData) {
        setOriginalNetworkData(JSON.parse(JSON.stringify(networkData)));
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
        setNetworkData(JSON.parse(JSON.stringify(originalNetworkData)));
        setNetworkWasRestored(true);
      }
    }
  };

  const applyActivityFilter = (threshold) => {
    if (!networkData) return;

    if (!originalNetworkData) {
      setOriginalNetworkData(JSON.parse(JSON.stringify(networkData)));
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

    const activeNodes = networkData.nodes.filter(
      (node) => connectionCounts[node.id] >= threshold
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
  };

  const handleToggleCommunitiesFilter = () => {
    if (!networkData || !originalNetworkData) return;

    if (!communityMap || Object.keys(communityMap).length === 0) {
      fetchCommunityData();
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
        "#313659",
        "#5f6289",
        "#324b4a",
        "#158582",
        "#9092bc",
        "#c4c6f1",
        "#ff9800",
        "#4caf50",
        "#2196f3",
        "#e91e63",
        "#9c27b0",
        "#795548",
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
        `Showing only intra-community links and hiding isolated nodes. Removed ${
          networkData.links.length - filteredLinks.length
        } cross-community links.`
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
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector(".force-graph-container canvas");
    if (canvas) {
      dispatch(
        addToMain({
          data: canvas.toDataURL("image/png"),
        })
      );
      toast.success("Screenshot captured and saved to gallery");
    } else {
      toast.error("Could not capture screenshot - canvas not found");
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "statistics":
        return (
          <div className="section-content">
            <div className="section-title">Overview & Stats </div>
            {networkStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{networkStats.numNodes}</div>
                  <div className="stat-label">Nodes</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{networkStats.numEdges}</div>
                  <div className="stat-label">Links</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{networkStats.reciprocity}</div>
                  <div className="stat-label">Reciprocity</div>
                </div>
                {communities && communities.length > 0 && (
                  <div className="stat-card">
                    <div className="stat-value">{communities.length}</div>
                    <div className="stat-label">Communities</div>
                  </div>
                )}
                {showDensity && (
                  <div className="stat-card">
                    <div className="stat-value">{densityValue}</div>
                    <div className="stat-label">Density</div>
                  </div>
                )}
                {showDiameter && (
                  <div className="stat-card">
                    <div className="stat-value">{diameterValue}</div>
                    <div className="stat-label">Diameter</div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-3">
              <div className="section-subtitle">Additional Metrics</div>
              <div className="metrics-buttons">
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${showDensity ? "active" : ""}`}
                  onClick={handleDensityMetric}
                >
                  {showDensity ? "Hide Density" : "Show Density"}
                </Button>
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${showDiameter ? "active" : ""}`}
                  onClick={handleDiameterMetric}
                >
                  {showDiameter ? "Hide Diameter" : "Show Diameter"}
                </Button>
              </div>
              <div className="section-subtitle">Analysis</div>
              <div className="metrics-buttons">
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${showDataTable ? "active" : ""}`}
                  onClick={() => setShowDataTable(!showDataTable)}
                >
                  <Table className="me-2" />
                  {showDataTable ? "Hide Data Table" : "Show Data Table"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="section-content">
            <div className="section-title">Network Metrics</div>
            <p className="text-muted mb-3">
              Select a metric to analyze node importance in the network
            </p>
            <div className="metrics-grid">
              {graphMetrics.map((metric) => (
                <Button
                  key={metric}
                  variant="light"
                  className={`metric-btn mb-2 ${
                    selectedMetric === metric ? "active" : ""
                  }`}
                  onClick={() => handleToggleMetric(metric)}
                >
                  {metric}
                </Button>
              ))}
            </div>
            {selectedMetric && (
              <div className="metric-actions mt-3">
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${
                    highlightCentralNodes ? "active" : ""
                  }`}
                  onClick={handleHighlightCentralNodes}
                >
                  {highlightCentralNodes
                    ? "Clear Highlights"
                    : "Highlight Top Nodes"}
                </Button>
              </div>
            )}
          </div>
        );

      case "filters":
        return (
          <div className="section-content">
            <div className="section-title">Network Refinement</div>
            <div className="filters-list">
              <div className="filter-group mb-3">
                <div className="filter-label mb-2">Connection Strength</div>
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${
                    strongConnectionsActive ? "active" : ""
                  }`}
                  onClick={handleStrongConnections}
                >
                  <LinkIcon className="me-2" />
                  {strongConnectionsActive
                    ? "Show All"
                    : "Show Strong Connections"}
                </Button>
              </div>
              <div className="filter-group mb-3">
                <div className="filter-label mb-2">Node Removal</div>
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${
                    networkWasRestored ? "active" : ""
                  }`}
                  onClick={handleRestoreNetwork}
                >
                  <NodeMinus className="me-2" />
                  {networkWasRestored
                    ? "Restore Removed Node"
                    : "Remove Selected Node"}
                </Button>

                <Button
                  variant="light"
                  className="btn-block mb-2"
                  onClick={handleRestoreGraphToOriginal}
                >
                  <NodePlus className="me-2" />
                  Restore Full Graph
                </Button>
              </div>

              <div className="filter-group">
                <div className="filter-label mb-2">Community Structure</div>
                <Button
                  variant="light"
                  className={`btn-block mb-2 ${
                    showOnlyIntraCommunityLinks ? "active" : ""
                  }`}
                  onClick={handleToggleCommunitiesFilter}
                >
                  <People className="me-2" />
                  {showOnlyIntraCommunityLinks
                    ? "Show All Links"
                    : "Show Only Within-Community"}
                </Button>
              </div>
            </div>
          </div>
        );
      case "help":
        return (
          <div className="section-content">
            <div className="section-title">Help & Tips</div>
            <div className="help-content">
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Graph Navigation</Accordion.Header>
                  <Accordion.Body>
                    <ul className="help-list">
                      <li>
                        <strong>Zoom:</strong> Scroll wheel
                      </li>
                      <li>
                        <strong>Pan:</strong> Click and drag
                      </li>
                      <li>
                        <strong>Select node:</strong> Click on node
                      </li>
                      <li>
                        <strong>Move node:</strong> Drag node
                      </li>
                      <li>
                        <strong>Fix node:</strong> Double-click node
                      </li>
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Network Metrics</Accordion.Header>
                  <Accordion.Body>
                    <ul className="help-list">
                      <li>
                        <strong>Degree:</strong> Number of connections
                      </li>
                      <li>
                        <strong>Betweenness:</strong> Important bridge nodes
                      </li>
                      <li>
                        <strong>PageRank:</strong> Influential nodes
                      </li>
                      <li>
                        <strong>Density:</strong> How connected the network is
                      </li>
                      <li>
                        <strong>Diameter:</strong> Maximum distance between
                        nodes
                      </li>
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Refinement & Analysis</Accordion.Header>
                  <Accordion.Body>
                    <ul className="help-list">
                      <li>
                        <strong>Communities:</strong> Groups of densely
                        connected nodes
                      </li>
                      <li>
                        <strong>Activity Filter:</strong> Show only active nodes
                      </li>
                    </ul>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          </div>
        );

      default:
        return null;
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
    setStrongConnectionsActive(false);
    setHighlightCentralNodes(false);
    setFilteredNodes([]);
    setFilteredLinks([]);
    setShowOnlyIntraCommunityLinks(false);
    setActivityFilterEnabled(false);
    setActivityThreshold(2);
    setNetworkWasRestored(false);
    setVisualizationSettings({
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
          "#313659",
          "#5f6289",
          "#324b4a",
          "#158582",
          "#9092bc",
          "#c4c6f1",
        ],
        edgeColor: "rgba(128, 128, 128, 0.6)",
      },
      nodeSizes: {
        min: 15,
        max: 40,
      },
      colorScheme: "default",
      showImportantNodes: false,
      importantNodesThreshold: 0.5,
    });

    toast.success("Network reset to original state.");
  };

  return (
    <Card className="network-visualization-card">
      <Card.Body className="p-0">
        {!networkData ? (
          <div className="text-center p-5">
            <h3 className="mb-4">Network Visualization</h3>
            <p className="text-muted mb-4">
              Loading network graph... This may take a few moments depending on
              file size.
            </p>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="network-visualization-container">
            <Row className="g-0">
              <Col
                lg={sidebarCollapsed ? 1 : 3}
                md={sidebarCollapsed ? 2 : 4}
                className={`network-sidebar-col ${
                  sidebarCollapsed ? "collapsed" : ""
                } transition-width`}
              >
                {sidebarCollapsed ? (
                  <div className="icons-only-sidebar">
                    <Button
                      variant="link"
                      className="sidebar-toggle-btn p-2 mb-3"
                      onClick={toggleSidebar}
                    >
                      <ChevronRight size={20} />
                    </Button>

                    <Button
                      variant={
                        activeSection === "statistics" ? "primary" : "light"
                      }
                      className="icon-btn"
                      onClick={() => {
                        setActiveSection("statistics");
                        setSidebarCollapsed(false);
                      }}
                      title="Statistics"
                    >
                      <BarChartFill />
                    </Button>

                    <Button
                      variant={
                        activeSection === "metrics" ? "primary" : "light"
                      }
                      className="icon-btn"
                      onClick={() => {
                        setActiveSection("metrics");
                        setSidebarCollapsed(false);
                      }}
                      title="Metrics"
                    >
                      <GraphUp />
                    </Button>

                    <Button
                      variant={
                        activeSection === "filters" ? "primary" : "light"
                      }
                      className="icon-btn"
                      onClick={() => {
                        setActiveSection("filters");
                        setSidebarCollapsed(false);
                      }}
                      title="Refinement"
                    >
                      <Diagram3Fill />
                    </Button>

                    <Button
                      variant={activeSection === "help" ? "primary" : "light"}
                      className="icon-btn"
                      onClick={() => {
                        setActiveSection("help");
                        setSidebarCollapsed(false);
                      }}
                      title="Help"
                    >
                      <InfoCircleFill />
                    </Button>
                  </div>
                ) : (
                  <div className="full-sidebar p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Network Analysis</h5>
                      <Button
                        variant="light"
                        className="sidebar-toggle-btn p-2 mb-3"
                        onClick={toggleSidebar}
                      >
                        <ChevronLeft size={20} />
                      </Button>
                    </div>

                    <div className="sidebar-navigation mb-3">
                      <Button
                        variant={
                          activeSection === "statistics"
                            ? "primary"
                            : "outline-secondary"
                        }
                        className="me-1 mb-1"
                        onClick={() => setActiveSection("statistics")}
                      >
                        <BarChartFill className="me-1" /> Stats
                      </Button>
                      <Button
                        variant={
                          activeSection === "metrics"
                            ? "primary"
                            : "outline-secondary"
                        }
                        className="me-1 mb-1"
                        onClick={() => setActiveSection("metrics")}
                      >
                        <GraphUp className="me-1" /> Metrics
                      </Button>
                      <Button
                        variant={
                          activeSection === "filters"
                            ? "primary"
                            : "outline-secondary"
                        }
                        className="me-1 mb-1"
                        onClick={() => setActiveSection("filters")}
                      >
                        <Diagram3Fill className="me-1" /> Refinement
                      </Button>

                      <Button
                        variant={
                          activeSection === "help"
                            ? "primary"
                            : "outline-secondary"
                        }
                        className="me-1 mb-1"
                        onClick={() => setActiveSection("help")}
                      >
                        <InfoCircleFill className="me-1" /> Help
                      </Button>
                    </div>

                    {renderSectionContent()}
                  </div>
                )}
              </Col>

              <Col
                lg={sidebarCollapsed ? 11 : 9}
                md={sidebarCollapsed ? 10 : 8}
                className="graph-container-col transition-width"
              >
                <div className="graph-box">
                  <div className="quick-actions-bar p-2 d-flex justify-content-between align-items-center">
                    <div className="left-icons">
                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>Customize Network</Tooltip>}
                      >
                        <Button
                          variant={
                            showCustomizationToolbar
                              ? "primary"
                              : "outline-secondary"
                          }
                          size="sm"
                          onClick={() =>
                            setShowCustomizationToolbar(
                              !showCustomizationToolbar
                            )
                          }
                        >
                          <PaletteFill />
                        </Button>
                      </OverlayTrigger>

                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>Take Screenshot</Tooltip>}
                      >
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleScreenshot}
                        >
                          <ImageFill />
                        </Button>
                      </OverlayTrigger>

                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>Toggle Data Table</Tooltip>}
                      >
                        <Button
                          variant={
                            showDataTable ? "primary" : "outline-secondary"
                          }
                          size="sm"
                          onClick={() => setShowDataTable(!showDataTable)}
                        >
                          <Table />
                        </Button>
                      </OverlayTrigger>
                    </div>

                    <div className="center-badges">
                      {strongConnectionsActive && (
                        <Badge bg="info" className="me-2">
                          Strong Connections
                        </Badge>
                      )}
                      {activityFilterEnabled && (
                        <Badge bg="info" className="me-2">
                          Activity Filter: {activityThreshold}
                        </Badge>
                      )}
                      {showOnlyIntraCommunityLinks && (
                        <Badge bg="info" className="me-2">
                          Within-Community Links
                        </Badge>
                      )}
                      {highlightCentralNodes && (
                        <Badge bg="info" className="me-2">
                          Highlighting: {selectedMetric || "Degree"}
                        </Badge>
                      )}
                    </div>

                    <div className="right-icons">
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id="fit-tooltip">Fit to screen</Tooltip>
                        }
                      >
                        <Button
                          variant="outline-secondary"
                          className="btn-fit"
                          onClick={() => forceGraphRef.current?.zoomToFit(400)}
                        >
                          <ZoomIn className="me-1" /> Fit
                        </Button>
                      </OverlayTrigger>

                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id="fit-tooltip">Reset Network</Tooltip>
                        }
                      >
                        <Button
                          variant="outline-secondary"
                          className="btn-fit"
                          onClick={handleResetAll}
                        >
                          Reset
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </div>
                  {showCustomizationToolbar && (
                    <NetworkCustomizationToolbar
                      networkData={networkData}
                      communities={communities}
                      onApplyCustomization={handleNetworkCustomization}
                      initialSettings={visualizationSettings}
                    />
                  )}
                  <NetworkGraph
                    networkData={networkData}
                    filteredNodes={filteredNodes}
                    filteredLinks={filteredLinks}
                    customizedNetworkData={customizedNetworkData}
                    selectedMetric={selectedMetric}
                    highlightCentralNodes={highlightCentralNodes}
                    showMetrics={true}
                    visualizationSettings={visualizationSettings}
                    handleNodeClick={handleNodeClick}
                    networkWasRestored={networkWasRestored}
                    forceGraphRef={forceGraphRef}
                    isDirectedGraph={isDirectedGraph}
                  />
                </div>

                {showDataTable && networkData && (
                  <Modal
                    show={showDataTable}
                    onHide={() => setShowDataTable(false)}
                    size="xl"
                    centered
                    scrollable
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Network Data Table</Modal.Title>
                    </Modal.Header>
                    <Modal.Body
                      style={{ maxHeight: "80vh", overflowY: "auto" }}
                    >
                      <NetworkDataTable
                        networkData={networkData}
                        onClose={() => setShowDataTable(false)}
                      />
                    </Modal.Body>
                  </Modal>
                )}
              </Col>
            </Row>
          </div>
        )}

        {showRemoveNodeModal && selectedNode && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Remove Node from Network</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRemoveNodeModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to remove node{" "}
                    <strong>"{selectedNode.id}"</strong> from the network?
                  </p>
                  <p>
                    This will help analyze the impact of this user on the
                    network structure.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRemoveNodeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleRemoveNode}
                  >
                    Remove Node
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && <div className="alert alert-info m-3">{message}</div>}
      </Card.Body>
    </Card>
  );
};

export default NetworkVisualization;
