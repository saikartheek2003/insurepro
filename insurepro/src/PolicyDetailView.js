// src/components/PolicyDetailView.js
import React, { useEffect } from "react";

const PolicyDetailView = ({ policy, onBuyNow, onClose, isClosing }) => {
  // ESC close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!policy) return null; // safety check

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <section
      className={`policy-detail-view ${isClosing ? "closing" : ""}`}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-title"
    >
      <div
        className="policy-detail-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="policy-detail-header">
          <h2 id="policy-title" className="policy-detail-title">
            {policy.title} <span className="policy-id">(ID: {policy.id})</span>
          </h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            &times;
          </button>
        </header>

        {/* Body */}
        <div className="policy-detail-body">
          <div className="detail-section">
            <p className="detail-label">Provider</p>
            <p className="detail-value">{policy.provider}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">Coverage</p>
            <p className="detail-value">{policy.coverage}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">Premium</p>
            <p className="detail-value">{policy.premium}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">Deductible</p>
            <p className="detail-value">{policy.deductible || "N/A"}</p>
          </div>

          {policy.term && (
            <div className="detail-section">
              <p className="detail-label">Term</p>
              <p className="detail-value">{policy.term}</p>
            </div>
          )}

          <div className="detail-section">
            <p className="detail-label">Details</p>
            <p className="detail-value">{policy.details}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">Key Benefits</p>
            <ul className="detail-list">
              {policy.benefits?.length > 0 ? (
                policy.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))
              ) : (
                <li>No benefits listed</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="policy-detail-footer">
          <button className="buy-now-btn" onClick={() => onBuyNow(policy)}>
            Buy Now
          </button>
        </footer>
      </div>
    </section>
  );
};

export default PolicyDetailView;
