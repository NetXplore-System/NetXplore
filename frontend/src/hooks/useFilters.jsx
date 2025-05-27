import { useState } from "react";

const useFilters = (formData = null) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [messageLimit, setMessageLimit] = useState(50);
  const [limitType, setLimitType] = useState("first");
  const [minMessageLength, setMinMessageLength] = useState("");
  const [maxMessageLength, setMaxMessageLength] = useState("");  
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

    const get = (fallback, path) => {
      if (!formData) return fallback;
      return path?.reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null),
        formData
      );
    };

    const getValue = (fallback, path) => get(fallback, path) || fallback;

    const hasFormData = formData !== null;

    const limitEnabled = hasFormData ? get(false, ["limit", "enabled"]) : true;

    const start = getValue(startDate, ["timeFrame", "startDate"]);
    const end = getValue(endDate, ["timeFrame", "endDate"]);
    const startT = formatTime(getValue(startTime, ["timeFrame", "startTime"]));
    const endT = formatTime(getValue(endTime, ["timeFrame", "endTime"]));

    const limit = limitEnabled
      ? getValue(messageLimit, ["limit", "count"])
      : null;

    const fromEnd = get(false, ["limit", "fromEnd"]);
    const type = fromEnd ? "last" : "first";

    const minLen = getValue(minMessageLength, ["messageCriteria", "minLength"]);
    const maxLen = getValue(maxMessageLength, ["messageCriteria", "maxLength"]);
    const words = getValue(keywords, ["messageCriteria", "keywords"]);
    const contentFilter = getValue("", ["messageCriteria", "contentFilter"]);

    const uname = getValue(usernameFilter, ["userFilters", "usernameFilter"]);
    const minMsg = getValue(minMessages, ["userFilters", "minMessages"]);
    const maxMsg = getValue(maxMessages, ["userFilters", "maxMessages"]);
    const active = getValue(activeUsers, ["userFilters", "activeUsers"]);
    const selected = getValue(selectedUsers, ["userFilters", "selectedUsers"]);

    const anonymized = getValue(isAnonymized, ["isAnonymized"]);
    const directed = getValue(true, ["isDirectedGraph"]);
    const useTriads = getValue(false, ["useTriads"]);
    const useHistoryAlgo = getValue(false, ["useHistoryAlgorithm"]);
    const normalized = getValue(false, ["isNormalized"]);

    if (start) params.append("start_date", start);
    if (end) params.append("end_date", end);

    if (limitEnabled && limit) {
      params.append("limit", limit);
      params.append("limit_type", type); 
    }

    if (minLen !== "" && minLen !== null) params.append("min_length", minLen);
    if (maxLen !== "" && maxLen !== null) params.append("max_length", maxLen);    
    if (words) params.append("keywords", words);
    if (contentFilter) params.append("content_filter", contentFilter);
    if (uname) params.append("username", uname);
    if (minMsg) params.append("min_messages", minMsg);
    if (maxMsg) params.append("max_messages", maxMsg);
    if (active) params.append("active_users", active);
    if (selected) params.append("selected_users", selected);
    if (startT) params.append("start_time", startT);
    if (endT) params.append("end_time", endT);

    params.append("anonymize", anonymized ? "true" : "false");
    params.append("directed", directed ? "true" : "false");
    params.append("use_triads", useTriads ? "true" : "false");
    params.append("use_history", useHistoryAlgo ? "true" : "false");
    params.append("normalize", normalized ? "true" : "false");

    return params;
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setMessageLimit(50);
    setLimitType("first");
    setMinMessageLength(1);
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
