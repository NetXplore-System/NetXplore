import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  overflow-y: auto;
`;

const DialogContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  // max-width: 1200px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 50px 0;
`;

const Modal = ({ children, onClose }) => {
  return (
    <Overlay onClick={onClose}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogContent>
    </Overlay>
  );
};

export default Modal;