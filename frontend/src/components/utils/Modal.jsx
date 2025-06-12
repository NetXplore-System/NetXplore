import './modal.css';
import { X } from 'react-bootstrap-icons';

const Modal = ({ children, onClose, showCloseButton }) => {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;