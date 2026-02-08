// src/components/PolicyCard.js
import React from 'react';

const PolicyCard = ({ policy, onSelect }) => {
    return (
        <div className="policy-card">
            <div className="policy-card-content">
                <h3 className="policy-card-title">{policy.title} (ID: {policy.id})</h3>
                <p className="policy-card-provider">by {policy.provider}</p>
                <div className="policy-card-details">
                    <div>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Coverage</span>
                        <p className="policy-card-coverage">{policy.coverage}</p>
                    </div>
                    <p className="policy-card-premium">{policy.premium}</p>
                </div>
            </div>
            <div className="policy-card-footer">
                <button onClick={() => onSelect(policy)} className="policy-card-cta">
                    View Details
                </button>
            </div>
        </div>
    );
};

export default PolicyCard;