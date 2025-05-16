import React, { useState } from "react";
import { Card, Button, Table } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";
import { useLocation } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";



const MetricsPanel = ({ networkStats, opinions, opinionUsers = {}  }) => {
  const [showNetworkStats, setShowNetworkStats] = useState(false);

  const stats = networkStats || {};
  const numNodes = stats.numNodes || 0;
  const numEdges = stats.numEdges || 0;
  const reciprocity = stats.reciprocity || 0;
  const inDegreeMap = stats.inDegreeMap || {};
  const outDegreeMap = stats.outDegreeMap || {};
  const [activeTab, setActiveTab] = useState("summary");



  const topNodeIds = Object.keys(inDegreeMap)
    .sort((a, b) => (inDegreeMap[b] || 0) - (inDegreeMap[a] || 0))
    .slice(0, 10);

  const location = useLocation();
  const isWikipediaPage = location.pathname === "/home_wikipedia";

  const forUsers = opinionUsers.for || [];
  const againstUsers = opinionUsers.against || [];
  const neutralUsers = opinionUsers.neutral || [];

  return (
    <Card className="metrics-card my-2">
      <h4 className="fw-bold d-flex justify-content-between align-items-center">
        Network Metrics
        <Button
          variant="link"
          className="metrics-toggle"
          onClick={() => setShowNetworkStats(!showNetworkStats)}
        >
          {showNetworkStats ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </Button>
      </h4>
      {showNetworkStats && (
        <div className="mt-2">
          <p>
            <strong>Nodes:</strong> {numNodes}
          </p>
          <p>
            <strong>Edges:</strong> {numEdges}
          </p>
          <p>
            <strong>Reciprocity:</strong> {reciprocity}
          </p>

           {isWikipediaPage && (
            <>
              <h5 className="fw-bold mt-3">Opinions</h5>
              
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="summary" title="Summary">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Opinion</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Support</td>
                        <td>{opinions.for}</td>
                      </tr>
                      <tr>
                        <td>Against</td>
                        <td>{opinions.against}</td>
                      </tr>
                      <tr>
                        <td>Neutral</td>
                        <td>{opinions.neutral}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Tab>
                
                <Tab eventKey="for" title={`Support (${forUsers.length})`}>
                  <div className="opinion-users-list">
                    {forUsers.length > 0 ? (
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Username</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forUsers.map((username, index) => (
                            <tr key={`for-${username}`}>
                              <td>{index + 1}</td>
                              <td>{username}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No users supporting</p>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="against" title={`Against (${againstUsers.length})`}>
                  <div className="opinion-users-list">
                    {againstUsers.length > 0 ? (
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Username</th>
                          </tr>
                        </thead>
                        <tbody>
                          {againstUsers.map((username, index) => (
                            <tr key={`against-${username}`}>
                              <td>{index + 1}</td>
                              <td>{username}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No users against</p>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="neutral" title={`Neutral (${neutralUsers.length})`}>
                  <div className="opinion-users-list">
                    {neutralUsers.length > 0 ? (
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Username</th>
                          </tr>
                        </thead>
                        <tbody>
                          {neutralUsers.map((username, index) => (
                            <tr key={`neutral-${username}`}>
                              <td>{index + 1}</td>
                              <td>{username}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No neutral users</p>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </>
          )}

          <h5 className="fw-bold mt-3">Top Nodes by Degree</h5>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>In-Degree</th>
                <th>Out-Degree</th>
              </tr>
            </thead>
            <tbody>
              {topNodeIds.length > 0 ? (
                topNodeIds.map((nodeId) => (
                  <tr key={nodeId}>
                    <td>{nodeId}</td>
                    <td>{inDegreeMap[nodeId] || 0}</td>
                    <td>{outDegreeMap[nodeId] || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default MetricsPanel;
