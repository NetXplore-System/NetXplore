import React from "react";
import { Button, Form } from "react-bootstrap";
import { Upload } from "react-bootstrap-icons";
import { AlertBox } from "../../pages/Form.style.js";

const FileUploader = ({
  inputKey,
  fileInputRef,
  handleUploadClick,
  handleFileChange,
  message,
}) => {
  return (
    <div className="d-flex flex-column align-items-center mt-3 mt-lg-0">
      <Button className="upload-btn" onClick={handleUploadClick}>
        <Upload size={16} /> Upload File
      </Button>

      <Form.Control
        type="file"
        accept=".txt"
        ref={fileInputRef}
        onChange={handleFileChange}
        key={inputKey}
        style={{ display: "none" }}
      />

      {message && (
        <AlertBox success={message.includes("successfully").toString()}>
          {message}
        </AlertBox>
      )}
    </div>
  );
};

export default FileUploader;
