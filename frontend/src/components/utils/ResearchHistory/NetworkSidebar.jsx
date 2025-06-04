import React from 'react';
import { Button } from 'react-bootstrap';
import {
    ChevronLeft,
    ChevronRight,
    BarChartFill,
    GraphUp,
    Diagram3Fill,
    InfoCircleFill,
} from "react-bootstrap-icons";

import StatisticsSection from './sections/StatisticsSection';
import MetricsSection from './sections/MetricsSection';
import FiltersSection from './sections/FiltersSection';
import HelpSection from './sections/HelpSection';

const NetworkSidebar = ({
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    ...sectionProps
}) => {
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleSectionClick = (section) => {
        setActiveSection(section);
        setSidebarCollapsed(false);
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case "statistics":
                return <StatisticsSection {...sectionProps} />;
            case "metrics":
                return <MetricsSection {...sectionProps} />;
            case "filters":
                return <FiltersSection {...sectionProps} />;
            case "help":
                return <HelpSection {...sectionProps} />;
            default:
                return null;
        }
    };

    if (sidebarCollapsed) {
        return (
            <div className="icons-only-sidebar">
                <Button
                    variant="link"
                    className="sidebar-toggle-btn p-2 mb-3"
                    onClick={toggleSidebar}
                >
                    <ChevronRight size={20} />
                </Button>

                <Button
                    variant={activeSection === "statistics" ? "primary" : "light"}
                    className="icon-btn"
                    onClick={() => handleSectionClick("statistics")}
                    title="Statistics"
                >
                    <BarChartFill />
                </Button>

                <Button
                    variant={activeSection === "metrics" ? "primary" : "light"}
                    className="icon-btn"
                    onClick={() => handleSectionClick("metrics")}
                    title="Metrics"
                >
                    <GraphUp />
                </Button>

                <Button
                    variant={activeSection === "filters" ? "primary" : "light"}
                    className="icon-btn"
                    onClick={() => handleSectionClick("filters")}
                    title="Refinement"
                >
                    <Diagram3Fill />
                </Button>

                <Button
                    variant={activeSection === "help" ? "primary" : "light"}
                    className="icon-btn"
                    onClick={() => handleSectionClick("help")}
                    title="Help"
                >
                    <InfoCircleFill />
                </Button>
            </div>
        );
    }

    return (
        <div className="full-sidebar p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Research Analysis</h5>
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
                    variant={activeSection === "statistics" ? "primary" : "outline-secondary"}
                    className="me-1 mb-1"
                    onClick={() => setActiveSection("statistics")}
                >
                    <BarChartFill className="me-1" /> Stats
                </Button>
                <Button
                    variant={activeSection === "metrics" ? "primary" : "outline-secondary"}
                    className="me-1 mb-1"
                    onClick={() => setActiveSection("metrics")}
                >
                    <GraphUp className="me-1" /> Metrics
                </Button>
                <Button
                    variant={activeSection === "filters" ? "primary" : "outline-secondary"}
                    className="me-1 mb-1"
                    onClick={() => setActiveSection("filters")}
                >
                    <Diagram3Fill className="me-1" /> Refinement
                </Button>
                <Button
                    variant={activeSection === "help" ? "primary" : "outline-secondary"}
                    className="me-1 mb-1"
                    onClick={() => setActiveSection("help")}
                >
                    <InfoCircleFill className="me-1" /> Help
                </Button>
            </div>

            {renderSectionContent()}
        </div>
    );
};

export default NetworkSidebar; 