// Form.styled.js
import styled from 'styled-components';

export const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f5f7fa;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Ensures nothing overflows */
`;


export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  font-size: 1rem;
  color: #333;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  color: black;
  font-size: 1rem;
  background-color: #f9f9f9;
`;

export const Button = styled.button`
  padding: 12px 20px;
  background-color: #1d3557;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #457b9d;
  }
`;

export const AlertBox = styled.div`
  margin: 15px 0;
  padding: 5px;
  font-size: 12px;
  background-color: ${(props) => (props.success ? "#d4edda" : "#f8d7da")};
  color: ${(props) => (props.success ? "#155724" : "#721c24")};
  border: 1px solid ${(props) => (props.success ? "#c3e6cb" : "#f5c6cb")};
  border-radius: 8px;
`;

export const GraphContainer = styled.div`
  width: 100%; /* Ensures it takes the full width of the parent */
  margin: 0 auto;
  border: 1px solid lightgray;
  border-radius: 8px;
  overflow: hidden; /* Prevents overflow */
  position: relative;
  display: flex; /* Ensure content is centered */
  justify-content: center;
  align-items: center;
`;