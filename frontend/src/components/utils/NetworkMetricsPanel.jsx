import { Row, Col, Button, Card } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, FileBarGraph } from 'react-bootstrap-icons';
import MetricsButton from '../common/MetricsButton';
import MetricsPanel from './HistoryStatePanel';
import './NetworkMetricsPanel.css';

const NetworkMetricsPanel = ({
    showMetrics,
    setShowMetrics,
    selectedMetric,
    onToggleMetric,
    showDataTable,
    setShowDataTable,
    handleDensityMetric,
    handleDiameterMetric,
    strongConnectionsActive,
    handleStrongConnections,
    highlightCentralNodes,
    handleHighlightCentralNodes,
    networkWasRestored,
    handleRestoreNetwork,
    activityFilterEnabled,
    handleActivityFilter,
    showOnlyIntraCommunityLinks,
    handleToggleCommunitiesFilter,
    networkStats,
    graphMetrics
}) => {
    return (
        <Col lg={3} md={12} className="mb-3 metrics-panel">
            <Card className="metrics-card">
                <h5 className="fw-bold d-flex justify-content-between align-items-center">
                    {showMetrics && "Graph Metrics"}
                    <Button
                        variant="link"
                        className="metrics-toggle"
                        onClick={() => setShowMetrics(!showMetrics)}
                    >
                        {showMetrics ? (
                            <ChevronLeft size={20} />
                        ) : (
                            <ChevronRight size={20} />
                        )}
                    </Button>
                </h5>
                {showMetrics && (
                    <div className="metrics-controls">
                        <MetricsButton
                            graphMetrics={graphMetrics}
                            selectedMetric={selectedMetric}
                            onToggleMetric={onToggleMetric}
                            onDensity={handleDensityMetric}
                            onDiameter={handleDiameterMetric}
                        />
                        <Button
                            className="metrics-item"
                            onClick={() => setShowDataTable(!showDataTable)}
                            variant={showDataTable ? "primary" : "outline-primary"}
                        >
                            <FileBarGraph className="me-1" />
                            <span>Explore Data Table</span>
                        </Button>
                        <Button
                            className={`metrics-item ${strongConnectionsActive ? "active" : ""}`}
                            onClick={handleStrongConnections}
                        >
                            <span>
                                {strongConnectionsActive
                                    ? "Show All Connections"
                                    : "Strongest Connections"}
                            </span>
                        </Button>
                        <Button
                            className={`metrics-item ${highlightCentralNodes ? "active" : ""}`}
                            onClick={handleHighlightCentralNodes}
                        >
                            <span>Highlight Central Nodes</span>
                        </Button>
                        <Button
                            className={`metrics-item ${networkWasRestored ? "active" : ""}`}
                            onClick={handleRestoreNetwork}
                        >
                            <span>Restore Original Network</span>
                        </Button>
                        <Button
                            className={`metrics-item ${activityFilterEnabled === true ? "active" : ""}`}
                            onClick={handleActivityFilter}
                        >
                            <span>
                                {activityFilterEnabled
                                    ? "Show All Users"
                                    : "Hide Inactive Users"}
                            </span>
                        </Button>
                        <Button
                            className={`metrics-item ${showOnlyIntraCommunityLinks ? "active" : ""}`}
                            onClick={handleToggleCommunitiesFilter}
                        >
                            <span>
                                {showOnlyIntraCommunityLinks
                                    ? "Show All Links"
                                    : "Hide Cross-Community Links"}
                            </span>
                        </Button>
                    </div>
                )}
            </Card>
            <div className="metrics-stats-panel">
                <MetricsPanel networkStats={networkStats} />
            </div>
        </Col>
    );
};

export default NetworkMetricsPanel; 