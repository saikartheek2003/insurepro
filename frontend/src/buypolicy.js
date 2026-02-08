// src/BuyPolicy.js
import React, { useState } from 'react';
import PolicyCard from './PolicyCard';
import PolicyDetailView from './PolicyDetailView';
import PolicyForm from './policyForm'; 
import PolicyStyles from './PolicyStyles';
import { policiesData } from './PoliciesData';

export default function BuyPolicy({ navigateTo, token }) {
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [policyToBuy, setPolicyToBuy] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    const handleSelectPolicy = (policy) => {
        setIsClosing(false);
        setSelectedPolicy(policy);
    };

    const handleCloseDetails = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedPolicy(null);
            setIsClosing(false);
        }, 400);
    };

    const handleOpenForm = (policy) => {
        console.log('Opening form for policy:', policy); // Debug log
        setSelectedPolicy(null);
        setPolicyToBuy(policy);
    };

    const handleCloseForm = () => {
        setPolicyToBuy(null);
    };

    const handleFormSubmit = (formData) => {
        console.log('Form submitted with data:', formData);
        // Handle form submission 
        handleCloseForm();
    };

    // Extract policy type from the policy category/type
    const getPolicyType = (policy) => {
        // Check if the policy has a type field
        if (policy.type) {
            return policy.type;
        }
        
        // Otherwise, determine from the policy data structure
        if (policiesData.health.some(p => p.id === policy.id)) {
            return 'Health';
        } else if (policiesData.life.some(p => p.id === policy.id)) {
            return 'Life';
        } else if (policiesData.auto.some(p => p.id === policy.id)) {
            return 'Auto';
        }
        
        return null;
    };

    return (
        <>
            <PolicyStyles />
            <section className={`policies-page ${selectedPolicy || policyToBuy ? 'details-visible' : ''}`}>
                <div className="container">
                    <div className="back-to-home" onClick={() => navigateTo('home')}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        <span>Back to Home</span>
                    </div>
                    
                    <div className="policies-header">
                        <h2 className="policies-title">Explore Our Policies</h2>
                    </div>

                    {/* Health Insurance Section */}
                    <div className="policy-category">
                        <h3 className="category-title">Health Insurance</h3>
                        <div className="policy-grid">
                            {policiesData.health.map(policy => (
                                <PolicyCard 
                                    key={policy.id} 
                                    policy={policy} 
                                    onSelect={handleSelectPolicy} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Life Insurance Section */}
                    <div className="policy-category">
                        <h3 className="category-title">Life Insurance</h3>
                        <div className="policy-grid">
                            {policiesData.life.map(policy => (
                                <PolicyCard 
                                    key={policy.id} 
                                    policy={policy} 
                                    onSelect={handleSelectPolicy} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Auto Insurance Section */}
                    <div className="policy-category">
                        <h3 className="category-title">Auto Insurance</h3>
                        <div className="policy-grid">
                            {policiesData.auto.map(policy => (
                                <PolicyCard 
                                    key={policy.id} 
                                    policy={policy} 
                                    onSelect={handleSelectPolicy} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Policy Detail Modal */}
            {selectedPolicy && (
                <PolicyDetailView 
                    policy={selectedPolicy} 
                    onClose={handleCloseDetails} 
                    onBuyNow={handleOpenForm} 
                    isClosing={isClosing} 
                />
            )}

            {/* Buy Policy Form Modal */}
            {policyToBuy && (
                <div className="form-modal-overlay" onClick={handleCloseForm}>
                    <div className="form-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="form-modal-close" onClick={handleCloseForm}>
                            ×
                        </button>
                        <PolicyForm 
                            preSelectedPolicyType={getPolicyType(policyToBuy)}
                            onProceed={handleFormSubmit}
                        />
                    </div>
                </div>
            )}
        </>
    );
}