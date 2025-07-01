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
  const [searchQuery, setSearchQuery] = useState("");
  const [minComments, setMinComments] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");

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
      if (result?.filename) {
        console.log("Created:", result.filename);
      }
    } catch (err) {
      console.error("Error converting section to TXT:", err);
    }
  };

  const filteredOptions = options.filter((section) => {
    const titleMatch = section.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const commentMatch = section.comments.length >= minComments;
    return titleMatch && commentMatch;
  });

  const sortedOptions = [...filteredOptions].sort((a, b) => {
    return sortOrder === "asc"
      ? a.comments.length - b.comments.length
      : b.comments.length - a.comments.length;
  });

  const totalComments = sortedOptions.reduce(
    (acc, section) => acc + section.comments.length,
    0
  );

  return (
    <div className="discussion-section-picker">
      <div className="section-stats-row">
        {sortedOptions.length > 0 && (
          <div className="stats-label">
            Found: <span className="stats-number">{sortedOptions.length}</span>{" "}
            sections with <span className="stats-number">{totalComments}</span>{" "}
            comments
          </div>
        )}
        <div className="filters-inline">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="filter-select"
          >
            <option value="desc">Most comments</option>
            <option value="asc">Least comments</option>
          </select>
        </div>
      </div>

      {sortedOptions.length > 0 ? (
        <div className="sections-grid">
          {sortedOptions.map((section, idx) => (
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
