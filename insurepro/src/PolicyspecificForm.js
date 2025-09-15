import React from "react";

const PolicySpecificForm = ({ type, onBack, formData = {}, onChange }) => {
  return (
    <div className="form-content">
      <div className="form-fields">
        {type === "health" && (
          <>
            <div className="form-field">
              <input 
                type="number" 
                name="height"
                placeholder="Height (cm) *" 
                value={formData.height || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <input 
                type="number" 
                name="weight"
                placeholder="Weight (kg) *" 
                value={formData.weight || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <textarea 
                name="medications"
                placeholder="Current Medications" 
                value={formData.medications || ""}
                onChange={onChange}
                rows="3"
              />
            </div>
            <div className="form-field">
              <textarea 
                name="surgeries"
                placeholder="Past Surgeries" 
                value={formData.surgeries || ""}
                onChange={onChange}
                rows="3"
              />
            </div>
            <div className="form-field full-width">
              <input 
                type="text" 
                name="disability"
                placeholder="Any Disability" 
                value={formData.disability || ""}
                onChange={onChange}
              />
            </div>
          </>
        )}

        {type === "auto" && (
          <>
            <div className="form-field">
              <select 
                name="vehicleType"
                value={formData.vehicleType || ""}
                onChange={onChange}
                required
              >
                <option value="">Vehicle Type *</option>
                <option value="personal">Personal Use</option>
                <option value="commercial">Commercial Use</option>
              </select>
            </div>
            <div className="form-field">
              <input 
                type="text" 
                name="registrationNumber"
                placeholder="Registration Number *" 
                value={formData.registrationNumber || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <input 
                type="text" 
                name="makeModel"
                placeholder="Make and Model *" 
                value={formData.makeModel || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <input 
                type="text" 
                name="variant"
                placeholder="Variant *" 
                value={formData.variant || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <select 
                name="fuel"
                value={formData.fuel || ""}
                onChange={onChange}
                required
              >
                <option value="">Fuel Type *</option>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="form-field">
              <input 
                type="number" 
                name="year"
                placeholder="Manufacturing Year *" 
                value={formData.year || ""}
                onChange={onChange}
                min="1990"
                max={new Date().getFullYear()}
                required 
              />
            </div>
            <div className="form-field">
              <input 
                type="text" 
                name="chassisNumber"
                placeholder="Chassis Number *" 
                value={formData.chassisNumber || ""}
                onChange={onChange}
                required 
              />
            </div>
            <div className="form-field">
              <select 
                name="ownershipType"
                value={formData.ownershipType || ""}
                onChange={onChange}
                required
              >
                <option value="">Ownership Type *</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
          </>
        )}

        {type === "life" && (
          <>
            <div className="form-field">
              <input 
                type="number" 
                name="age"
                placeholder="Age *" 
                value={formData.age || ""}
                onChange={onChange}
                min="18"
                max="80"
                required 
              />
            </div>
            <div className="form-field">
              <input 
                type="number" 
                name="lifeIncome"
                placeholder="Annual Income *" 
                value={formData.lifeIncome || ""}
                onChange={onChange}
                required 
              />
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
          </>
        )}
      </div>
    </div>
  );
};

export default PolicySpecificForm;