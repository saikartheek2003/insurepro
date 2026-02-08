// src/components/SubForms.js
import React from "react";

// Personal Details Form Component
export const PersonalForm = ({ formData, onChange, errors = {} }) => (
  <div className="form-content">
    <div className="form-fields">
      <div className="form-field">
        <input 
          name="fullName" 
          placeholder="Full Name *" 
          value={formData.fullName || ""} 
          onChange={onChange} 
          className={`${errors.fullName ? 'error' : ''}`}
          required 
        />
        {errors.fullName && <div className="error-message">{errors.fullName}</div>}
      </div>

      <div className="form-field">
        <input 
          type="date" 
          name="dob" 
          placeholder="Date of Birth *" 
          value={formData.dob || ""} 
          onChange={onChange} 
          className={`${errors.dob ? 'error' : ''}`}
          required 
        />
        {errors.dob && <div className="error-message">{errors.dob}</div>}
      </div>

      <div className="form-field">
        <select 
          name="gender" 
          value={formData.gender || ""} 
          onChange={onChange} 
          className={`${errors.gender ? 'error' : ''}`}
          required
        >
          <option value="">Select Gender *</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <div className="error-message">{errors.gender}</div>}
      </div>

      <div className="form-field">
        <select 
          name="maritalStatus" 
          value={formData.maritalStatus || ""} 
          onChange={onChange} 
          className={`${errors.maritalStatus ? 'error' : ''}`}
          required
        >
          <option value="">Marital Status *</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
        </select>
        {errors.maritalStatus && <div className="error-message">{errors.maritalStatus}</div>}
      </div>

      <div className="form-field">
        <input 
          name="nationality" 
          placeholder="Nationality *" 
          value={formData.nationality || ""} 
          onChange={onChange} 
          className={`${errors.nationality ? 'error' : ''}`}
          required
        />
        {errors.nationality && <div className="error-message">{errors.nationality}</div>}
      </div>

      <div className="form-field">
        <input 
          name="pincode" 
          placeholder="Pincode *" 
          value={formData.pincode || ""} 
          onChange={onChange} 
          className={`${errors.pincode ? 'error' : ''}`}
          required
        />
        {errors.pincode && <div className="error-message">{errors.pincode}</div>}
      </div>

      <div className="form-field">
        <input 
          name="mobile" 
          placeholder="Mobile Number *" 
          value={formData.mobile || ""} 
          onChange={onChange} 
          className={`${errors.mobile ? 'error' : ''}`}
          required 
        />
        {errors.mobile && <div className="error-message">{errors.mobile}</div>}
      </div>

      <div className="form-field">
        <input 
          type="email" 
          name="email" 
          placeholder="Email *" 
          value={formData.email || ""} 
          onChange={onChange} 
          className={`${errors.email ? 'error' : ''}`}
          required 
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>

      <div className="form-field full-width">
        <textarea 
          name="address" 
          placeholder="Address *" 
          value={formData.address || ""} 
          onChange={onChange} 
          className={`${errors.address ? 'error' : ''}`}
          rows="3" 
          required 
        />
        {errors.address && <div className="error-message">{errors.address}</div>}
      </div>

      <div className="form-field">
        <input 
          name="occupation" 
          placeholder="Occupation *" 
          value={formData.occupation || ""} 
          onChange={onChange} 
          className={`${errors.occupation ? 'error' : ''}`}
          required
        />
        {errors.occupation && <div className="error-message">{errors.occupation}</div>}
      </div>

      <div className="form-field">
        <input 
          type="number" 
          name="annualIncome" 
          placeholder="Annual Income *" 
          value={formData.annualIncome || ""} 
          onChange={onChange} 
          className={`${errors.annualIncome ? 'error' : ''}`}
          required
        />
        {errors.annualIncome && <div className="error-message">{errors.annualIncome}</div>}
      </div>

      <div className="form-field">
        <input 
          name="nomineeName" 
          placeholder="Nominee Name *" 
          value={formData.nomineeName || ""} 
          onChange={onChange} 
          className={`${errors.nomineeName ? 'error' : ''}`}
          required
        />
        {errors.nomineeName && <div className="error-message">{errors.nomineeName}</div>}
      </div>

      <div className="form-field">
        <input 
          name="nomineeRelation" 
          placeholder="Nominee Relation *" 
          value={formData.nomineeRelation || ""} 
          onChange={onChange} 
          className={`${errors.nomineeRelation ? 'error' : ''}`}
          required
        />
        {errors.nomineeRelation && <div className="error-message">{errors.nomineeRelation}</div>}
      </div>
    </div>
  </div>
);

// Health Insurance Specific Form
export const HealthForm = ({ formData, onChange, errors = {} }) => (
  <div className="form-content">
    <div className="form-fields">
      <div className="form-field">
        <input 
          type="number" 
          name="height" 
          placeholder="Height (cm) *" 
          value={formData.height || ""} 
          onChange={onChange} 
          className={`${errors.height ? 'error' : ''}`}
          required
        />
        {errors.height && <div className="error-message">{errors.height}</div>}
      </div>
      
      <div className="form-field">
        <input 
          type="number" 
          name="weight" 
          placeholder="Weight (kg) *" 
          value={formData.weight || ""} 
          onChange={onChange} 
          className={`${errors.weight ? 'error' : ''}`}
          required
        />
        {errors.weight && <div className="error-message">{errors.weight}</div>}
      </div>
      
      <div className="form-field">
        <input 
          name="medications" 
          placeholder="Current Medications (if any)" 
          value={formData.medications || ""} 
          onChange={onChange} 
        />
      </div>
      
      <div className="form-field">
        <input 
          name="surgeries" 
          placeholder="Past Surgeries (if any)" 
          value={formData.surgeries || ""} 
          onChange={onChange} 
        />
      </div>
      
      <div className="form-field full-width">
        <textarea 
          name="disability" 
          placeholder="Any Disability or Pre-existing Conditions (if applicable)" 
          value={formData.disability || ""} 
          onChange={onChange} 
          rows="3" 
        />
      </div>
      
      <div className="form-field full-width">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
          <input 
            type="checkbox" 
            name="smoker" 
            checked={formData.smoker || false}
            onChange={(e) => onChange({...e, target: {...e.target, name: 'smoker', value: e.target.checked}})}
            style={{ width: 'auto', margin: 0 }}
          />
          Do you smoke tobacco products?
        </label>
      </div>
      
      <div className="form-field full-width">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
          <input 
            type="checkbox" 
            name="alcoholConsumer" 
            checked={formData.alcoholConsumer || false}
            onChange={(e) => onChange({...e, target: {...e.target, name: 'alcoholConsumer', value: e.target.checked}})}
            style={{ width: 'auto', margin: 0 }}
          />
          Do you regularly consume alcohol?
        </label>
      </div>
    </div>
  </div>
);

// Auto Insurance Specific Form
export const AutoForm = ({ formData, onChange, errors = {} }) => (
  <div className="form-content">
    <div className="form-fields">
      <div className="form-field">
        <select 
          name="vehicleType" 
          value={formData.vehicleType || ""} 
          onChange={onChange} 
          className={`${errors.vehicleType ? 'error' : ''}`}
          required
        >
          <option value="">Vehicle Usage Type *</option>
          <option value="personal">Personal Use</option>
          <option value="commercial">Commercial Use</option>
        </select>
        {errors.vehicleType && <div className="error-message">{errors.vehicleType}</div>}
      </div>
      
      <div className="form-field">
        <input 
          name="registrationNumber" 
          placeholder="Registration Number *" 
          value={formData.registrationNumber || ""} 
          onChange={onChange} 
          className={`${errors.registrationNumber ? 'error' : ''}`}
          required
        />
        {errors.registrationNumber && <div className="error-message">{errors.registrationNumber}</div>}
      </div>
      
      <div className="form-field">
        <input 
          name="makeModel" 
          placeholder="Make & Model *" 
          value={formData.makeModel || ""} 
          onChange={onChange} 
          className={`${errors.makeModel ? 'error' : ''}`}
          required
        />
        {errors.makeModel && <div className="error-message">{errors.makeModel}</div>}
      </div>
      
      <div className="form-field">
        <input 
          name="variant" 
          placeholder="Variant *" 
          value={formData.variant || ""} 
          onChange={onChange} 
          className={`${errors.variant ? 'error' : ''}`}
          required
        />
        {errors.variant && <div className="error-message">{errors.variant}</div>}
      </div>
      
      <div className="form-field">
        <select 
          name="fuel" 
          value={formData.fuel || ""} 
          onChange={onChange} 
          className={`${errors.fuel ? 'error' : ''}`}
          required
        >
          <option value="">Fuel Type *</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="cng">CNG</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
        {errors.fuel && <div className="error-message">{errors.fuel}</div>}
      </div>
      
      <div className="form-field">
        <input 
          type="number" 
          name="year" 
          placeholder="Manufacturing Year *" 
          value={formData.year || ""} 
          onChange={onChange} 
          className={`${errors.year ? 'error' : ''}`}
          min="1990"
          max={new Date().getFullYear()}
          required
        />
        {errors.year && <div className="error-message">{errors.year}</div>}
      </div>
      
      <div className="form-field">
        <input 
          name="chassisNumber" 
          placeholder="Chassis Number *" 
          value={formData.chassisNumber || ""} 
          onChange={onChange} 
          className={`${errors.chassisNumber ? 'error' : ''}`}
          required
        />
        {errors.chassisNumber && <div className="error-message">{errors.chassisNumber}</div>}
      </div>
      
      <div className="form-field">
        <select 
          name="ownershipType" 
          value={formData.ownershipType || ""} 
          onChange={onChange} 
          className={`${errors.ownershipType ? 'error' : ''}`}
          required
        >
          <option value="">Ownership Type *</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="partnership">Partnership</option>
        </select>
        {errors.ownershipType && <div className="error-message">{errors.ownershipType}</div>}
      </div>

      <div className="form-field">
        <input 
          type="number" 
          name="engineCapacity" 
          placeholder="Engine Capacity (CC)" 
          value={formData.engineCapacity || ""} 
          onChange={onChange} 
        />
      </div>

      <div className="form-field full-width">
        <select 
          name="previousInsurance" 
          value={formData.previousInsurance || ""} 
          onChange={onChange} 
        >
          <option value="">Previous Insurance Status</option>
          <option value="expired">Expired</option>
          <option value="active">Currently Active</option>
          <option value="never">Never Insured</option>
        </select>
      </div>
    </div>
  </div>
);

// Life Insurance Specific Form
export const LifeForm = ({ formData, onChange, errors = {} }) => (
  <div className="form-content">
    <div className="form-fields">
      <div className="form-field">
        <input 
          type="number" 
          name="age" 
          placeholder="Age *" 
          value={formData.age || ""} 
          onChange={onChange} 
          className={`${errors.age ? 'error' : ''}`}
          min="18"
          max="80"
          required
        />
        {errors.age && <div className="error-message">{errors.age}</div>}
      </div>
      
      <div className="form-field">
        <select 
          name="lifeOccupation" 
          value={formData.lifeOccupation || ""} 
          onChange={onChange} 
        >
          <option value="">Occupation Category</option>
          <option value="professional">Professional</option>
          <option value="business">Business</option>
          <option value="service">Service</option>
          <option value="selfEmployed">Self Employed</option>
          <option value="housewife">Housewife</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      
      <div className="form-field">
        <input 
          type="number" 
          name="lifeIncome" 
          placeholder="Annual Income *" 
          value={formData.lifeIncome || ""} 
          onChange={onChange} 
          className={`${errors.lifeIncome ? 'error' : ''}`}
          required
        />
        {errors.lifeIncome && <div className="error-message">{errors.lifeIncome}</div>}
      </div>

      <div className="form-field">
        <input 
          type="number" 
          name="coverageAmount" 
          placeholder="Desired Coverage Amount" 
          value={formData.coverageAmount || ""} 
          onChange={onChange} 
        />
      </div>

      <div className="form-field">
        <select 
          name="policyTerm" 
          value={formData.policyTerm || ""} 
          onChange={onChange} 
        >
          <option value="">Policy Term (Years)</option>
          <option value="10">10 Years</option>
          <option value="15">15 Years</option>
          <option value="20">20 Years</option>
          <option value="25">25 Years</option>
          <option value="30">30 Years</option>
        </select>
      </div>

      <div className="form-field">
        <select 
          name="premiumPaymentTerm" 
          value={formData.premiumPaymentTerm || ""} 
          onChange={onChange} 
        >
          <option value="">Premium Payment Term</option>
          <option value="5">5 Years</option>
          <option value="10">10 Years</option>
          <option value="15">15 Years</option>
          <option value="single">Single Premium</option>
          <option value="regular">Regular Premium</option>
        </select>
      </div>

      <div className="form-field full-width">
        <textarea 
          name="medicalHistory" 
          placeholder="Medical History (Any major illnesses, surgeries, or ongoing treatments)" 
          value={formData.medicalHistory || ""} 
          onChange={onChange} 
          rows="3" 
        />
      </div>

      <div className="form-field full-width">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
          <input 
            type="checkbox" 
            name="medicalTestConsent" 
            checked={formData.medicalTestConsent || false}
            onChange={(e) => onChange({...e, target: {...e.target, name: 'medicalTestConsent', value: e.target.checked}})}
            style={{ width: 'auto', margin: 0 }}
          />
          I consent to undergo medical tests if required by the insurance company
        </label>
      </div>
    </div>
  </div>
);