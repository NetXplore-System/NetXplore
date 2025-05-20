// import React, { useState } from "react";
// import { Bar } from "react-chartjs-2";
// import { ForceGraph2D } from "react-force-graph";

// import {
//   FormContainer,
//   StyledForm,
//   FormGroup,
//   Label,
//   Input,
//   Button,
//   AlertBox,
//   GraphContainer,
// } from "./Form.style.js";

// const UploadWhatsAppFile = () => {
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState("");
//   const [uploadedFile, setUploadedFile] = useState("");
//   const [chartData, setChartData] = useState(null);
//   const [networkData, setNetworkData] = useState(null);
//   const [filter, setFilter] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [messageLimit, setMessageLimit] = useState(50); 
//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//     setMessage("");
//     setUploadedFile("");
//     setChartData(null);
//     setNetworkData(null);
//   };

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     if (!file) {
//       setMessage("Please select a file before uploading.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", file);

//     fetch("http://localhost:8001/upload", {
//       method: "POST",
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message) {
//           setMessage(data.message);
//           setUploadedFile(data.filename);
//         }
//       })
//       .catch(() => setMessage("An error occurred during the upload."));
//   };

//   const handleDelete = () => {
//     fetch(`http://localhost:8001/delete/${uploadedFile}`, { method: "DELETE" })
//       .then((response) => response.json())
//       .then((data) => {
//         setMessage(data.message || "File deleted successfully!");
//         setUploadedFile("");
//         setChartData(null);
//         setNetworkData(null);
//       })
//       .catch(() =>
//         setMessage("An error occurred during the delete operation.")
//       );
//   };

//   const handleNetworkAnalysis = () => {
//     let url = `http://localhost:8001/analyze/network/${uploadedFile}`;

//     const params = new URLSearchParams();
//     if (startDate) params.append("start_date", startDate);
//     if (endDate) params.append("end_date", endDate);
//     if (messageLimit) params.append("limit", messageLimit);

//     url += `?${params.toString()}`;
//     console.log("Request URL:", url);

//     fetch(url)
//       .then((response) => response.json())
//       .then((data) => {
//         console.log("Data returned from server:", data);
//         if (data.nodes && data.links) {
//           setNetworkData(data);
//         } else {
//           setMessage("No data returned from server.");
//         }
//       })
//       .catch((err) => {
//         setMessage("An error occurred during network analysis.");
//         console.error("Error during network analysis:", err);
//       });
//   };

//   const handleSaveToDB = () => {
//     if (!name || !description) {
//       setMessage("Please fill in all required fields.");
//       return;
//     }
  
//     const formData = {
//       name,
//       description,
//       start_date: startDate,
//     end_date: endDate,
//     message_limit: messageLimit,
//     };
  
//     fetch("http://localhost:8001/save-form", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(formData),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message) {
//           setMessage(data.message);
//         }
//       })
//       .catch(() => setMessage("An error occurred while saving the form."));
//   };
  



//   const filteredNodes = networkData
//     ? networkData.nodes.filter((node) =>
//         node.id.toLowerCase().includes(filter.toLowerCase())
//       )
//     : [];

//   const filteredLinks = networkData
//     ? networkData.links.filter(
//         (link) =>
//           filteredNodes.some((node) => node.id === link.source) &&
//           filteredNodes.some((node) => node.id === link.target)
//       )
//     : [];

//   return (
//     <FormContainer>
//       <h2>Upload WhatsApp Chat File</h2>
//       {message && (
//         <AlertBox success={message.includes("successfully")}>
//           {message}
//         </AlertBox>
//       )}
//       <StyledForm onSubmit={handleSubmit}>
//         {/* Name Input */}
//         <FormGroup>
//           <Label htmlFor="name">Research Name:</Label>
//           <Input
//             type="text"
//             id="name"
//             value={name}
//             placeholder="Enter the name of your research"
//             onChange={(e) => setName(e.target.value)}
//           />
//         </FormGroup>

//         {/* Description Input */}
//         <FormGroup>
//           <Label htmlFor="description">Description:</Label>
//           <Input
//             type="text"
//             id="description"
//             value={description}
//             placeholder="Enter a short description"
//             onChange={(e) => setDescription(e.target.value)}
//           />
//         </FormGroup>

//         <FormGroup>
//           <Label htmlFor="file">Select WhatsApp Chat File</Label>
//           <Input
//             type="file"
//             id="file"
//             accept=".txt"
//             onChange={handleFileChange}
//           />
//         </FormGroup>
//         <Button type="submit">Upload</Button>

//         <Button onClick={handleSaveToDB}>Save to Database</Button>

//       </StyledForm>

//       {uploadedFile && (
//         <div>
//           <p>Uploaded File: {uploadedFile}</p>
//           <div className="d-flex gap-3">
//             <Button onClick={handleDelete}>Delete File</Button>
//             {/* <Button onClick={handleAnalysis}>Show Word Analysis</Button> */}
//           </div>

//           <div>
//             <Label>Start Date:</Label>
//             <Input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//             />
//             <Label>End Date:</Label>
//             <Input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//             />
//             <Button onClick={handleNetworkAnalysis}>
//               Show Network Analysis
//             </Button>
//           </div>

//           <div>
//             <Label>Limit Messages:</Label>
//             <Input
//               type="range"
//               min="10"
//               max="500"
//               step="10"
//               value={messageLimit}
//               onChange={(e) => setMessageLimit(e.target.value)}
//             />
//           </div>

//           {networkData && (
//             <div style={{ height: "500px", border: "1px solid lightgray" }}>
//               <h4>Social Network Analysis</h4>
//               {/* <ForceGraph2D
//                 graphData={{ nodes: filteredNodes, links: filteredLinks }}
//                 nodeAutoColorBy="id"
//                 nodeCanvasObject={(node, ctx, globalScale) => {
//                   const fontSize = 12 / globalScale;
//                   ctx.save();
//                   ctx.font = `${fontSize}px Sans-Serif`;
//                   ctx.textAlign = "center";
//                   ctx.textBaseline = "middle";
//                   ctx.fillStyle = "black";
//                   ctx.fillText(node.id, node.x, node.y + 10);
//                   ctx.restore();
//                 }}
//                 linkWidth={(link) => link.weight || 1}
//                 linkColor={() => "gray"}
//               /> */}



//               <GraphContainer>
//                 <ForceGraph2D
//                   graphData={{ nodes: filteredNodes, links: filteredLinks }}
//                   width={750} // Adjust width based on max-width of GraphContainer
//                   height={400} // Adjust height based on fixed height of GraphContainer
//                   fitView
//                   fitViewPadding={20} // Add padding for better visualization
//                   nodeAutoColorBy="id" // Assign a unique color to each node based on its 'id'
//                   linkWidth={(link) => Math.sqrt(link.weight || 1)} // Set link width based on weight
//                   linkColor={() => "gray"} // Keep links in gray color
//                   linkCanvasObject={(link, ctx, globalScale) => {
//                     // Draw the link line
//                     ctx.beginPath();
//                     ctx.moveTo(link.source.x, link.source.y);
//                     ctx.lineTo(link.target.x, link.target.y);
//                     ctx.strokeStyle = "gray"; // Set link color
//                     ctx.lineWidth = Math.sqrt(link.weight || 1); // Set link width based on weight
//                     ctx.stroke();

//                     // Add the weight label at the midpoint of the link
//                     const midX = (link.source.x + link.target.x) / 2;
//                     const midY = (link.source.y + link.target.y) / 2;
//                     const fontSize = 10 / globalScale; // Adjust font size dynamically
//                     ctx.save();
//                     ctx.font = `${fontSize}px Sans-Serif`;
//                     ctx.fillStyle = "black";
//                     ctx.textAlign = "center";
//                     ctx.textBaseline = "middle";
//                     ctx.fillText(link.weight || "1", midX, midY); // Display the weight at the midpoint
//                     ctx.restore();
//                   }}
//                   nodeCanvasObject={(node, ctx, globalScale) => {
//                     const fontSize = 12 / globalScale; // Adjust font size dynamically
//                     const radius = 8; // Radius for the node circle
//                     ctx.save();

//                     // Draw the node circle
//                     ctx.beginPath();
//                     ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
//                     ctx.fillStyle = node.color || "blue"; // Use the auto-generated color
//                     ctx.fill();

//                     // Add a label under the node
//                     ctx.font = `${fontSize}px Sans-Serif`;
//                     ctx.textAlign = "center";
//                     ctx.textBaseline = "middle";
//                     ctx.fillStyle = "black";
//                     ctx.fillText(node.id, node.x, node.y + radius + 12); // Position labels under the nodes
//                     ctx.restore();
//                   }}
//                 />
//               </GraphContainer>
//             </div>
//           )}
//         </div>
//       )}
//     </FormContainer>
    
//   );
// };

// export default UploadWhatsAppFile;