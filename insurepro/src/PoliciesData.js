// src/data/policiesData.js

export const policiesData = {
    health: [
        { 
            id: "HP1", 
            title: "HealthGuard Plus", 
            type: "health", 
            provider: "Star Health Insurance", 
            coverage: "₹10,00,000", 
            coverageAmount: 1000000,
            premium: "₹12,500/year", 
            premiumAmount: 12500,
            deductible: "₹25,000", 
            deductibleAmount: 25000,
            details: "Comprehensive health insurance for individuals covering hospitalization, pre & post hospitalization expenses.", 
            benefits: [
                "Cashless treatment at 9000+ hospitals", 
                "Pre & Post hospitalization (30-60 days)", 
                "Day care procedures covered", 
                "Annual health check-up",
                "Maternity benefits (after 2 years)",
                "Emergency ambulance coverage"
            ],
            features: {
                roomRent: "Single AC room",
                copayment: "No copayment",
                waitingPeriod: "2-4 years for specific diseases",
                renewalBonus: "5% increase in sum insured every claim-free year"
            }
        },
        { 
            id: "FW2", 
            title: "Family Wellness Shield", 
            type: "health", 
            provider: "HDFC ERGO Health Insurance", 
            coverage: "₹15,00,000", 
            coverageAmount: 1500000,
            premium: "₹22,800/year", 
            premiumAmount: 22800,
            deductible: "₹50,000", 
            deductibleAmount: 50000,
            details: "Comprehensive family floater plan covering 2 adults and 2 children with extensive benefits.", 
            benefits: [
                "Family floater for up to 6 members", 
                "Dental & Eye treatment covered", 
                "Annual preventive health check-up", 
                "Mental health counseling sessions",
                "Ayush treatment coverage",
                "Home healthcare services",
                "Teleconsultation included"
            ],
            features: {
                roomRent: "1% of sum insured per day",
                copayment: "10% for members above 60",
                waitingPeriod: "2 years for pre-existing diseases",
                renewalBonus: "10% bonus for every claim-free year"
            }
        },
        { 
            id: "SS3", 
            title: "Senior Citizen Care", 
            type: "health", 
            provider: "National Insurance Company", 
            coverage: "₹5,00,000", 
            coverageAmount: 500000,
            premium: "₹18,500/year", 
            premiumAmount: 18500,
            deductible: "₹15,000", 
            deductibleAmount: 15000,
            details: "Specially designed for senior citizens (60+ years) with comprehensive coverage for age-related illnesses.", 
            benefits: [
                "Coverage for pre-existing diseases", 
                "No upper age limit for renewal", 
                "Physiotherapy & rehabilitation", 
                "Home nursing care (up to 30 days)",
                "Critical illness benefits",
                "Domiciliary hospitalization",
                "Organ donor expenses"
            ],
            features: {
                roomRent: "₹5,000 per day limit",
                copayment: "20% for first year, 10% thereafter",
                waitingPeriod: "1 year for pre-existing conditions",
                renewalBonus: "5% for every two claim-free years"
            }
        },
        { 
            id: "SH4", 
            title: "Essential Health Cover", 
            type: "health", 
            provider: "New India Assurance", 
            coverage: "₹3,00,000", 
            coverageAmount: 300000,
            premium: "₹6,800/year", 
            premiumAmount: 6800,
            deductible: "₹20,000", 
            deductibleAmount: 20000,
            details: "Affordable health insurance plan for young professionals and individuals seeking basic coverage.", 
            benefits: [
                "Cashless hospitalization", 
                "Emergency ambulance", 
                "Pre-hospitalization (30 days)", 
                "Post-hospitalization (60 days)",
                "Day care procedures",
                "Health check-up (every 3 years)"
            ],
            features: {
                roomRent: "₹2,000 per day",
                copayment: "No copayment",
                waitingPeriod: "2 years for specific illnesses",
                renewalBonus: "₹50,000 increase every claim-free year"
            }
        }
    ],
    life: [
        { 
            id: "LT1", 
            title: "Term Life Secure", 
            type: "life", 
            provider: "LIC of India", 
            coverage: "₹1,00,00,000", 
            coverageAmount: 10000000,
            premium: "₹15,000/year", 
            premiumAmount: 15000,
            deductible: "N/A", 
            deductibleAmount: 0,
            term: "30 years", 
            details: "Pure term life insurance providing maximum coverage at affordable premiums with tax benefits.", 
            benefits: [
                "Tax benefits under Section 80C & 10(10D)", 
                "Accidental death benefit rider", 
                "Terminal illness benefit", 
                "Flexible premium payment options",
                "Online policy management",
                "Quick claim settlement"
            ],
            features: {
                policyTerm: "15-40 years",
                paymentTerm: "Regular pay / Single pay",
                maturityBenefit: "No maturity benefit (Pure term)",
                riders: "Accidental, Critical illness, Waiver of premium"
            }
        },
        { 
            id: "WL2", 
            title: "Whole Life Prosperity", 
            type: "life", 
            provider: "SBI Life Insurance", 
            coverage: "₹25,00,000", 
            coverageAmount: 2500000,
            premium: "₹45,000/year", 
            premiumAmount: 45000,
            deductible: "N/A", 
            deductibleAmount: 0,
            term: "Whole Life", 
            details: "Permanent life insurance with savings component, providing lifelong protection and wealth creation.", 
            benefits: [
                "Lifelong life insurance coverage", 
                "Guaranteed cash value accumulation", 
                "Loan facility against policy", 
                "Bonus additions every year",
                "Tax benefits on premiums and proceeds",
                "Surrender value after 3 years"
            ],
            features: {
                policyTerm: "Whole life (up to 99 years)",
                paymentTerm: "5-30 years",
                maturityBenefit: "At age 99 or death, whichever earlier",
                riders: "Accidental death, Critical illness"
            }
        },
        { 
            id: "RG3", 
            title: "Retirement Guardian", 
            type: "life", 
            provider: "HDFC Life Insurance", 
            coverage: "₹15,00,000", 
            coverageAmount: 1500000,
            premium: "₹28,500/year", 
            premiumAmount: 28500,
            deductible: "N/A", 
            deductibleAmount: 0,
            term: "20 years", 
            details: "Unit-linked life insurance plan combining life cover with investment to build retirement corpus.", 
            benefits: [
                "Life cover + Investment growth", 
                "Choice of fund options", 
                "Partial withdrawals allowed", 
                "Top-up facility available",
                "Flexibility to switch funds",
                "Tax benefits under various sections"
            ],
            features: {
                policyTerm: "15-30 years",
                paymentTerm: "5-25 years",
                maturityBenefit: "Fund value or sum assured (higher)",
                riders: "Waiver of premium, Accidental disability"
            }
        },
        { 
            id: "YT4", 
            title: "Young Professional Term", 
            type: "life", 
            provider: "Max Life Insurance", 
            coverage: "₹50,00,000", 
            coverageAmount: 5000000,
            premium: "₹8,500/year", 
            premiumAmount: 8500,
            deductible: "N/A", 
            deductibleAmount: 0,
            term: "25 years", 
            details: "Affordable term insurance designed for young professionals starting their career and financial planning.", 
            benefits: [
                "High coverage at low premium", 
                "Increasing life cover option", 
                "Terminal illness benefit", 
                "Accidental death benefit",
                "Online application process",
                "Simplified underwriting"
            ],
            features: {
                policyTerm: "10-40 years",
                paymentTerm: "Regular throughout term",
                maturityBenefit: "No maturity benefit",
                riders: "Accidental death, Critical illness coverage"
            }
        }
    ],
    auto: [
        { 
            id: "AM1", 
            title: "Comprehensive Car Insurance", 
            type: "auto", 
            provider: "Bajaj Allianz General Insurance", 
            coverage: "Own Damage + Third Party", 
            coverageAmount: 500000,
            premium: "₹18,500/year", 
            premiumAmount: 18500,
            deductible: "₹2,500", 
            deductibleAmount: 2500,
            details: "Complete protection for your car against accidents, theft, natural disasters, and third-party liabilities.", 
            benefits: [
                "Own damage coverage up to IDV", 
                "Third-party liability (unlimited)", 
                "Personal accident cover (₹15 lakhs)", 
                "24/7 roadside assistance",
                "Cashless garage network (4000+)",
                "Zero depreciation add-on available",
                "Engine protection cover"
            ],
            features: {
                idv: "₹5,00,000 - ₹15,00,000",
                ncb: "20-50% no claim bonus",
                addOns: "Zero dep, Engine protect, Consumables",
                validity: "1 year"
            }
        },
        { 
            id: "TP2", 
            title: "Third Party Liability Only", 
            type: "auto", 
            provider: "New India Assurance", 
            coverage: "Third Party Only", 
            coverageAmount: 0,
            premium: "₹2,200/year", 
            premiumAmount: 2200,
            deductible: "N/A", 
            deductibleAmount: 0,
            details: "Mandatory third-party insurance covering legal liability for bodily injury/death and property damage to third parties.", 
            benefits: [
                "Unlimited third-party liability coverage", 
                "Personal accident cover (₹15 lakhs)", 
                "Legal compliance with Motor Vehicle Act", 
                "Coverage across India",
                "Quick policy issuance"
            ],
            features: {
                idv: "Not applicable",
                ncb: "Not applicable for TP",
                addOns: "Only PA cover enhancement",
                validity: "1 year (mandatory)"
            }
        },
        { 
            id: "NDS3", 
            title: "New Car Protection Plus", 
            type: "auto", 
            provider: "IFFCO Tokio General Insurance", 
            coverage: "Comprehensive + Add-ons", 
            coverageAmount: 800000,
            premium: "₹25,000/year", 
            premiumAmount: 25000,
            deductible: "₹1,000", 
            deductibleAmount: 1000,
            details: "Premium comprehensive insurance for new cars with additional protection and zero depreciation benefits.", 
            benefits: [
                "Zero depreciation for 5 years", 
                "Engine and gear box protection", 
                "Consumables cover", 
                "Key replacement cover",
                "Tyre protection",
                "Return to invoice",
                "Emergency transportation"
            ],
            features: {
                idv: "₹8,00,000 - ₹20,00,000",
                ncb: "50% maximum after 5 years",
                addOns: "Zero dep, Engine, Consumables, RTI",
                validity: "1-3 years (long term)"
            }
        },
        { 
            id: "TW4", 
            title: "Two Wheeler Comprehensive", 
            type: "auto", 
            provider: "United India Insurance", 
            coverage: "Own Damage + Third Party", 
            coverageAmount: 85000,
            premium: "₹3,200/year", 
            premiumAmount: 3200,
            deductible: "₹500", 
            deductibleAmount: 500,
            details: "Complete insurance coverage for motorcycles and scooters with theft protection and third-party liability.", 
            benefits: [
                "Own damage up to IDV", 
                "Theft protection", 
                "Third-party liability coverage", 
                "Personal accident (₹1 lakh)",
                "Pillion rider cover",
                "Accessories cover (₹5,000)"
            ],
            features: {
                idv: "₹50,000 - ₹2,00,000",
                ncb: "20-50% no claim bonus",
                addOns: "Zero depreciation, Pillion cover",
                validity: "1 year"
            }
        }
    ]
};

// Utility functions for payment processing
export const calculateTotalAmount = (premium, deductible = 0, gst = 18, processingFee = 100) => {
    
    const premiumAmount = Number(premium) || 0;
    const deductibleAmount = Number(deductible) || 0;
    const gstRate = Number(gst) || 18;
    const fee = Number(processingFee) || 100;
    
    if (premiumAmount <= 0) {
        console.error("Invalid premium amount for calculation:", premium);
        return 0;
    }
    
    // Calculate GST on premium
    const gstAmount = (premiumAmount * gstRate) / 100;
    
   
    const totalAmount = premiumAmount + gstAmount + fee;
    
    console.log("=== CALCULATION BREAKDOWN ===");
    console.log("Premium:", premiumAmount);
    console.log("GST (18%):", gstAmount);
    console.log("Processing Fee:", fee);
    console.log("Deductible (not added):", deductibleAmount);
    console.log("Total Amount:", totalAmount);
    console.log("=============================");
    
    return Math.round(totalAmount * 100) / 100; 
};

export const getPaymentBreakdown = (policy) => {
    if (!policy || !policy.premiumAmount) {
        console.error("Invalid policy data for breakdown:", policy);
        return null;
    }
    
    const gstRate = 18;
    const processingFee = 100;
    const premiumAmount = Number(policy.premiumAmount) || 0;
    const deductibleAmount = Number(policy.deductibleAmount) || 0;
    
    if (premiumAmount <= 0) {
        console.error("Invalid premium amount in policy:", premiumAmount);
        return null;
    }
    
    const gstAmount = (premiumAmount * gstRate) / 100;
    const totalAmount = premiumAmount + gstAmount + processingFee;
    
    return {
        premium: premiumAmount,
        gst: gstAmount,
        processingFee: processingFee,
        deductible: deductibleAmount,
        total: totalAmount,
        breakdown: {
            basePremium: `₹${premiumAmount.toLocaleString('en-IN')}`,
            gst: `₹${gstAmount.toLocaleString('en-IN')} (${gstRate}%)`,
            processingFee: `₹${processingFee.toLocaleString('en-IN')}`,
            deductible: deductibleAmount > 0 ? `₹${deductibleAmount.toLocaleString('en-IN')}` : 'N/A',
            finalTotal: `₹${totalAmount.toLocaleString('en-IN')}`
        }
    };
};

// Function to get policy by ID (useful for payment page)
export const getPolicyById = (policyId) => {
    const allPolicies = [
        ...policiesData.health,
        ...policiesData.life,
        ...policiesData.auto
    ];
    return allPolicies.find(policy => policy.id === policyId);
};

// Function to format currency for display
export const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
};

// Enhanced function to extract premium amount from various formats
export const extractPremiumAmount = (policy) => {
   
    if (policy.premiumAmount && typeof policy.premiumAmount === 'number' && policy.premiumAmount > 0) {
        return policy.premiumAmount;
    }
    
    if (policy.premium && typeof policy.premium === 'string') {
       
        const numericValue = policy.premium.replace(/[^\d.-]/g, '');
        const amount = parseFloat(numericValue);
        if (amount > 0) return amount;
    }
    
    if (policy.amount && Number(policy.amount) > 0) {
        return Number(policy.amount);
    }
    
    if (policy.totalAmount && Number(policy.totalAmount) > 0) {
        return Number(policy.totalAmount);
    }
    
    if (policy.price && Number(policy.price) > 0) {
        return Number(policy.price);
    }
    
    console.error("Could not extract premium amount from policy:", policy);
    return 0;
};

// Payment data structure for form submission
export const createPaymentData = (policy, userDetails) => {
    const premiumAmount = extractPremiumAmount(policy);
    const paymentBreakdown = getPaymentBreakdown({
        ...policy,
        premiumAmount: premiumAmount
    });
    
    if (!paymentBreakdown) {
        console.error("Failed to create payment breakdown");
        return null;
    }
    
    return {
        policyDetails: {
            id: policy.id,
            title: policy.title || policy.name,
            type: policy.type,
            provider: policy.provider,
            coverage: policy.coverage,
            coverageAmount: policy.coverageAmount,
            premium: policy.premium,
            premiumAmount: premiumAmount,
            deductible: policy.deductible,
            deductibleAmount: policy.deductibleAmount || 0
        },
        paymentDetails: paymentBreakdown,
        userDetails: userDetails,
        timestamp: new Date().toISOString(),
        paymentStatus: 'pending'
    };
};