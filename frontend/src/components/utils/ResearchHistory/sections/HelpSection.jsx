import React from 'react';
import { Accordion } from 'react-bootstrap';

const HelpSection = ({ research }) => {
    return (
        <div className="section-content">
            <div className="section-title">Help & Tips</div>
            <div className="help-content">
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Graph Navigation</Accordion.Header>
                        <Accordion.Body>
                            <ul className="help-list">
                                <li><strong>Zoom:</strong> Scroll wheel</li>
                                <li><strong>Pan:</strong> Click and drag</li>
                                <li><strong>Select node:</strong> Click on node</li>
                                <li><strong>Move node:</strong> Drag node</li>
                                <li><strong>Fix node:</strong> Double-click node</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>Network Metrics</Accordion.Header>
                        <Accordion.Body>
                            <ul className="help-list">
                                <li><strong>Degree:</strong> Number of connections</li>
                                <li><strong>Betweenness:</strong> Important bridge nodes</li>
                                <li><strong>PageRank:</strong> Influential nodes</li>
                                <li><strong>Density:</strong> How connected the network is</li>
                                <li><strong>Diameter:</strong> Maximum distance between nodes</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Research Information</Accordion.Header>
                        <Accordion.Body>
                            <ul className="help-list">
                                <li><strong>Research Name:</strong> {research?.research_name || 'N/A'}</li>
                                <li><strong>Platform:</strong> {research?.platform || 'N/A'}</li>
                                <li><strong>Created:</strong> {research?.created_at ? new Date(research.created_at).toLocaleDateString() : 'N/A'}</li>
                            </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </div>
        </div>
    );
};

export default HelpSection; 