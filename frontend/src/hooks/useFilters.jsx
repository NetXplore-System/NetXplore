import { useState } from "react";

const useFilters = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [messageLimit, setMessageLimit] = useState(50);
  const [limitType, setLimitType] = useState("first");
  const [minMessageLength, setMinMessageLength] = useState(10);
  const [maxMessageLength, setMaxMessageLength] = useState(100);
  const [keywords, setKeywords] = useState("");

  const [usernameFilter, setUsernameFilter] = useState("");
  const [minMessages, setMinMessages] = useState("");
  const [maxMessages, setMaxMessages] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [selectedUsers, setSelectedUsers] = useState("");
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [weightCalculationDepth, setWeightCalculationDepth] = useState(3);


  const [showFilters, setShowFilters] = useState(true);
  const [filter, setFilter] = useState("");

  const formatTime = (time) => {
    return time && time.length === 5 ? `${time}:00` : time;
  };

  const buildNetworkFilterParams = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (messageLimit) params.append("limit", messageLimit);
    if (minMessageLength) params.append("min_length", minMessageLength);
    if (maxMessageLength) params.append("max_length", maxMessageLength);
    if (keywords) params.append("keywords", keywords);
    if (usernameFilter) params.append("username", usernameFilter);
    if (minMessages) params.append("min_messages", minMessages);
    if (maxMessages) params.append("max_messages", maxMessages);
    if (activeUsers) params.append("active_users", activeUsers);
    if (selectedUsers) params.append("selected_users", selectedUsers);
    if (startTime) params.append("start_time", formatTime(startTime));
    if (endTime) params.append("end_time", formatTime(endTime));
    if (limitType) params.append("limit_type", limitType);
    if (weightCalculationDepth) params.append("n_prev", weightCalculationDepth);
    params.append("anonymize", isAnonymized ? "true" : "false");

    return params;
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setMessageLimit(50);
    setLimitType("first");
    setMinMessageLength(10);
    setMaxMessageLength(100);
    setKeywords("");
    setUsernameFilter("");
    setMinMessages("");
    setMaxMessages("");
    setActiveUsers("");
    setSelectedUsers("");
    setFilter("");
    setWeightCalculationDepth(3)
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return {
    startDate,
    endDate,
    startTime,
    endTime,
    messageLimit,
    limitType,
    minMessageLength,
    maxMessageLength,
    keywords,
    usernameFilter,
    minMessages,
    maxMessages,
    activeUsers,
    selectedUsers,
    isAnonymized,
    weightCalculationDepth,
    showFilters,
    filter,

    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setMessageLimit,
    setLimitType,
    setMinMessageLength,
    setMaxMessageLength,
    setKeywords,
    setUsernameFilter,
    setMinMessages,
    setMaxMessages,
    setActiveUsers,
    setSelectedUsers,
    setIsAnonymized,
    setWeightCalculationDepth,
    setShowFilters,
    setFilter,

    formatTime,
    buildNetworkFilterParams,
    resetFilters,
    handleInputChange,
  };
};

export default useFilters;
