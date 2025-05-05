import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useAnimation,
  useInView,
} from "framer-motion";
import { Button } from "react-bootstrap";
import {
  FaSearch,
  FaNetworkWired,
  FaUsers,
  FaChartLine,
  FaArrowDown,
  FaFilter,
  FaWhatsapp,
  FaWikipediaW,
  FaFileUpload,
  FaRocket,
} from "react-icons/fa";
import NetworkAnimation from "../components/NetworkAnimation";
import "./Welcome.css";

const sections = [
  {
    title: "Upload & Analyze Any Conversation",
    text: "Instantly transform your WhatsApp chats or Wikipedia data into interactive network visualizations. Upload your data with a simple click and watch as connections form before your eyes, revealing the hidden patterns within your conversations.",
    backgroundColor: "linear-gradient(135deg, #050d2d 0%, #0a1b3d 100%)",
    icon: <FaFileUpload size={60} />,
    imageSrc: "/images/data-upload.webp",
    features: [
      "WhatsApp chat export compatibility",
      "Wikipedia data integration",
      "Secure data handling",
      "Instant visualization",
    ],
  },
  {
    title: "Discover Hidden Network Patterns",
    text: "Uncover the invisible structures within conversations using our powerful network analysis tools. Filter by dates, keywords, users, or message length to identify communication patterns and key influencers within any discourse.",
    backgroundColor: "linear-gradient(135deg, #0a1b3d 0%, #1c1c2e 100%)",
    icon: <FaSearch size={60} />,
    imageSrc: "/images/pattern-discovery.webp",
    features: [
      "Advanced message filtering",
      "Temporal analysis",
      "Keyword tracking",
      "User activity metrics",
    ],
  },
  {
    title: "Identify Communities & Key Influencers",
    text: "Advanced algorithms automatically detect communities within your network and highlight the most influential participants. Calculate PageRank, closeness, and betweenness centrality metrics to understand who drives the conversation.",
    backgroundColor: "linear-gradient(135deg, #1c1c2e 0%, #0c3944 100%)",
    icon: <FaUsers size={60} />,
    imageSrc: "/images/community-detection.webp",
    features: [
      "Community detection algorithms",
      "Centrality metrics",
      "Influence ranking",
      "Group dynamics analysis",
    ],
  },
  {
    title: "Compare Networks & Test Scenarios",
    text: "Compare different conversation networks, simulate the removal of users, or hide inter-community links to understand resilience and information flow. Analyze network density, diameter, and run Triad Census analysis to understand local structures.",
    backgroundColor: "linear-gradient(135deg, #0c3944 0%, #11224d 100%)",
    icon: <FaChartLine size={60} />,
    imageSrc: "/images/network-comparison.webp",
    features: [
      "Network comparison tools",
      "What-if scenario testing",
      "Triad Census analysis",
      "Structure resilience testing",
    ],
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-card-icon">{icon}</div>
    <h3 className="feature-card-title">{title}</h3>
    <p className="feature-card-description">{description}</p>
  </div>
);

const AnimatedButton = ({ variant, onClick, children }) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.05,
        boxShadow: "0 8px 20px rgba(13, 110, 253, 0.5)",
      }}
      whileTap={{ scale: 0.95 }}
      className="animated-button-wrapper"
    >
      <Button
        variant={variant}
        size="lg"
        onClick={onClick}
        className={`animated-button ${
          variant === "primary" ? "primary-button" : "outline-button"
        }`}
      >
        {children}
      </Button>
    </motion.div>
  );
};

const FloatingElement = ({
  children,
  delay,
  duration,
  yRange,
  xRange,
  className,
}) => {
  return (
    <motion.div
      animate={{
        y: yRange,
        x: xRange,
      }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: duration,
        delay: delay,
        ease: "easeInOut",
      }}
      className={`floating-element ${className || ""}`}
    >
      {children}
    </motion.div>
  );
};

const AnimatedTextReveal = ({ text, delay = 0 }) => {
  return (
    <span className="text-reveal-wrapper">
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
        className="text-reveal"
      >
        {text}
      </motion.span>
    </span>
  );
};

const FeatureBadge = ({ text }) => {
  return (
    <motion.span whileHover={{ scale: 1.05, y: -3 }} className="feature-badge">
      {text}
    </motion.span>
  );
};

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
                values="150;120;120"
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
              <FaFilter size={8} className="btn-icon" /> Filter
            </div>
            <div className="mockup-button mockup-button-teal">
              <FaUsers size={8} className="btn-icon" /> Communities
            </div>
          </div>
          <div className="mockup-button mockup-button-orange">
            <FaRocket size={8} className="btn-icon" /> Run Analysis
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureSection = ({ section, index }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.15, triggerOnce: true });
  const { scrollYProgress } = useScroll({ target: ref });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const parallaxOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.8],
    [0.3, 1, 0.8]
  );

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const isEven = index % 2 === 0;

  const fadeInVariant = {
    hidden: { opacity: 0, y: 70 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const imageVariant = {
    hidden: { opacity: 0, x: isEven ? -100 : 100, scale: 0.9 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 1.2, ease: "easeOut", delay: 0.3 },
    },
  };

  return (
    <section
      className="feature-section"
      ref={ref}
      style={{ background: section.backgroundColor }}
    >
      <motion.div
        className="gradient-circle top"
        style={{
          left: isEven ? "10%" : "auto",
          right: isEven ? "auto" : "10%",
          y: parallaxY,
          opacity: parallaxOpacity,
        }}
      />

      <motion.div
        className="gradient-circle bottom"
        style={{
          right: isEven ? "15%" : "auto",
          left: isEven ? "auto" : "15%",
        }}
      />

      <div className="container">
        <div
          className="row align-items-center"
          style={{ flexDirection: isEven ? "row" : "row-reverse" }}
        >
          <motion.div
            className="col-lg-6 mb-5 mb-lg-0"
            initial="hidden"
            animate={controls}
            variants={fadeInVariant}
          >
            <motion.div
              variants={fadeInVariant}
              className="feature-icon-container"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="feature-icon"
              >
                {section.icon}
              </motion.div>
            </motion.div>

            <motion.h2 variants={fadeInVariant} className="feature-title">
              {section.title}
              <span className="feature-title-underline" />
            </motion.h2>

            <motion.p variants={fadeInVariant} className="feature-text">
              {section.text}
            </motion.p>

            <motion.div variants={fadeInVariant} className="feature-badges">
              {section.features.map((feature, i) => (
                <FeatureBadge key={i} text={feature} />
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="col-lg-6"
            initial="hidden"
            animate={controls}
            variants={imageVariant}
          >
            <NetworkMockupVisualization />
          </motion.div>
        </div>
      </div>
    </section>
  );
};



const DataSourceBadge = ({ icon, text }) => {
  return (
    <motion.div whileHover={{ y: -5, scale: 1.05 }} className="data-badge">
      <div className="data-badge-icon">{icon}</div>
      <div className="data-badge-text">{text}</div>
    </motion.div>
  );
};

const Welcome = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const inViewTitle = useInView(titleRef, { once: true, amount: 0.5 });
  const inViewSubtitle = useInView(subtitleRef, { once: true, amount: 0.5 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.margin = "0";
    document.body.style.backgroundColor = "#050d2d";
    document.body.style.fontFamily = "'Inter', sans-serif";

    return () => {
      document.body.style.overflow = "";
      document.body.style.margin = "";
      document.body.style.backgroundColor = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  const heroFadeInUpStrong = {
    hidden: { opacity: 0, y: 100 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: i * 0.2,
      },
    }),
  };

  const ctaFadeIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.6,
      },
    },
  };

  return (
    <div className="app-wrapper">
      <section className="hero-section">
        <NetworkAnimation />

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <FloatingElement
            delay={0}
            duration={6}
            yRange={["30px", "-30px"]}
            xRange={["10px", "-10px"]}
            className="floating-element-1"
          />

          <FloatingElement
            delay={1}
            duration={7}
            yRange={["-20px", "20px"]}
            xRange={["-15px", "15px"]}
            className="floating-element-2"
          />

          <FloatingElement
            delay={0.5}
            duration={5}
            yRange={["15px", "-15px"]}
            xRange={["5px", "-5px"]}
            className="floating-element-3"
          />

          <div ref={titleRef} className="title-wrapper">
            <motion.h1
              custom={0}
              initial="hidden"
              animate={inViewTitle ? "visible" : "hidden"}
              variants={heroFadeInUpStrong}
              className="hero-title"
            >
              <div className="title-first-line">
                <AnimatedTextReveal text="Unlock the Power of" delay={0.1} />
              </div>
              <div className="hero-accent">
                <AnimatedTextReveal text="Network Analysis" delay={0.5} />
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                  className="accent-underline"
                ></motion.span>
              </div>
            </motion.h1>
          </div>

          <motion.div
            ref={subtitleRef}
            custom={1}
            initial="hidden"
            animate={inViewSubtitle ? "visible" : "hidden"}
            variants={heroFadeInUpStrong}
            className="hero-subtitle-container"
          >
            <p className="hero-subtitle">
              Transform conversations into interactive networks. Identify key
              influencers, discover hidden communities, and gain powerful
              insights from your social data.
            </p>

            <div className="data-sources">
              <DataSourceBadge
                icon={<FaWhatsapp size={24} color="#25D366" />}
                text="WhatsApp Data"
              />
              <DataSourceBadge
                icon={<FaWikipediaW size={24} color="#ffffff" />}
                text="Wikipedia Data"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.6, ease: "easeOut", delay: 1.2 }}
              className="hero-highlight"
            >
              <p>See what your networks reveal.</p>
            </motion.div>
          </motion.div>

          <div className="hero-buttons">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 1.5 }}
            >
              <AnimatedButton
                variant="primary"
                onClick={() => navigate("/explore")}
              >
                Start Analyzing
              </AnimatedButton>
              <AnimatedButton
                variant="outline-light"
                onClick={() => navigate("/register")}
              >
                Create Account
              </AnimatedButton>
            </motion.div>
          </div>
        </div>
      </section>

      {sections.map((section, index) => (
        <FeatureSection key={index} section={section} index={index} />
      ))}

      <section className="cta-section">
        <div className="cta-overlay-1"></div>
        <div className="cta-overlay-2"></div>

        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: "easeOut",
                  staggerChildren: 0.2,
                },
              },
            }}
            className="cta-content"
          >
            <motion.h2
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8 },
                },
              }}
              className="cta-title"
            >
              Reveal the Hidden Structure of Communication
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "60%" }}
                transition={{ delay: 0.5, duration: 1 }}
                viewport={{ once: true }}
                className="cta-title-underline"
              />
            </motion.h2>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, delay: 0.1 },
                },
              }}
              className="cta-text"
            >
              Turn conversations into meaningful insights with advanced network
              analysis tools. Visualize connections, detect communities, and
              explore influence in social or discursive networks — all in one
              intuitive platform.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5, delay: 0.3 },
                },
              }}
              className="cta-button-container"
            >
              <AnimatedButton
                variant="primary"
                onClick={() => navigate("/explore")}
              >
                Start Analyzing
              </AnimatedButton>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, delay: 0.5 },
                },
              }}
              className="feature-grid"
            >
              <FeatureCard
                icon={<FaFileUpload size={28} />}
                title="Easy Data Upload"
                description="Quickly upload WhatsApp or Wikipedia data and start exploring your network in seconds."
              />

              <FeatureCard
                icon={<FaUsers size={28} />}
                title="Community Detection"
                description="Automatically detect groups and communities in your data to uncover hidden structures."
              />

              <FeatureCard
                icon={<FaChartLine size={28} />}
                title="Network Metrics"
                description="Measure PageRank, centrality, and density to evaluate the influence and resilience of your network."
              />

              <FeatureCard
                icon={<FaSearch size={28} />}
                title="Custom Filters"
                description="Filter conversations by user, time, keywords, or message length to focus your analysis."
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-4 mb-md-0">
              <h3 className="footer-logo">NetXplore</h3>
              <p className="footer-text">
                Advanced network analysis tools for researchers exploring
                conversation data and social interactions.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="footer-buttons">
                <AnimatedButton
                  variant="outline-light"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  onClick={() => navigate("/explore")}
                >
                  Start Analyzing
                </AnimatedButton>
              </div>
              <p className="footer-copyright">
                © {new Date().getFullYear()} NetXplore. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;