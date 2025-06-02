import React from 'react';
import { Button } from 'react-bootstrap';
import { Table } from "react-bootstrap-icons";

const StatisticsSection = ({
    networkStats,
    communities,
    showDensity,
    showDiameter,
    densityValue,
    diameterValue,
    handleDensityMetric,
    handleDiameterMetric,
    showDataTable,
    setShowDataTable
}) => {
    return (
        <div className="section-content">
            <div className="section-title">Overview & Stats</div>
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
};

export default StatisticsSection; 