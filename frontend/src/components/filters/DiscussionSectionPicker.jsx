
import React, { useState, useEffect } from "react";

const DiscussionSectionPicker = ({ content, onSelect, selectedSection,convertToTxt  }) => {
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
  
      setUploadedFile("wikipedia_data");
  
    } catch (err) {
      console.error("Error converting JSON to TXT:", err);
    }
  };
  
  
  return (
    <div className="shadow-sm p-4 mb-4 rounded bg-white">
      <div className="mb-4">
        <h4 className="fw-bold text-start">Discussion Sections</h4>
        {options.length > 0 && (
          <p className="text-muted text-start">
            Found: {options.length} sections with {options.reduce((acc, section) => acc + section.comments.length, 0)} comments
          </p>
        )}
      </div>

      {options.length > 0 ? (
        <div className="d-flex flex-wrap gap-3">
          {options.map((section, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(section)}
              className={`flex-grow-1 flex-shrink-0 rounded shadow-sm p-3 text-start bg-white cursor-pointer transition ${
                selectedTitle === section.title ? "border border-primary bg-light" : "hover-shadow"
              }`}
              style={{ 
                minWidth: "200px", 
                maxWidth: "250px",
                cursor: "pointer" 
              }}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(section);
                }
              }}
            >
              <h6 className="fw-semibold mb-2 text-truncate">{section.title}</h6>
              <span className="badge bg-primary-subtle text-primary">
                {section.comments.length} Comments
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-light rounded">
          <p className="text-muted">No interactive discussion sections found</p>
        </div>
      )}
    </div>
  );
};

export default DiscussionSectionPicker;

const getInteractiveSections = (content) => {
  return content
    .filter((item) => item.type === "talk_page")
    .flatMap((item) => item.sections)
    .filter((section) => section.comments && section.comments.length > 0);
};
