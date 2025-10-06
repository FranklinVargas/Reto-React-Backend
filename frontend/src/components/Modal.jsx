import PropTypes from "prop-types";

export default function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-content">
        <header>
          <h3>{title}</h3>
        </header>
        <div>{children}</div>
        <div className="modal-actions">
          {actions}
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.node
};
