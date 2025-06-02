import React from 'react';
import { Button, Badge, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import {
    PaletteFill,
    ImageFill,
    Table,
    ZoomIn,
} from "react-bootstrap-icons";

import NetworkCustomizationToolbar from '../../NetworkCustomizationToolbar';
import NetworkGraph from '../../network/NetworkGraph';
import NetworkDataTable from '../../NetworkDataTable';

const NetworkVisualizationArea = ({
    networkData,
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
    showOnlyIntraCommunityLinks
}) => {
    return (
        <div className="graph-box">
            <div className="quick-actions-bar p-2 d-flex justify-content-between align-items-center">
                <div className="left-icons">
                    <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>Customize Network</Tooltip>}
                    >
                        <Button
                            variant={showCustomizationToolbar ? "primary" : "outline-secondary"}
                            size="sm"
                            onClick={() => setShowCustomizationToolbar(!showCustomizationToolbar)}
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
                            variant={showDataTable ? "primary" : "outline-secondary"}
                            size="sm"
                            onClick={() => setShowDataTable(!showDataTable)}
                        >
                            <Table />
                        </Button>
                    </OverlayTrigger>
                </div>

                <div className="center-badges">
                    {strongConnectionsActive && (
                        <Badge bg="info" className="me-2">Strong Connections</Badge>
                    )}
                    {activityFilterEnabled && (
                        <Badge bg="info" className="me-2">Activity Filter</Badge>
                    )}
                    {showOnlyIntraCommunityLinks && (
                        <Badge bg="info" className="me-2">Within-Community Links</Badge>
                    )}
                    {highlightCentralNodes && (
                        <Badge bg="info" className="me-2">Highlighting: {selectedMetric || "Degree"}</Badge>
                    )}
                </div>

                <div className="right-icons">
                    <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip id="fit-tooltip">Fit to screen</Tooltip>}
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
                        overlay={<Tooltip id="reset-tooltip">Reset Network</Tooltip>}
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
            />

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
                    <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>
                        <NetworkDataTable
                            networkData={networkData}
                            onClose={() => setShowDataTable(false)}
                        />
                    </Modal.Body>
                </Modal>
            )}
        </div>
    );
};

export default NetworkVisualizationArea; 