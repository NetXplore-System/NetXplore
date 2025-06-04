import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { Button, Card, Form } from "react-bootstrap";
import { AiOutlineLoading } from "react-icons/ai";

export default function UpdateResearch({
  research,
  setResearch,
  updateResearchs,
}) {
  const user = useSelector((state) => state.user);
  const [researchData, setResearchData] = useState({
    research_name: research.research_name || "",
    description: research.description || null,
    filters: {
      start_date: research.filters?.start_date || null,
      end_date: research.filters?.end_date || null,
      start_time: research.filters?.start_time || null,
      end_time: research.filters?.end_time || null,
      message_limit: research.filters?.message_limit || null,
      limit_type: research.filters?.limit_type || "first",
      min_message_length: research.filters?.min_message_length || null,
      max_message_length: research.filters.max_message_length || null,
      keywords: research.filters?.keywords || null,
      min_messages: research.filters?.min_messages || null,
      max_messages: research.filters?.max_messages || null,
      top_active_users: research.filters?.top_active_users || null,
      specific_users: research.filters?.specific_users || null,
      filter_by_username: research.filters?.filter_by_username || null,
      anonymize: research.filters?.anonymize || false,
      directed: research.filters?.directed || false,
      use_history: research.filters?.use_history || false,
      normalize: research.filters?.normalize || false,
      history_length: research.filters?.history_length || null,
    },
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setResearchData((prevData) => {
      if (name in prevData.filters) {
        if (name === "directed") {
          return {
            ...prevData,
            filters: {
              ...prevData.filters,
              [name]: newValue,
              use_history: newValue ? prevData.filters.use_history : false,
            },
          };
        } else if (name === "use_history" && !prevData.filters.directed) {
          return prevData;
        } else if (name === "history_length" && (!prevData.filters.directed || !prevData.filters.use_history)) {
          return prevData;
        } else {
          return {
            ...prevData,
            filters: {
              ...prevData.filters,
              [name]: newValue,
            },
          };
        }
      } else {
        return {
          ...prevData,
          [name]: newValue,
        };
      }
    });
  };

  const handleCancel = () => {
    setResearch(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const originalFilters = research.filters || {};
      const currentFilters = researchData.filters;
      const filtersChanged = Object.keys(currentFilters).some(
        (key) => { currentFilters[key] !== originalFilters[key] && console.log(key, currentFilters, originalFilters); return currentFilters[key] !== originalFilters[key] }
      );

      if (filtersChanged && !file) {
        toast.error("Please upload a file if you change the filters.");
        setLoading(false);
        return;
      }

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          toast.error("Error uploading file");
          console.error("Error uploading file:", res);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/research/${research.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            ...researchData,
            file_name: filtersChanged ? file.name : undefined,
          }),
        }
      );

      if (response.ok) {
        setResearch(researchData);
        setResearch(null);
        const data = await response.json();
        updateResearchs(data.data);
        toast.success("Research data saved successfully");
      } else {
        toast.error("Error saving research data");
        console.error("Error saving research data:", response);
      }
    } catch (error) {
      toast.error("Error saving research data");
      console.error("Error saving research data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFileClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    fileRef.current.click();
  };

  return (
    <Card className="update-history">
      <Card.Header>
        <h5 className="fw-bold">Update Research</h5>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <Form.Group className="column full-width">
            <Form.Label className="research-label">Research Name:</Form.Label>
            <Form.Control
              type="text"
              name="research_name"
              value={researchData.research_name}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="column full-width">
            <Form.Label className="research-label">Description:</Form.Label>
            <textarea
              className="form-control"
              name="description"
              style={{ width: "100%" }}
              rows={3}
              value={researchData.description}
              onChange={handleChange}
            />
          </Form.Group>
        </div>
        <div className="row">
          {Object.keys(researchData.filters).map((key) =>
            key === "anonymize" ||
              key === "directed" ||
              key === "use_history" ||
              key === "history_length"
              ? null
              : (
                <Form.Group className="column" key={key}>
                  <Form.Label className="research-label">
                    {key.replace(/_/g, " ")}:
                  </Form.Label>
                  <Form.Control
                    type={
                      key.split("_")?.[1] === "date" ||
                        key.split("_")?.[1] === "time"
                        ? key.split("_")[1] === "date"
                          ? "date"
                          : "time"
                        : "text"
                    }
                    name={key}
                    value={researchData.filters[key]}
                    onChange={handleChange}
                  />
                </Form.Group>
              )
          )}
          <Form.Check
            type={"checkbox"}
            label={"directed"}
            checked={researchData.filters["directed"]}
            name={"directed"}
            onChange={handleChange}
            className="column input-checkbox"
          />
          <Form.Check
            type={"checkbox"}
            label={"use_history"}
            checked={researchData.filters["use_history"]}
            name={"use_history"}
            onChange={handleChange}
            disabled={!researchData.filters.directed}
            className="column input-checkbox"
          />
          <Form.Group className="column">
            <Form.Label className="research-label">Message Count:</Form.Label>
            <Form.Control
              type="number"
              name="history_length"
              value={researchData.filters.history_length || ""}
              onChange={handleChange}
              disabled={!researchData.filters.directed || !researchData.filters.use_history}
            />
          </Form.Group>
          <div className="column full-width">
            <button className="generic-button" onClick={handleFileClick}>
              Upload File
            </button>
            <span className="file-name">
              {file ? file.name : "No file selected"}
            </span>
            <p className="file-description">
              Please upload the file you used for the research if filters have changed.
            </p>
            <input
              className="d-none"
              ref={fileRef}
              type="file"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3 gap-2">
          <Button variant="outline-danger" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="generic-button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <AiOutlineLoading className="spinner-icon" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}