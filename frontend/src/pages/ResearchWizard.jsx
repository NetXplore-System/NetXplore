import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import useFilters from "../hooks/useFilters";
import useComparison from "../hooks/useComparison";
import { clearImages } from "../redux/images/imagesSlice";

import ResearchSetup from "./Steps/ResearchSetup";
import DataConfiguration from "./Steps/DataConfiguration";
import TimeFrame from "./Steps/TimeFrame";
import MessageContent from "./Steps/MessageContent";
import UserFilters from "./Steps/UserFilters";
import NetworkVisualization from "./Steps/NetworkVisualization";
import ComparativeAnalysis from "./Steps/ComparativeAnalysis";
import ResearchReport from "./Steps/ResearchReport";

import {
  uploadFile,
  analyzeNetwork,
  detectCommunities,
  saveFormToDB,
} from "../components/utils/ApiService";
import { saveToDB } from "../components/utils/save";

import "../styles/ResearchWizard.css";

const ResearchWizard = () => {
  const location = useLocation();
  const selectedPlatform = location.state?.platform || "whatsapp";
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { currentUser } = useSelector((state) => state.user) || { id: 1 };
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(8);
  const [networkData, setNetworkData] = useState(null);
  const [originalNetworkData, setOriginalNetworkData] = useState(null);
  const [shouldFetchCommunities, setShouldFetchCommunities] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [communityMap, setCommunityMap] = useState({});
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [message, setMessage] = useState("");
  const [shouldShowUserFilters, setShouldShowUserFilters] = useState(true);
  const [lastAnalysisParams, setLastAnalysisParams] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null,
    fileName: "",
    uploadedFileName: "",
    platform: selectedPlatform,
    wikipediaUrl: "",
    isAnonymized: false,
    includeMessageContent: true,
    isDirectedGraph: false,
    useTriads: false,
    useHistoryAlgorithm: false,
    isNormalized: false,
    timeFrame: {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    },
    limit: {
      enabled: true,
      count: 50,
      fromEnd: false,
      type: "messages",
    },
    messageCriteria: {
      minLength: 1,
      maxLength: "",
      keywords: "",
      contentFilter: "",
    },
    userFilters: {
      minMessages: 1,
      maxMessages: "",
      activeUsers: 0,
      usernameFilter: "",
    },
    Network: {
      degreeCentrality: true,
      betweennessCentrality: true,
      closenessCentrality: true,
      eigenvectorCentrality: true,
      pagerankCentrality: true,
      communityDetection: true,
    },
    comparisonEnabled: false,
    comparisonFile: null,
    comparisonFileName: "",
    comparisonUploadedFileName: "",
  });

  const updateDocumentTitle = (step) => {
    const titles = [
      "New Research - Setup",
      "New Research - Data Configuration",
      "New Research - Time Frame",
      "New Research - Message Content",
      "New Research - User Filters",
      "New Research - New Visualization",
      "New Research - Comparative Analysis",
      "New Research - Research Report",
    ];
    document.title = titles[step - 1] || "New Research";
  };
  const filters = useFilters(formData);

  const comparison = useComparison(
    originalNetworkData,
    formData.uploadedFileName
  );

  useEffect(() => {
    updateDocumentTitle(currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (networkData && shouldFetchCommunities) {
      fetchCommunityData();
      setShouldFetchCommunities(false);
    }
  }, [networkData, shouldFetchCommunities]);

  useEffect(() => {
    const isNetworkVisualizationStep =
      currentStep === 6 ||
      (currentStep === 5 &&
        (!shouldShowUserFilters || !formData.includeMessageContent));

    if (isNetworkVisualizationStep && formData.uploadedFileName) {
      const currentParams = filters.buildNetworkFilterParams().toString();

      if (
        !networkData ||
        !lastAnalysisParams ||
        currentParams !== lastAnalysisParams
      ) {
        handleNetworkAnalysis();
      }
    }
  }, [
    currentStep,
    formData.uploadedFileName,
    shouldShowUserFilters,
    formData.includeMessageContent,
    networkData,
    lastAnalysisParams,
    formData.limit.enabled,
    formData.limit.count,
    formData.limit.fromEnd,
    formData.timeFrame.startDate,
    formData.timeFrame.endDate,
    formData.timeFrame.startTime,
    formData.timeFrame.endTime,
    formData.messageCriteria.minLength,
    formData.messageCriteria.maxLength,
    formData.messageCriteria.keywords,
    formData.messageCriteria.contentFilter,
    formData.userFilters.minMessages,
    formData.userFilters.maxMessages,
    formData.userFilters.activeUsers,
    formData.userFilters.usernameFilter,
    formData.isDirectedGraph,
    formData.useTriads,
    formData.useHistoryAlgorithm,
    formData.isNormalized,
  ]);

  useEffect(() => {
    if (formData.isDirectedGraph && formData.useHistoryAlgorithm) {
      setShouldShowUserFilters(false);
    } else {
      setShouldShowUserFilters(true);
    }
  }, [formData.isDirectedGraph, formData.useHistoryAlgorithm]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFormData({
      ...formData,
      file: selectedFile,
      fileName: selectedFile.name,
    });
    handleFileUpload(selectedFile);
  };

  const handleFileUpload = (file) => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    toast.promise(uploadFile(file), {
      loading: "Uploading file...",
      success: (data) => {
        setFormData((prev) => ({
          ...prev,
          uploadedFileName: data.filename,
        }));
        return "File uploaded successfully!";
      },
      error: (error) => {
        return error?.message || "Error uploading file.";
      },
    });
  };

  const handleNetworkAnalysis = () => {
    if (!formData.uploadedFileName) {
      toast.error("No file selected for analysis.");
      return;
    }
    const params = filters.buildNetworkFilterParams();

    setLastAnalysisParams(params.toString());

    toast.promise(analyzeNetwork(formData.uploadedFileName, params), {
      loading: "Analyzing network...",
      success: (data) => {
        if (data.nodes && data.links) {
          dispatch(clearImages());
          setNetworkData(data);
          setOriginalNetworkData(data);
          setShouldFetchCommunities(true);
          return "Analysis completed successfully!";
        } else {
          return "No data returned from server.";
        }
      },
      error: (error) => {
        return error?.message || "Error analyzing network.";
      },
    });
  };

  const fetchCommunityData = () => {
    if (!formData.uploadedFileName || !networkData) return;
    const params = filters.buildNetworkFilterParams();
    detectCommunities(formData.uploadedFileName, params)
      .then((data) => {
        if (data.communities && data.nodes) {
          setCommunities(data.communities);
          const newCommunityMap = {};
          data.nodes.forEach((node) => {
            if (node.community !== undefined) {
              newCommunityMap[node.id.toString().trim()] = node.community;
            }
          });
          setCommunityMap(newCommunityMap);
          if (networkData && networkData.nodes) {
            const updatedNodes = networkData.nodes.map((node) => {
              const normalizedId = node.id.toString().trim();
              const community = newCommunityMap[normalizedId];
              if (community !== undefined) {
                return { ...node, community };
              }
              return node;
            });
            setNetworkData({
              nodes: updatedNodes,
              links: networkData.links,
            });
            setOriginalNetworkData({
              nodes: updatedNodes,
              links: networkData.links,
            });
          }
        }
      })
      .catch((error) => {
        toast.error(error.message || "Error detecting communities.");
      });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      let newValue;
      if (type === "checkbox") {
        newValue = checked;
      } else if (type === "radio") {
        newValue = value === "true" ? true : value === "false" ? false : value;
      } else if (type === "number") {
        newValue = value === "" ? "" : Number(value);
      } else {
        newValue = value;
      }
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });

      if (name === "includeMessageContent" && !checked && currentStep === 4) {
        setCurrentStep(5);
      }
    }
  };

  const handleSaveResearch = () => {
    const params = filters.buildNetworkFilterParams();
    const id = currentUser?.id;
    if (!formData.name || !formData.uploadedFileName || !params || !id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.promise(
      saveToDB(
        id,
        formData.name,
        formData.description,
        formData.uploadedFileName,
        params,
        selectedMetric,
        {
          hasComparison:
            comparison.comparisonNetworkData &&
            comparison.comparisonNetworkData.length
              ? true
              : false,
          data: comparison.comparisonNetworkData || undefined,
        }
      ),
      {
        loading: "Saving research...",
        success: (data) => {
          return data?.detail || "Research saved successfully!";
        },
        error: (error) => {
          return error?.detail || "Error saving research.";
        },
      }
    );
  };

  const getVisibleTotalSteps = () => {
    let steps = totalSteps;

    if (!formData.includeMessageContent) {
      steps -= 1;
    }

    if (!shouldShowUserFilters) {
      steps -= 1;
    }

    return steps;
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast.error("Please enter a research name.");
        return;
      }
      if (!formData.uploadedFileName) {
        toast.error("Please upload a file to continue.");
        return;
      }
    }

    if (currentStep < getVisibleTotalSteps()) {
      if (currentStep === 3 && !formData.includeMessageContent) {
        if (!shouldShowUserFilters) {
          setCurrentStep(5); 
        } else {
          setCurrentStep(4); 
        }
      } else if (
        currentStep === 4 &&
        !shouldShowUserFilters &&
        formData.includeMessageContent
      ) {
        setCurrentStep(5);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      if (
        currentStep === 6 ||
        (currentStep === 5 &&
          (!shouldShowUserFilters || !formData.includeMessageContent))
      ) {
        setLastAnalysisParams(null);
      }
      if (currentStep === 5) {
        if (!formData.includeMessageContent && !shouldShowUserFilters) {
          setCurrentStep(3);
        } else if (!formData.includeMessageContent) {
          setCurrentStep(4); 
        } else if (!shouldShowUserFilters) {
          setCurrentStep(4); 
        } else {
          setCurrentStep(currentStep - 1);
        }
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = () => {
    handleSaveResearch();
    toast.success("Research completed and saved successfully!");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ResearchSetup
            formData={formData}
            handleInputChange={handleInputChange}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            platform={formData.platform}
            setNetworkData={setNetworkData}
            setOriginalNetworkData={setOriginalNetworkData}
            setWikiUrl={(url) =>
              handleInputChange({
                target: { name: "wikipediaUrl", value: url, type: "text" },
              })
            }
          />
        );
      case 2:
        return (
          <DataConfiguration
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <TimeFrame
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 4:
        if (formData.includeMessageContent) {
          return (
            <MessageContent
              formData={formData}
              handleInputChange={handleInputChange}
            />
          );
        } else {
          return (
            <UserFilters
              formData={formData}
              handleInputChange={handleInputChange}
            />
          );
        }
      case 5:
        if (shouldShowUserFilters && formData.includeMessageContent) {
          return (
            <UserFilters
              formData={formData}
              handleInputChange={handleInputChange}
            />
          );
        } else {
          return (
            <NetworkVisualization
              networkData={networkData}
              originalNetworkData={originalNetworkData}
              communities={communities}
              communityMap={communityMap}
              handleNetworkAnalysis={handleNetworkAnalysis}
              formData={formData}
              setNetworkData={setNetworkData}
              setOriginalNetworkData={setOriginalNetworkData}
              uploadedFileName={formData.uploadedFileName}
              filters={filters}
              setShouldFetchCommunities={setShouldFetchCommunities}
              selectedMetric={selectedMetric}
              setSelectedMetric={setSelectedMetric}
              message={message}
              setMessage={setMessage}
              shouldShowUserFilters={shouldShowUserFilters}
            />
          );
        }
      case 6:
        return (
          <NetworkVisualization
            networkData={networkData}
            originalNetworkData={originalNetworkData}
            communities={communities}
            communityMap={communityMap}
            handleNetworkAnalysis={handleNetworkAnalysis}
            formData={formData}
            setNetworkData={setNetworkData}
            setOriginalNetworkData={setOriginalNetworkData}
            uploadedFileName={formData.uploadedFileName}
            filters={filters}
            setShouldFetchCommunities={setShouldFetchCommunities}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
            message={message}
            setMessage={setMessage}
            shouldShowUserFilters={shouldShowUserFilters}
          />
        );
      case 7:
        return (
          <ComparativeAnalysis
            originalNetworkData={originalNetworkData}
            comparison={comparison}
            filters={filters}
            uploadedFileName={formData.uploadedFileName}
          />
        );
      case 8:
        return (
          <ResearchReport
            formData={formData}
            networkData={networkData}
            originalNetworkData={originalNetworkData}
            communities={communities}
            selectedMetric={selectedMetric}
            comparison={comparison}
            handleSaveResearch={handleSaveResearch}
          />
        );
      default:
        return <p>Step {currentStep} coming soon...</p>;
    }
  };

  return (
    <Container fluid className="research-wizard-container">
      <Row className="justify-content-center">
        <Col lg={10} md={12} sm={12}>
          <div className="wizard-header text-center">
            <h2>Network Research</h2>
            <p className="text-muted">
              Configure your network analysis in a few simple steps
            </p>
          </div>

          <div className="wizard-progress-line">
            {[...Array(getVisibleTotalSteps())].map((_, index) => {
              let stepNumber = index + 1;

              if (!formData.includeMessageContent && index >= 3) {
                stepNumber += 1; 
              }

              if (!shouldShowUserFilters) {
                if (formData.includeMessageContent && index >= 4) {
                  stepNumber += 1; 
                } else if (!formData.includeMessageContent && index >= 3) {
                  stepNumber += 1; 
                }
              }

              const isCompleted = currentStep > index + 1;
              const isActive = currentStep === index + 1;

              const stepLabels = [
                "Setup",
                "Config",
                "Time",
                "Content",
                "Users",
                "Network",
                "Compare",
                "Report",
              ];

              let labelIndex = index;

              if (!formData.includeMessageContent && index >= 3) {
                labelIndex += 1;
              }

              if (!shouldShowUserFilters) {
                if (formData.includeMessageContent && index >= 4) {
                  labelIndex += 1;
                } else if (!formData.includeMessageContent && index >= 3) {
                  labelIndex += 1;
                }
              }

              const stepLabel = stepLabels[labelIndex];

              return (
                <div
                  key={index}
                  className={`wizard-step ${isCompleted ? "completed" : ""} ${
                    isActive ? "active" : ""
                  }`}
                >
                  <div className="step-circle">{index + 1}</div>
                  <div className="step-line"></div>
                  <div className="step-label">{stepLabel}</div>
                </div>
              );
            })}
          </div>

          {renderCurrentStep()}

          <div className="wizard-navigation mt-4">
            <Button
              variant="outline-secondary"
              className="prev-btn"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="me-1" /> Previous
            </Button>
            {currentStep < getVisibleTotalSteps() ? (
              <Button
                variant="primary"
                className="next-btn"
                onClick={goToNextStep}
              >
                Next <ChevronRight className="ms-1" />
              </Button>
            ) : (
              <Button
                variant="success"
                className="submit-btn"
                onClick={handleSubmit}
              >
                Finish
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ResearchWizard;
