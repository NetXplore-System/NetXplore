import React from 'react';
import { Row, Col } from 'react-bootstrap';
import NetworkSidebar from './NetworkSidebar';
import NetworkVisualizationArea from './NetworkVisualizationArea';

const NetworkVisualizationLayout = ({ sidebarProps, visualizationProps }) => {
    const { sidebarCollapsed } = sidebarProps;

    return (
        <div className="network-visualization-container">
            <Row className="g-0">
                <Col
                    lg={sidebarCollapsed ? 1 : 3}
                    md={sidebarCollapsed ? 2 : 4}
                    className={`network-sidebar-col ${sidebarCollapsed ? "collapsed" : ""} transition-width`}
                >
                    <NetworkSidebar {...sidebarProps} />
                </Col>

                <Col
                    lg={sidebarCollapsed ? 11 : 9}
                    md={sidebarCollapsed ? 10 : 8}
                    className="graph-container-col transition-width"
                >
                    <NetworkVisualizationArea {...visualizationProps} />
                </Col>
            </Row>
        </div>
    );
};

export default NetworkVisualizationLayout; 