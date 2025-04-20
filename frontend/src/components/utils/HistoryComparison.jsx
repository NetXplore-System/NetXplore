import React, { useState } from "react";
import { Button, Card,Table } from "react-bootstrap";
import ComparisonGraph from "../comparison/ComparisonGraph";
import { PlusCircle, DashCircle } from 'react-bootstrap-icons';
import styled from "styled-components";

const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2rem;
  margin-top: 2rem;
`;

const ComparisonGrid = styled.div`
  display: grid;
  margin-top: 2rem;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  & > :first-child {
    grid-row: 1 / 2;
    grid-column: 1 / 3;
  }
  
  & > :nth-child(2) {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
  }
  
  & > :nth-child(3) {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
  }
  
  & > :nth-child(4) {
    grid-row: 3 / 4;
    grid-column: 1 / 3;
  }
`;


const ComparisonHistory = ({
    research
}) => {
    const [activeIndexes, setActiveIndexes] = useState(research?.comparisons?.map((_, index) => index) || []);


    const calculateComparisonStats = (originalData, comparisonData) => {
        if (!originalData || !comparisonData) {
            return null;
        }

        const originalNodeCount = originalData.nodes.length;
        const comparisonNodeCount = comparisonData.nodes.length;
        const originalLinkCount = originalData.links.length;
        const comparisonLinkCount = comparisonData.links.length;

        const nodeDifference = comparisonNodeCount - originalNodeCount;
        const linkDifference = comparisonLinkCount - originalLinkCount;

        const nodeChangePercent = originalNodeCount
            ? (
                ((comparisonNodeCount - originalNodeCount) / originalNodeCount) *
                100
            ).toFixed(2)
            : 0;
        const linkChangePercent = originalLinkCount
            ? (
                ((comparisonLinkCount - originalLinkCount) / originalLinkCount) *
                100
            ).toFixed(2)
            : 0;

        const originalNodeIds = new Set(originalData.nodes.map((node) => node.id));
        const comparisonNodeIds = new Set(
            comparisonData.nodes.map((node) => node.id)
        );

        const commonNodes = [...originalNodeIds].filter((id) =>
            comparisonNodeIds.has(id)
        );
        const commonNodesCount = commonNodes.length;

        return {
            originalNodeCount,
            comparisonNodeCount,
            originalLinkCount,
            comparisonLinkCount,
            nodeDifference,
            linkDifference,
            nodeChangePercent,
            linkChangePercent,
            commonNodesCount,
        };
    };

    
    const toggleComparison = (index) => {
        setActiveIndexes(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <>
           {research?.comparisons?.length > 0 && (
               <ComparisonContainer>
                        <h3 className="text-center">Comparisons</h3>
                        {research?.comparisons.map((comparison, index) => (
                            <ComparisonGrid key={index}>
                                <div
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-3 p-2">
                                        <h4 className="mb-0">Comparison #{index + 1}</h4>
                                        <Button
                                            variant="link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleComparison(index);
                                            }}
                                        >
                                            {activeIndexes.includes(index) ? (
                                                <DashCircle size={24} className="text-secondary" />
                                            ) : (
                                                <PlusCircle size={24} className="text-secondary" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                {activeIndexes.includes(index) && (
                                    <>
                                        <ComparisonGraph
                                            graphData={research?.analysis}
                                            width={600}
                                            height={500}
                                            isComparisonGraph={false}
                                        />
                                        <ComparisonGraph
                                            graphData={comparison}
                                            width={600}
                                            height={500}
                                            isComparisonGraph={true}
                                        />
                                        <Card>
                                            <Card.Header>
                                                <h5 className="fw-bold">Comparison Statistics</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <div key={`stats-${index}`} className="mb-4">
                                                    {(() => {
                                                        // const compData = research.comparisons[index];
                                                        const stats = calculateComparisonStats(
                                                            research?.analysis,
                                                            comparison
                                                        );

                                                        if (!stats)
                                                            return (
                                                                <p>Could not calculate comparison statistics.</p>
                                                            );

                                                        return (
                                                            <Table responsive striped bordered hover >
                                                                <thead>
                                                                    <tr>
                                                                        <th>Metric</th>
                                                                        <th>Original Network</th>
                                                                        <th>Comparison Network</th>
                                                                        <th>Difference</th>
                                                                        <th>Change %</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>Node Count</td>
                                                                        <td>{stats.originalNodeCount}</td>
                                                                        <td>{stats.comparisonNodeCount}</td>
                                                                        <td>
                                                                            {stats.nodeDifference > 0
                                                                                ? `+${stats.nodeDifference}`
                                                                                : stats.nodeDifference}
                                                                        </td>
                                                                        <td>{stats.nodeChangePercent}%</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>Edge Count</td>
                                                                        <td>{stats.originalLinkCount}</td>
                                                                        <td>{stats.comparisonLinkCount}</td>
                                                                        <td>
                                                                            {stats.linkDifference > 0
                                                                                ? `+${stats.linkDifference}`
                                                                                : stats.linkDifference}
                                                                        </td>
                                                                        <td>{stats.linkChangePercent}%</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>Common Nodes</td>
                                                                        <td colSpan="2">{stats.commonNodesCount}</td>
                                                                        <td colSpan="2">
                                                                            {(
                                                                                (stats.commonNodesCount /
                                                                                    stats.originalNodeCount) *
                                                                                100
                                                                            ).toFixed(2)}
                                                                            % of original network
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        );
                                                    })()}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </>)}

                            </ComparisonGrid>
                        ))}
                    </ComparisonContainer>
            )}
        </>
    );
};

export default ComparisonHistory;
