  import React, { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import axios from "axios";
  import { PersonalForm, HealthForm, AutoForm, LifeForm } from "./SubForms";
  import PolicySpecificForm from "./PolicyspecificForm";
  import { policiesData } from "./PoliciesData"; 
  import "./form.css";

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  const PolicyForm = ({ preSelectedPolicyType = null, preSelectedPolicy = null }) => {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(preSelectedPolicyType ? 1 : 0);
    const [selectedPolicyType, setSelectedPolicyType] = useState(preSelectedPolicyType ? preSelectedPolicyType.toLowerCase() : '');
    const [selectedPolicy, setSelectedPolicy] = useState(preSelectedPolicy || null);
    const [availablePolicies, setAvailablePolicies] = useState([]);
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [hasAutofilledData, setHasAutofilledData] = useState(false);

    const [formData, setFormData] = useState({
      fullName: "",
      dob: "",
      gender: "",
      maritalStatus: "",
      nationality: "",
      address: "",
      pincode: "",
      mobile: "",
      email: "",
      occupation: "",
      annualIncome: "",
      nomineeName: "",
      nomineeRelation: "",
      policyType: preSelectedPolicyType ? preSelectedPolicyType.toLowerCase() : "",
     
      selectedPolicyId: preSelectedPolicy?.id || "",
      policyTitle: preSelectedPolicy?.title || "",
      provider: preSelectedPolicy?.provider || "",
      premium: preSelectedPolicy?.premium || "",
      premiumAmount: preSelectedPolicy?.premiumAmount || 0,
      coverage: preSelectedPolicy?.coverage || "",
      coverageAmount: preSelectedPolicy?.coverageAmount || 0,
      deductible: preSelectedPolicy?.deductible || "",
      deductibleAmount: preSelectedPolicy?.deductibleAmount || 0,
      // Health fields
      height: "",
      weight: "",
      medications: "",
      surgeries: "",
      disability: "",
      smoker: false,
      alcoholConsumer: false,
      // Auto fields
      vehicleType: "",
      registrationNumber: "",
      makeModel: "",
      variant: "",
      fuel: "",
      year: "",
      chassisNumber: "",
      ownershipType: "",
      engineCapacity: "",
      previousInsurance: "",
      // Life fields
      age: "",
      lifeIncome: "",
      lifeOccupation: "",
      policyTerm: "",
      premiumPaymentTerm: "",
      medicalHistory: "",
      medicalTestConsent: false
    });

    
    useEffect(() => {
      if (selectedPolicyType && policiesData[selectedPolicyType]) {
        setAvailablePolicies(policiesData[selectedPolicyType]);
        
        // If no policy pre-selected, set default to first available
        if (!selectedPolicy && policiesData[selectedPolicyType].length > 0) {
          const defaultPolicy = policiesData[selectedPolicyType][0];
          setSelectedPolicy(defaultPolicy);
          updateFormDataWithPolicy(defaultPolicy);
        }
      }
    }, [selectedPolicyType]);

   
    const updateFormDataWithPolicy = (policy) => {
      if (!policy) return;
      
      setFormData(prev => ({
        ...prev,
        selectedPolicyId: policy.id,
        policyTitle: policy.title,
        provider: policy.provider,
        premium: policy.premium,
        premiumAmount: policy.premiumAmount,
        coverage: policy.coverage,
        coverageAmount: policy.coverageAmount,
        deductible: policy.deductible || "",
        deductibleAmount: policy.deductibleAmount || 0,
      }));
      
      console.log("Updated form data with policy:", {
        id: policy.id,
        title: policy.title,
        premium: policy.premium,
        premiumAmount: policy.premiumAmount
      });
    };

    // Load user profile for autofill
    const loadUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/user-profile`, {
          withCredentials: true
        });

        if (response.data.profile) {
          const profile = response.data.profile;
          
          // Map profile data to form data (preserve policy-specific data)
          const autoFilledData = {
            fullName: profile.full_name || "",
            dob: profile.dob || "",
            gender: profile.gender || "",
            maritalStatus: profile.marital_status || "",
            nationality: profile.nationality || "",
            address: profile.address || "",
            pincode: profile.pincode || "",
            mobile: profile.mobile || "",
            occupation: profile.occupation || "",
            annualIncome: profile.annual_income || "",
            nomineeName: profile.nominee_name || "",
            nomineeRelation: profile.nominee_relation || "",
            height: profile.height || "",
            weight: profile.weight || "",
            medications: profile.medications || "",
            surgeries: profile.surgeries || "",
            disability: profile.disability || "",
            smoker: profile.smoker || false,
            alcoholConsumer: profile.alcohol_consumer || false,
            age: profile.life_age || "",
            lifeIncome: profile.life_income || "",
            lifeOccupation: profile.life_occupation || "",
            policyTerm: profile.policy_term || "",
            premiumPaymentTerm: profile.premium_payment_term || "",
            medicalHistory: profile.medical_history || "",
            medicalTestConsent: profile.medical_test_consent || false,
            // FIXED: Preserve policy-specific data
            policyType: selectedPolicyType,
            selectedPolicyId: formData.selectedPolicyId,
            policyTitle: formData.policyTitle,
            provider: formData.provider,
            premium: formData.premium,
            premiumAmount: formData.premiumAmount,
            coverage: formData.coverage,
            coverageAmount: formData.coverageAmount,
            deductible: formData.deductible,
            deductibleAmount: formData.deductibleAmount,
          };

          // Handle auto details (stored as JSON)
          if (profile.auto_details) {
            const autoDetails = typeof profile.auto_details === 'string' 
              ? JSON.parse(profile.auto_details) 
              : profile.auto_details;
            
            autoFilledData.vehicleType = autoDetails.vehicleType || "";
            autoFilledData.registrationNumber = autoDetails.registrationNumber || "";
            autoFilledData.makeModel = autoDetails.makeModel || "";
            autoFilledData.variant = autoDetails.variant || "";
            autoFilledData.fuel = autoDetails.fuel || "";
            autoFilledData.year = autoDetails.year || "";
            autoFilledData.chassisNumber = autoDetails.chassisNumber || "";
            autoFilledData.ownershipType = autoDetails.ownershipType || "";
            autoFilledData.engineCapacity = autoDetails.engineCapacity || "";
            autoFilledData.previousInsurance = autoDetails.previousInsurance || "";
          }

          setFormData(prev => ({ ...prev, ...autoFilledData }));
          setHasAutofilledData(true);
          showToastMessage("Profile data loaded successfully!", "success");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
       
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Save user profile
    const saveUserProfile = async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/user-profile`, formData, {
          withCredentials: true
        });
        console.log("✅ User profile saved");
      } catch (err) {
        console.error("❌ Error saving profile:", err);
        
      }
    };

    useEffect(() => {
      if (preSelectedPolicyType) {
        const policyLower = preSelectedPolicyType.toLowerCase();
        setSelectedPolicyType(policyLower);
        setFormData(prev => ({ ...prev, policyType: policyLower }));
        setCurrentStep(1);
        showToastMessage(`${preSelectedPolicyType} insurance pre-selected!`, 'success');
      }
      
      if (preSelectedPolicy) {
        setSelectedPolicy(preSelectedPolicy);
        updateFormDataWithPolicy(preSelectedPolicy);
      }
      
      
      loadUserProfile();
    }, [preSelectedPolicyType, preSelectedPolicy]);

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === 'checkbox' ? checked : value;
      setFormData(prev => ({ ...prev, [name]: newValue }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    
    const handlePolicyChange = (e) => {
      const policyId = e.target.value;
      const policy = availablePolicies.find(p => p.id === policyId);
      if (policy) {
        setSelectedPolicy(policy);
        updateFormDataWithPolicy(policy);
        showToastMessage(`Selected: ${policy.title}`, 'success');
      }
    };

    const showToastMessage = (message, type = 'success') => {
      setShowToast({ show: true, message, type });
      setTimeout(() => setShowToast({ show: false, message: '', type: '' }), 3000);
    };

    const validateForm = () => {
      const newErrors = {};
      const { fullName, dob, gender, maritalStatus, nationality, address, pincode, mobile, email, occupation, annualIncome, nomineeName, nomineeRelation } = formData;

      if (!fullName?.trim()) newErrors.fullName = "Full name is required";
      if (!dob) newErrors.dob = "Date of birth is required";
      if (!gender) newErrors.gender = "Gender is required";
      if (!maritalStatus) newErrors.maritalStatus = "Marital status is required";
      if (!nationality?.trim()) newErrors.nationality = "Nationality is required";
      if (!address?.trim()) newErrors.address = "Address is required";
      if (!pincode?.trim()) newErrors.pincode = "Pincode is required";
      if (!mobile?.trim()) newErrors.mobile = "Mobile number is required";
      if (!email?.trim()) newErrors.email = "Email is required";
      if (!occupation?.trim()) newErrors.occupation = "Occupation is required";
      if (!annualIncome) newErrors.annualIncome = "Annual income is required";
      if (!nomineeName?.trim()) newErrors.nomineeName = "Nominee name is required";
      if (!nomineeRelation?.trim()) newErrors.nomineeRelation = "Nominee relation is required";

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) newErrors.email = "Invalid Email Format!";
      if (mobile && !/^[6-9]\d{9}$/.test(mobile)) newErrors.mobile = "Invalid Mobile Number! Must be 10 digits starting with 6-9.";
      if (pincode && !/^\d{6}$/.test(pincode)) newErrors.pincode = "Invalid Pincode! Must be 6 digits.";
      if (annualIncome && (isNaN(annualIncome) || parseFloat(annualIncome) <= 0)) newErrors.annualIncome = "Annual Income must be positive.";

      if (dob) {
        const today = new Date();
        const birthDate = new Date(dob);
        if (birthDate >= today) newErrors.dob = "Date of Birth must be in the past.";
        else {
          const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18 || age > 80) newErrors.dob = "Age must be between 18 and 80 years.";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const validatePolicySpecificForm = () => {
      const newErrors = {};
      if (selectedPolicyType === 'health') {
        if (!formData.height) newErrors.height = "Height is required";
        if (!formData.weight) newErrors.weight = "Weight is required";
      } else if (selectedPolicyType === 'auto') {
        if (!formData.vehicleType) newErrors.vehicleType = "Vehicle type is required";
        if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = "Registration number is required";
        if (!formData.makeModel?.trim()) newErrors.makeModel = "Make and model is required";
        if (!formData.variant?.trim()) newErrors.variant = "Variant is required";
        if (!formData.fuel) newErrors.fuel = "Fuel type is required";
        if (!formData.year) newErrors.year = "Manufacturing year is required";
        if (!formData.chassisNumber?.trim()) newErrors.chassisNumber = "Chassis number is required";
        if (!formData.ownershipType) newErrors.ownershipType = "Ownership type is required";
      } else if (selectedPolicyType === 'life') {
        if (!formData.age) newErrors.age = "Age is required";
        if (!formData.lifeIncome) newErrors.lifeIncome = "Income is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handlePolicyTypeSelect = (type) => {
      setSelectedPolicyType(type);
      setFormData(prev => ({ ...prev, policyType: type }));
      showToastMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} insurance selected!`, 'success');
    };

    const nextStep = () => {
      if (currentStep === 0 && !selectedPolicyType) {
        showToastMessage('Please select a policy type first!', 'error');
        return;
      }
      if (currentStep === 1 && !validateForm()) {
        showToastMessage('Please fix all errors before proceeding', 'error');
        return;
      }
      
      // Save profile when moving from personal details step
      if (currentStep === 1) {
        saveUserProfile();
      }
      
      if (currentStep < 2) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
      if (currentStep > 0) {
        if (preSelectedPolicyType && currentStep === 1) return;
        setCurrentStep(currentStep - 1);
      }
    };

   // In policyForm.js

const saveApplication = async () => {
  
  if (!validatePolicySpecificForm()) {
    showToastMessage("Please fill all required policy details", "error");
    return false;
  }
  if (!formData.premiumAmount || formData.premiumAmount <= 0) {
    showToastMessage("Please select a valid policy with premium amount", "error");
    return false;
  }

  // Save profile in the background
  await saveUserProfile();

  //
  const payload = {
    ...formData, 
    
    // 
    policyId: formData.selectedPolicyId,
    policyName: formData.policyTitle,

    // 
    premium: formData.premiumAmount,
    coverageAmount: formData.coverageAmount,
  };
  
  try {
    await axios.post(
      `${BACKEND_URL}/api/purchase-policy`,
      payload, 
      { withCredentials: true }
    );
    showToastMessage("Application saved successfully!", "success");
    return true;

  } catch (err) {
    console.error("Axios Error:", err.message);
    if (err.response) {
      console.error("Response Status:", err.response.status);
      console.error("Response Data:", err.response.data);
    }
    const errorMessage = err.response?.data?.message || "Failed to save application. Please try again!";
    showToastMessage(errorMessage, "error");
    return false;
  }
};
    const handleSubmit = async () => {
      const saved = await saveApplication();
      if (saved) showToastMessage("Application submitted!", "success");
    };

    // 
    const handleProceedToPayment = async () => {
      const saved = await saveApplication();
      if (saved) {
        console.log("Navigating to payment with data:", {
          formData: formData,
          selectedPolicy: selectedPolicy,
          premiumAmount: formData.premiumAmount
        });

        navigate("/payment", { 
          state: { 
            policyDetails: formData,
            selectedPolicy: selectedPolicy,
            userDetails: {
              fullName: formData.fullName,
              email: formData.email,
              mobile: formData.mobile,
              address: formData.address
            }
          } 
        });
      }
    };

    
    const clearAutofilledData = () => {
      const policyPreservation = {
        policyType: selectedPolicyType,
        selectedPolicyId: formData.selectedPolicyId,
        policyTitle: formData.policyTitle,
        provider: formData.provider,
        premium: formData.premium,
        premiumAmount: formData.premiumAmount,
        coverage: formData.coverage,
        coverageAmount: formData.coverageAmount,
        deductible: formData.deductible,
        deductibleAmount: formData.deductibleAmount,
      };

      setFormData({
        fullName: "",
        dob: "",
        gender: "",
        maritalStatus: "",
        nationality: "",
        address: "",
        pincode: "",
        mobile: "",
        email: "",
        occupation: "",
        annualIncome: "",
        nomineeName: "",
        nomineeRelation: "",
        ...policyPreservation, 
        height: "",
        weight: "",
        medications: "",
        surgeries: "",
        disability: "",
        smoker: false,
        alcoholConsumer: false,
        vehicleType: "",
        registrationNumber: "",
        makeModel: "",
        variant: "",
        fuel: "",
        year: "",
        chassisNumber: "",
        ownershipType: "",
        engineCapacity: "",
        previousInsurance: "",
        age: "",
        lifeIncome: "",
        lifeOccupation: "",
        policyTerm: "",
        premiumPaymentTerm: "",
        medicalHistory: "",
        medicalTestConsent: false
      });
      setHasAutofilledData(false);
      showToastMessage("Personal data cleared! Policy selection preserved.", "success");
    };

    const renderPolicySpecificForm = () => {
      switch (selectedPolicyType.toLowerCase()) {
        case 'health':
          return <HealthForm formData={formData} onChange={handleChange} errors={errors} />;
        case 'auto':
          return <AutoForm formData={formData} onChange={handleChange} errors={errors} />;
        case 'life':
          return <LifeForm formData={formData} onChange={handleChange} errors={errors} />;
        default:
          return <PolicySpecificForm type={selectedPolicyType} formData={formData} onChange={handleChange} errors={errors} />;
      }
    };

    return (
      <div className="form-container">
        {showToast.show && (
          <div className={`toast ${showToast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {showToast.message}
          </div>
        )}

        {/* Autofill Controls */}
        {(currentStep === 1 || currentStep === 2) && (
          <div className="autofill-controls" style={{marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px'}}>
            {isLoadingProfile && <p>Loading your saved data...</p>}
            {hasAutofilledData && (
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                <span style={{color: '#28a745'}}>✓ Data loaded from your profile</span>
                <button 
                  type="button" 
                  onClick={clearAutofilledData}
                  style={{padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                >
                  Clear Personal Data
                </button>
                <button 
                  type="button" 
                  onClick={loadUserProfile}
                  style={{padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                >
                  Reload Profile
                </button>
              </div>
            )}
          </div>
        )}

        <div className="step-indicator">
          {!preSelectedPolicyType && <div className={`step ${currentStep >= 0 ? 'active' : ''}`}>1. Policy Type</div>}
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            {preSelectedPolicyType ? '1. Personal Details' : '2. Personal Details'}
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            {preSelectedPolicyType ? '2. Additional Details' : '3. Additional Details'}
          </div>
        </div>

        {/* FIXED: Policy Selection Step */}
        {currentStep === 0 && !preSelectedPolicyType && (
          <div className="policy-selection">
            <button onClick={() => handlePolicyTypeSelect('health')}>Health Insurance</button>
            <button onClick={() => handlePolicyTypeSelect('auto')}>Auto Insurance</button>
            <button onClick={() => handlePolicyTypeSelect('life')}>Life Insurance</button>
          </div>
        )}

        
        {currentStep === 1 && availablePolicies.length > 0 && (
          <div className="policy-selection-dropdown" style={{marginBottom: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #0d6efd'}}>
            <label htmlFor="policySelect" style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#0d6efd'}}>
              Select Policy:
            </label>
            <select 
              id="policySelect"
              value={selectedPolicy?.id || ''} 
              onChange={handlePolicyChange}
              style={{width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc'}}
            >
              {availablePolicies.map(policy => (
                <option key={policy.id} value={policy.id}>
                  {policy.title} - {policy.premium} (Coverage: {policy.coverage})
                </option>
              ))}
            </select>
            {selectedPolicy && (
              <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                <strong>Selected:</strong> {selectedPolicy.title} | 
                <strong> Provider:</strong> {selectedPolicy.provider} | 
                <strong> Premium:</strong> {selectedPolicy.premium}
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && <PersonalForm formData={formData} onChange={handleChange} errors={errors} />}
        {currentStep === 2 && renderPolicySpecificForm()}

        <div className="form-buttons">
          {currentStep > 0 && <button onClick={prevStep}>Back</button>}
          {currentStep < 2 && <button onClick={nextStep}>Next</button>}
          {currentStep === 2 && (
            <>
              <button className="btn btn-success" onClick={handleSubmit}>Submit Application</button>
              <button 
                className="btn btn-primary" 
                onClick={handleProceedToPayment}
                disabled={!formData.premiumAmount || formData.premiumAmount <= 0}
                title={!formData.premiumAmount ? "Please select a policy first" : "Proceed to payment"}
              >
                Proceed to Payment ({formData.premium || "Select Policy"})
              </button>
            </>
          )}
        </div>

       
        {process.env.NODE_ENV === 'development' && (
          <div style={{marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', fontSize: '12px'}}>
            <strong>Debug Info:</strong>
            <div>Selected Policy ID: {formData.selectedPolicyId || 'None'}</div>
            <div>Premium Amount: {formData.premiumAmount || 'Not set'}</div>
            <div>Policy Type: {selectedPolicyType || 'Not selected'}</div>
            <div>Available Policies: {availablePolicies.length}</div>
          </div>
        )}
      </div>
    );
  };

  export default PolicyForm;