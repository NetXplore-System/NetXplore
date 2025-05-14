import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
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

import "./ResearchWizard.css";

const ResearchWizard = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const filters = useFilters();
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

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null,
    fileName: "",
    uploadedFileName: "",
    isAnonymized: true,
    includeMessageContent: true,
    isDirectedGraph: true,
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
      enabled: false,
      count: 50,
      fromEnd: true,
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
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]:
            type === "checkbox"
              ? checked
              : type === "number"
              ? value === ""
                ? ""
                : Number(value)
              : value,
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
    return formData.includeMessageContent ? totalSteps : totalSteps - 1;
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
    if (currentStep === 3 && !formData.includeMessageContent) {
      setCurrentStep(5);
    } else if (currentStep < getVisibleTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 5 && !formData.includeMessageContent) {
      setCurrentStep(3);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
        return (
          <UserFilters
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
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
              const stepNumber =
                !formData.includeMessageContent && index >= 3
                  ? index + 2
                  : index + 1;
              const isCompleted = currentStep > stepNumber;
              const isActive = currentStep === stepNumber;

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

              const labelIndex =
                index +
                (formData.includeMessageContent ? 0 : index >= 3 ? 1 : 0);
              const stepLabel = stepLabels[labelIndex];

              return (
                <div
                  key={index}
                  className={`wizard-step ${isCompleted ? "completed" : ""} ${
                    isActive ? "active" : ""
                  }`}
                >
                  <div className="step-circle">{stepNumber}</div>
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
