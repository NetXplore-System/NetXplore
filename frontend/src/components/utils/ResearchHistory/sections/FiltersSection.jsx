import React from 'react';
import { Button } from 'react-bootstrap';
import {
    Link as LinkIcon,
    NodeMinus,
    NodePlus,
    People,
} from "react-bootstrap-icons";

const FiltersSection = ({
    strongConnectionsActive,
    handleStrongConnections,
    networkWasRestored,
    handleRestoreNetwork,
    activityFilterEnabled,
    handleActivityFilter,
    showOnlyIntraCommunityLinks,
    handleToggleCommunitiesFilter
}) => {
    return (
        <div className="section-content">
            <div className="section-title">Network Refinement</div>
            <div className="filters-list">
                <div className="filter-group mb-3">
                    <div className="filter-label mb-2">Connection Strength</div>
                    <Button
                        variant="light"
                        className={`btn-block mb-2 ${strongConnectionsActive ? "active" : ""}`}
                        onClick={handleStrongConnections}
                    >
                        <LinkIcon className="me-2" />
                        {strongConnectionsActive ? "Show All" : "Show Strong Connections"}
                    </Button>
                </div>
                <div className="filter-group mb-3">
                    <div className="filter-label mb-2">Node Management</div>
                    <Button
                        variant="light"
                        className={`btn-block mb-2 ${networkWasRestored ? "active" : ""}`}
                        onClick={handleRestoreNetwork}
                    >
                        <NodeMinus className="me-2" />
                        {networkWasRestored ? "Restore Removed Node" : "Remove Selected Node"}
                    </Button>
                </div>
                <div className="filter-group mb-3">
                    <div className="filter-label mb-2">Activity Filter</div>
                    <Button
                        variant="light"
                        className={`btn-block mb-2 ${activityFilterEnabled ? "active" : ""}`}
                        onClick={handleActivityFilter}
                    >
                        <NodePlus className="me-2" />
                        {activityFilterEnabled ? "Show All Users" : "Filter by Activity"}
                    </Button>
                </div>
                <div className="filter-group">
                    <div className="filter-label mb-2">Community Structure</div>
                    <Button
                        variant="light"
                        className={`btn-block mb-2 ${showOnlyIntraCommunityLinks ? "active" : ""}`}
                        onClick={handleToggleCommunitiesFilter}
                    >
                        <People className="me-2" />
                        {showOnlyIntraCommunityLinks ? "Show All Links" : "Show Only Within-Community"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FiltersSection; 