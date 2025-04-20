import styled, { keyframes } from 'styled-components';
import { FaSpinner } from 'react-icons/fa';

// Create rotation animation
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled spinner component
const StyledSpinner = styled(FaSpinner)`
  animation: ${rotate} 1.5s linear infinite;
  display: inline-block;
  font-size: 2rem;
  margin: 0 auto;
  color: #007bff; /* Change color as needed */
`;

const Loader = () => {
  return <StyledSpinner />;
};

export default Loader;