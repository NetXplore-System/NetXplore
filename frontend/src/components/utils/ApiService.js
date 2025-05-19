export const BASE_URL = import.meta.env.VITE_API_URL;


export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    throw Error(error || "An error occurred during the upload.");
  }
};

export const deleteFile = async (filename) => {
  try {
    const response = await fetch(`${BASE_URL}/delete/${filename}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(error || "An error occurred during the delete operation.");
  }
};

export const saveFormToDB = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/save-form`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving form:", error);
    throw new Error(error || "An error occurred while saving the form.");
  }
};

export const analyzeNetwork = async (filename, params) => {
  try {
    const url = `${BASE_URL}/analyze/network/${filename}?${params.toString()}`;
    console.log("Request URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error("Error during network analysis:", error);
    throw new Error(error || "An error occurred during network analysis.");
  }
};

export const analyzeDecayingNetwork = async (filename, params) => {
  try {
    const url = `${BASE_URL}/analyze/decaying-network/${filename}?${params.toString()}`;
    console.log("Request URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during decaying network analysis:", error);
    throw new Error(error || "An error occurred during decaying network analysis.");
  }
};

export const detectCommunities = async (filename, params) => {
  try {
    params.append("algorithm", "louvain");
    const url = `${BASE_URL}/analyze/communities/${filename}?${params.toString()}`;
    console.log("Community detection URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during community detection:", error);
    throw new Error(error || "An error occurred during community detection.");
  }
};

export const compareNetworks = async (params) => {
  try {
    const url = `${BASE_URL}/analyze/compare-networks?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error("Error during network comparisons:", error);
    throw new Error(error || "An error occurred during network comparisons.");
  }
};

export const analyzeWikipediaNetwork = async (filename, params) => {
  try {
    const url = `${BASE_URL}/analyze/wikipedia/${filename}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return await response.json();
  } catch (error) {
    console.error("Error during Wikipedia network analysis:", error);
    throw new Error("An error occurred during Wikipedia network analysis.");
  }
};


export const saveToDB = async (
  id,
  name,
  description,
  file,
  params,
  selectedMetric = "Degree Centrality",
  comparison,
  platform = "whatsapp"
) => {

  try {
    const formData = new FormData();

    formData.append("research_name", name);
    formData.append("researcher_id", id);
    formData.append("description", description);
    comparison.hasComparison && formData.append("comparison", JSON.stringify(comparison.data));
    formData.append("file_name", file);
    formData.append("selected_metric", selectedMetric);
    formData.append("platform", platform);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/save-research?${params.toString()}`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (!response.ok) {
      const { detail } = await response.json();
      console.error("Error response:", detail);
      throw new Error(detail || "An error occurred while saving the research.");
    }

    return "Research saved successfully!";

  } catch (error) {
    console.error("Save error:", error);
    throw new Error("An error occurred while saving the research.");
  }
};
