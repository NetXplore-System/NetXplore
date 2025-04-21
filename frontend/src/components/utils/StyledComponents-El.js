import styled from 'styled-components';

export const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2rem;
  margin-top: 2rem;
`;

export const ComparisonGrid = styled.div`
  display: grid;
  margin-top: 2rem;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  & > :first-child {
    grid-row: 1 / 2;
    grid-column: 1 / 3;
  }
  
  & > :nth-child(2) {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
  }
  
  & > :nth-child(3) {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
  }
  
  & > :nth-child(4) {
    grid-row: 3 / 4;
    grid-column: 1 / 3;
  }
`;


export const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 1.5rem;
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  th {
    background-color: #f8f9fa;
  }
  border: 1px solid #e0e0e0;
  border-radius: 1rem;
`;

export const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background-color: ${props => props.status ? '#d4edda' : '#f8d7da'};
  color: ${props => props.status ? '#155724' : '#721c24'};
`;
export const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    opacity: 0.9;
  }

  ${props => props.variant === 'primary' && `
    background-color: #007bff;
    color: white;
  `}

  ${props => props.variant === 'success' && `
    background-color: #28a745;
    color: white;
  `}

  ${props => props.variant === 'warning' && `
    background-color: #ffc107;
    color: black;
  `}

  ${props => props.variant === 'danger' && `
    background-color: #dc3545;
    color: white;
  `}
`;

export const ContainerLoader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 2rem;
`;


export const GraphContainer = styled.div`
  width: 100%; /* Ensures it takes the full width of the parent */
  margin: 0 auto;
  border: 1px solid lightgray;
  border-radius: 8px;
  overflow: hidden; /* Prevents overflow */
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
`;


export const FormContainer = styled.div`
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f9f9f9;
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
`;

export const Column = styled.div`
  flex: ${(props) => (props.fullWidth ? '0 0 100%' : '0 0 25%')};
  max-width: ${(props) => (props.fullWidth ? '100%' : '25%')};
  padding: 0 10px;
  box-sizing: border-box;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex: 0 0 50%;
    max-width: 50%;
  }

  @media (max-width: 480px) {
    flex: 0 0 100%;
    max-width: 100%;
  }
`;

export const StyledInput = styled.input`
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  background-color: white;
  color: black;
  box-sizing: border-box;
  border: 2px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.3s;
  &:focus {
    border-color: #4CAF50;
    outline: none;
  }
`;

export const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  background-color: white;
  color: black;
  box-sizing: border-box;
  border: 2px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.3s;
  &:focus {
    border-color: #4CAF50;
    outline: none;
  }
`;


export const GraphButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 900;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:active {
    background-color: #003f7f;
  }
`;
