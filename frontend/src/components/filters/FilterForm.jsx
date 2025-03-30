import React, { useState } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { ChevronUp, ChevronDown } from "react-bootstrap-icons";
import DateRangeFilter from "./DateRangeFilter";
import UserFilter from "./UserFilter";
import MessageFilter from "./MessageFilter";

const FilterForm = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  messageLimit,
  setMessageLimit,
  limitType,
  setLimitType,
  minMessageLength,
  setMinMessageLength,
  maxMessageLength,
  setMaxMessageLength,
  keywords,
  setKeywords,
  usernameFilter,
  setUsernameFilter,
  minMessages,
  setMinMessages,
  maxMessages,
  setMaxMessages,
  activeUsers,
  setActiveUsers,
  selectedUsers,
  setSelectedUsers,
  isAnonymized,
  setIsAnonymized,
  handleNetworkAnalysis,
}) => {
  const [showFilters, setShowFilters] = useState(true);

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <Card className="research-card">
      <h4 className="fw-bold d-flex justify-content-between align-items-center">
        Research Filters
        <Button
          variant="link"
          className="toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </h4>
      {showFilters && (
        <div>
          <DateRangeFilter
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            messageLimit={messageLimit}
            setMessageLimit={setMessageLimit}
            limitType={limitType}
            setLimitType={setLimitType}
            handleInputChange={handleInputChange}
          />

          <MessageFilter
            minMessageLength={minMessageLength}
            setMinMessageLength={setMinMessageLength}
            maxMessageLength={maxMessageLength}
            setMaxMessageLength={setMaxMessageLength}
            keywords={keywords}
            setKeywords={setKeywords}
            handleInputChange={handleInputChange}
          />

          <UserFilter
            usernameFilter={usernameFilter}
            setUsernameFilter={setUsernameFilter}
            minMessages={minMessages}
            setMinMessages={setMinMessages}
            maxMessages={maxMessages}
            setMaxMessages={setMaxMessages}
            activeUsers={activeUsers}
            setActiveUsers={setActiveUsers}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
          />

          <Row className="align-items-center justify-content-between mt-3">
            <Col>
              <Button onClick={handleNetworkAnalysis} className="filter-btn">
                Apply Filters
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

export default FilterForm;