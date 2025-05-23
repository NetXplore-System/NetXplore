import React, { useState, useEffect } from "react";
import "../../styles/DiscussionSectionPicker.css";

const DiscussionSectionPicker = ({
  content,
  onSelect,
  selectedSection,
  convertToTxt,
}) => {
  const [options, setOptions] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");

  useEffect(() => {
    if (content) {
      const sectionsWithReplies = getInteractiveSections(content);
      setOptions(sectionsWithReplies);
    }
  }, [content]);

  const handleSelect = async (section) => {
    setSelectedTitle(section.title);
    onSelect(section);

    try {
      const result = await convertToTxt(section.title);
      console.log("TXT file created:", result.path);
    } catch (err) {
      console.error("Error converting JSON to TXT:", err);
    }
  };

  const totalComments = options.reduce(
    (acc, section) => acc + section.comments.length,
    0
  );

  return (
    <div className="discussion-section-picker">
      {options.length > 0 && (
        <div className="section-stats">
          <div className="stats-label">
            Found: <span className="stats-number">{options.length}</span>{" "}
            sections with <span className="stats-number">{totalComments}</span>{" "}
            comments
          </div>
        </div>
      )}

      {options.length > 0 ? (
        <div className="sections-grid">
          {options.map((section, idx) => (
            <div
              key={idx}
              className={`section-card ${
                selectedTitle === section.title ? "section-card-selected" : ""
              }`}
              onClick={() => handleSelect(section)}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(section);
                }
              }}
            >
              <div className="section-card-body">
                <h4 className="sec-title">{section.title}</h4>
                <div className="section-badge">
                  {section.comments.length} Comments
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sections-card">
          <div className="no-sections-content">
            No interactive discussion sections found
          </div>
        </div>
      )}
    </div>
  );
};

const getInteractiveSections = (content) => {
  return content
    .filter((item) => item.type === "talk_page")
    .flatMap((item) => item.sections)
    .filter((section) => section.comments && section.comments.length > 0);
};

export default DiscussionSectionPicker;
