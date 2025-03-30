import React from "react";
import styled from "styled-components";

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToggleLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
`;

const ToggleInput = styled.input`
  appearance: none;
  width: 40px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  outline: none;
  cursor: pointer;
  transition: 0.3s;

  &:checked {
    background: #050d2d;
  }

  &::before {
    content: "";
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 1px;
    left: 2px;
    transition: 0.3s;
  }

  &:checked::before {
    left: 20px;
  }
`;

const AnonymizationToggle = ({ isAnonymized, setIsAnonymized }) => {
  return (
    <ToggleContainer>
      <ToggleLabel>Enable Anonymization</ToggleLabel>
      <ToggleInput
        type="checkbox"
        checked={isAnonymized}
        onChange={() => setIsAnonymized((prev) => !prev)}
      />
    </ToggleContainer>
  );
};

export default AnonymizationToggle;
