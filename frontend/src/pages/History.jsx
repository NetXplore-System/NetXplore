import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { FaEye, FaEdit, FaCopy, FaTrash } from "react-icons/fa";
import { Button, ButtonGroup, Card, Table } from "react-bootstrap";

import Loader from "../components/utils/Loader";
import Modal from "../components/utils/Modal";
import ResearchHistory from "../components/utils/ResearcHistoryComp";
import UpdateResearch from "../components/utils/UpdateResearch";
import ComparisonHistory from "../components/utils/HistoryComparison";
import MadeReport from "../components/utils/MadeReport";

import "../components/utils/history.css";
import { deleteResearch } from "../components/utils/ApiService";

const History = () => {
  const user = useSelector((state) => state.user);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const viewResearchId = queryParams.get("view");
  const [research, setResearch] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [action, setAction] = useState({
    inAction: false,
    ids: [],
  });
  const resetAction = (id) => {
    setAction((prev) => ({
      inAction: !prev.inAction,
      ids: prev.ids.filter((val) => val != id),
    }));
  };

  const handleDelete = async (researchId) => {
    setAction((prev) => ({
      inAction: true,
      ids: [...prev.ids, researchId],
    }));

    toast.promise(
      deleteResearch(researchId, user?.token),
      {
        loading: "Deleting research...",
        success: (data) => {
          setUserHistory((prev) =>
            prev.filter((research) => research.id !== researchId)
          );
          resetAction(researchId);
          return data;
        },
        error: (data) => {
          resetAction(researchId);
          return data;
        },
      },
      {
        duration: 5000,
        closeButton: true,
        position: "top-center",
      }
    );
  };

  const updateResearchs = (researchData) => {
    setUserHistory(
      userHistory.map((research) =>
        research.id === researchData.id
          ? { ...research, ...researchData }
          : research
      )
    );
  };

  const handleReportGeneration = (researchItem) => {
    const params = new Map();

    if (researchItem.filters) {
      const filters = Array.isArray(researchItem.filters)
        ? researchItem.filters[0]
        : researchItem.filters;

      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          key !== "filter_id" &&
          key !== "research_id" &&
          key !== "created_at" &&
          key !== "id" &&
          key !== "user_id" &&
          key !== "research_name"
        ) {
          params.set(key, value);
        }
      });
    }

    setResearch({
      ...researchItem,
      button: "report",
      selectedMetric: researchItem?.metric || "louvain",
      params: params,
      hasComparison: researchItem.has_comparison || false,
    });
    setShowDownload(true);
  };

  const closeModal = () => {
    setResearch(null);
  };

  console.log(userHistory[0]);

  useEffect(() => {
    async function getUserHistory() {
      try {
        setLoading(true);
        const history = await fetch(
          `${import.meta.env.VITE_API_URL}/history/${user?.currentUser?.id}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        if (!history.ok) {
          const { detail } = await history.json();
          console.error("Error response:", detail);
          toast.error("Error fetching user history");
          return;
        }

        const data = await history.json();
        if (!data.history.length) {
          toast.error("Don't find history. Please create research");
          return;
        }
        setUserHistory(data.history);
        if (viewResearchId) {
          const target = data.history.find(
            (item) => item.id === viewResearchId
          );
          if (target) {
            setResearch({ ...target, button: "view" });
          }
        }
      } catch (error) {
        console.error("Error fetching user history:", error);
        toast.error("Error fetching user history");
      } finally {
        setLoading(false);
      }
    }
    getUserHistory();
  }, [user]);

  useEffect(() => {
    if (!showDownload) {
      setResearch(null);
    }
  }, [showDownload]);

  return (
    <div className="history-container">
      {research && (
        <Modal onClose={closeModal}>
          {research.button === "view" && (
            <ResearchHistory research={research} />
          )}
          {research.button === "edit" && (
            <UpdateResearch
              research={research}
              setResearch={setResearch}
              updateResearchs={updateResearchs}
            />
          )}
          {research.button === "compare" && (
            <ComparisonHistory research={research} />
          )}
          {research.button === "report" && showDownload && (
            <MadeReport
              selectedMetric={research.selectedMetric}
              name={research.research_name}
              params={research.params}
              setShowDownload={setShowDownload}
              hasComparison={research?.comparisons?.length ? true : false}
            />
          )}
        </Modal>
      )}
      <Card className={`history-table mt-4 ${loading ? "h-75" : ""}`}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="m-0 fw-bold">History Area</h4>
          {userHistory.length ? (
            <p className="m-0 fw-bold">
              Date Range:{" "}
              {`${new Date(
                userHistory?.at(0)?.created_at
              ).toLocaleDateString()} - ${new Date(
                userHistory?.at(-1)?.created_at
              ).toLocaleDateString()}`}
            </p>
          ) : (
            ""
          )}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="loader-container">
              <Loader />
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Research Name</th>
                  <th>Date Created</th>
                  <th>Platform</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userHistory.map((research) => (
                  <tr key={research.id}>
                    <td>{research.research_name}</td>
                    <td>
                      {new Date(research.created_at).toLocaleDateString()}
                    </td>
                    <td>{research.platform}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="View research details"
                          data-tooltip-place="top"
                          aria-label="View details"
                          onClick={() =>
                            setResearch({ ...research, button: "view" })
                          }
                        >
                          <FaEye />
                        </Button>
                        <Button
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="Edit research"
                          data-tooltip-place="top"
                          aria-label="Edit"
                          onClick={() =>
                            setResearch({ ...research, button: "edit" })
                          }
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="Compare research"
                          data-tooltip-place="top"
                          aria-label="Compare"
                          onClick={() =>
                            setResearch({ ...research, button: "compare" })
                          }
                        >
                          <FaCopy />
                        </Button>
                        {/* <Button
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="Generate PDF report"
                          data-tooltip-place="top"
                          aria-label="Generate Report"
                          variant="success"
                          onClick={() => handleReportGeneration(research)}
                        >
                          <FaFilePdf />
                        </Button> */}
                        <Button
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="Delete research"
                          data-tooltip-place="top"
                          aria-label="Delete"
                          onClick={() => handleDelete(research.id)}
                          disabled={
                            action.inAction &&
                            action.ids.some((id) => id === research.id)
                          }
                        >
                          <FaTrash />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default History;
