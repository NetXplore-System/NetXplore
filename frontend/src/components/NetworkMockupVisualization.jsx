import React from "react";
import { motion } from "framer-motion";
import { FaFilter, FaUsers, FaRocket } from "react-icons/fa";
import "../styles//NetworkMockupVisualization.css"; 

const NetworkMockupVisualization = () => {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
      }}
      transition={{ duration: 0.3 }}
      className="network-mockup"
    >
      <div className="mockup-content">
        <div className="network-container">
          <svg
            width="100%"
            height="100%"
            className="network-svg"
            viewBox="0 0 500 325"
          >
            <defs>
              <pattern
                id="grid"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g className="network-visualization">
              <g>
                <circle
                  cx="150"
                  cy="100"
                  r="15"
                  fill="rgba(74, 137, 220, 0.7)"
                />

                <circle
                  cx="120"
                  cy="130"
                  r="10"
                  fill="rgba(74, 137, 220, 0.5)"
                />

                <circle
                  cx="180"
                  cy="140"
                  r="8"
                  fill="rgba(74, 137, 220, 0.5)"
                />

                <circle
                  cx="140"
                  cy="160"
                  r="6"
                  fill="rgba(74, 137, 220, 0.4)"
                />

                <line
                  x1="150"
                  y1="100"
                  x2="120"
                  y2="130"
                  stroke="rgba(74, 137, 220, 0.6)"
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="100"
                  x2="180"
                  y2="140"
                  stroke="rgba(74, 137, 220, 0.6)"
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="100"
                  x2="140"
                  y2="160"
                  stroke="rgba(74, 137, 220, 0.6)"
                  strokeWidth="2"
                />
                <line
                  x1="120"
                  y1="130"
                  x2="140"
                  y2="160"
                  stroke="rgba(74, 137, 220, 0.4)"
                  strokeWidth="1"
                />
                <line
                  x1="180"
                  y1="140"
                  x2="140"
                  y2="160"
                  stroke="rgba(74, 137, 220, 0.4)"
                  strokeWidth="1"
                />
              </g>

              <g>
                <circle
                  cx="300"
                  cy="160"
                  r="18"
                  fill="rgba(106, 191, 195, 0.7)"
                />

                <circle
                  cx="330"
                  cy="130"
                  r="12"
                  fill="rgba(106, 191, 195, 0.6)"
                />

                <circle
                  cx="350"
                  cy="180"
                  r="10"
                  fill="rgba(106, 191, 195, 0.5)"
                />

                <circle
                  cx="280"
                  cy="200"
                  r="7"
                  fill="rgba(106, 191, 195, 0.4)"
                />

                <line
                  x1="300"
                  y1="160"
                  x2="330"
                  y2="130"
                  stroke="rgba(106, 191, 195, 0.7)"
                  strokeWidth="3"
                />
                <line
                  x1="300"
                  y1="160"
                  x2="350"
                  y2="180"
                  stroke="rgba(106, 191, 195, 0.7)"
                  strokeWidth="3"
                />
                <line
                  x1="300"
                  y1="160"
                  x2="280"
                  y2="200"
                  stroke="rgba(106, 191, 195, 0.7)"
                  strokeWidth="2"
                />
                <line
                  x1="330"
                  y1="130"
                  x2="350"
                  y2="180"
                  stroke="rgba(106, 191, 195, 0.5)"
                  strokeWidth="1.5"
                />
                <line
                  x1="350"
                  y1="180"
                  x2="280"
                  y2="200"
                  stroke="rgba(106, 191, 195, 0.5)"
                  strokeWidth="1.5"
                />
              </g>

              <g>
                <circle
                  cx="220"
                  cy="250"
                  r="12"
                  fill="rgba(255, 184, 108, 0.7)"
                />

                <circle
                  cx="250"
                  cy="230"
                  r="8"
                  fill="rgba(255, 184, 108, 0.5)"
                />

                <circle
                  cx="190"
                  cy="230"
                  r="7"
                  fill="rgba(255, 184, 108, 0.5)"
                />
                <line
                  x1="220"
                  y1="250"
                  x2="250"
                  y2="230"
                  stroke="rgba(255, 184, 108, 0.6)"
                  strokeWidth="2"
                />
                <line
                  x1="220"
                  y1="250"
                  x2="190"
                  y2="230"
                  stroke="rgba(255, 184, 108, 0.6)"
                  strokeWidth="2"
                />
                <line
                  x1="190"
                  y1="230"
                  x2="250"
                  y2="230"
                  stroke="rgba(255, 184, 108, 0.4)"
                  strokeWidth="1"
                />
              </g>

              <line
                x1="180"
                y1="140"
                x2="250"
                y2="230"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1="140"
                y1="160"
                x2="190"
                y2="230"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1="330"
                y1="130"
                x2="250"
                y2="230"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />

              <circle
                cx="150"
                cy="100"
                r="25"
                fill="none"
                stroke="rgba(74, 137, 220, 0.3)"
                strokeWidth="1"
              >
                <animate
                  attributeName="r"
                  values="25;35;25"
                  dur="4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0.3"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle
                cx="300"
                cy="160"
                r="30"
                fill="none"
                stroke="rgba(106, 191, 195, 0.3)"
                strokeWidth="1"
              >
                <animate
                  attributeName="r"
                  values="30;40;30"
                  dur="5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0.1;0.3"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            <g transform="translate(350, 80)">
              <rect
                x="0"
                y="0"
                width="120"
                height="80"
                rx="5"
                fill="rgba(0, 0, 0, 0.7)"
              />
              <text x="10" y="20" fill="white" fontSize="10" fontWeight="bold">
                User X (Influencer)
              </text>
              <text x="10" y="40" fill="rgba(255, 255, 255, 0.8)" fontSize="8">
                PageRank: 0.38
              </text>
              <text x="10" y="55" fill="rgba(255, 255, 255, 0.8)" fontSize="8">
                Centrality: 0.65
              </text>
              <text x="10" y="70" fill="rgba(255, 255, 255, 0.8)" fontSize="8">
                Messages: 127
              </text>
            </g>

            <g transform="translate(50, 50)">
              <rect
                x="0"
                y="0"
                width="100"
                height="45"
                rx="5"
                fill="rgba(0, 0, 0, 0.5)"
              />
              <text
                x="10"
                y="15"
                fill="rgba(255, 255, 255, 0.9)"
                fontSize="7"
                fontWeight="bold"
              >
                Network Stats
              </text>
              <text x="10" y="30" fill="rgba(255, 255, 255, 0.7)" fontSize="6">
                Density: 0.42
              </text>
              <text x="10" y="40" fill="rgba(255, 255, 255, 0.7)" fontSize="6">
                Communities: 3
              </text>
            </g>

            <circle cx="150" cy="100" r="3" fill="white">
              <animate
                attributeName="cx"
                values="150;150;120"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values="100;100;130"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            <circle cx="300" cy="160" r="3" fill="white">
              <animate
                attributeName="cx"
                values="300;330;350"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values="160;130;180"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        <div className="mockup-footer">
          <div className="mockup-footer-left">
            <div className="mockup-button mockup-button-blue">
              <FaFilter size={8} className="btn-ic" /> Filter
            </div>
            <div className="mockup-button mockup-button-teal">
              <FaUsers size={8} className="btn-ic" /> Communities
            </div>
          </div>
          <div className="mockup-button mockup-button-orange">
            <FaRocket size={8} className="btn-ic" /> Run Analysis
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NetworkMockupVisualization;
