// src/styles/PolicyStyles.js
import React from 'react';

const PolicyStyles = () => {
    const css = `
    /* Policies Page Styles */
    .policies-page { 
      padding: 3rem 0 5rem 0; 
      transition: opacity 0.3s ease-in-out;
    }
    .policies-page.details-visible {
      opacity: 0;
      pointer-events: none;
    }
    .policies-header { 
        text-align: center; 
        margin-bottom: 3rem; 
    }
    .policies-title { 
        font-size: 2.25rem; 
        font-weight: 700; 
        color: #111827; 
    }
    .policy-category { 
        margin-bottom: 3rem; 
    }
    .category-title { 
        font-size: 1.75rem; 
        font-weight: 600; 
        color: #1f2937; 
        margin-bottom: 1.5rem; 
        border-bottom: 2px solid #e5e7eb; 
        padding-bottom: 0.5rem; 
    }
    
    .policy-grid { 
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      gap: 1.5rem;
      padding-bottom: 1.5rem;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .policy-grid::-webkit-scrollbar {
      display: none;
    }

    /* Policy Card Styles */
    .policy-card {
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s, box-shadow 0.3s;
      flex: 0 0 300px;
      width: 300px;
    }
    .policy-card:hover { 
        transform: translateY(-0.5rem); 
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); 
    }
    .policy-card-content { 
        padding: 1.5rem; 
        flex-grow: 1; 
    }
    .policy-card-title { 
        font-size: 1.25rem; 
        font-weight: 600; 
        color: #111827; 
        margin-bottom: 0.5rem; 
    }
    .policy-card-provider { 
        color: #6b7280; 
        margin-bottom: 1rem; 
    }
    .policy-card-details { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
    }
    .policy-card-coverage { 
        font-size: 1rem; 
        font-weight: 500; 
    }
    .policy-card-premium { 
        font-size: 1.25rem; 
        font-weight: 700; 
        color: #3b82f6; 
    }
    .policy-card-footer { 
        background-color: #f9fafb; 
        padding: 1rem 1.5rem; 
        text-align: center; 
    }
    .policy-card-cta {
        background-color: #3b82f6;
        color: white;
        font-weight: 600;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        text-decoration: none;
        display: block;
        transition: background-color 0.3s;
        cursor: pointer;
        border: none;
        width: 100%;
        font-size: 1rem;
    }
    .policy-card-cta:hover { 
        background-color: #2563eb; 
    }

    /* Navigation Styles */
    .back-to-home {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
        color: #4b5563;
        cursor: pointer;
        font-weight: 500;
        transition: color 0.3s;
    }
    .back-to-home:hover { 
        color: #1f2937; 
    }
    .back-to-home svg { 
        width: 1.25rem; 
        height: 1.25rem; 
    }

    /* Policy Detail Full-Screen View Styles */
    @keyframes expand-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes shrink-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }

    .policy-detail-view {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(249, 250, 251, 0.9);
      z-index: 100;
      display: flex;
      flex-direction: column;
      animation: expand-in 0.4s ease-out forwards;
      cursor: pointer;
    }
    .policy-detail-view.closing {
      animation: shrink-out 0.4s ease-out forwards;
    }

    .policy-detail-content {
      background-color: white;
      width: 100%;
      max-width: 800px;
      margin: auto;
      height: 100vh;
      max-height: 90vh;
      border-radius: 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      cursor: default;
    }
    .policy-detail-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .policy-detail-title { 
        font-size: 1.5rem; 
        font-weight: 700; 
        color: #111827; 
    }
    .close-btn { 
        background: none; 
        border: none; 
        font-size: 1.5rem; 
        cursor: pointer; 
        color: #6b7280; 
    }
    .policy-detail-body { 
        padding: 1.5rem; 
        flex-grow: 1; 
    }
    .detail-section { 
        margin-bottom: 1.5rem; 
    }
    .detail-label { 
        font-size: 0.875rem; 
        color: #6b7280; 
        text-transform: uppercase; 
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    .detail-value { 
        font-size: 1.125rem; 
        color: #1f2937; 
        margin-bottom: 0.5rem;
    }
    .detail-list { 
        list-style-type: disc; 
        padding-left: 1.5rem; 
    }
    .detail-list li { 
        margin-bottom: 0.5rem; 
    }
    .policy-detail-footer {
      padding: 1.5rem;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .buy-now-btn {
      background-color: #16a34a;
      color: white;
      font-weight: 700;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      border: none;
      font-size: 1.125rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .buy-now-btn:hover { 
        background-color: #15803d; 
    }

    /* Buy Form Modal Styles */
    .buy-form-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(249, 250, 251, 0.9);
        z-index: 101;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: expand-in 0.4s ease-out forwards;
    }
    .buy-form-content {
        background-color: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        width: 90%;
        max-width: 600px;
        overflow-y: auto;
        max-height: 90vh;
    }
    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    .form-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
    }
    .form-close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
    }
    .form-group {
        margin-bottom: 1.5rem;
    }
    .form-label {
        display: block;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    .form-input, .form-select, .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        box-sizing: border-box;
        margin-bottom: 0.5rem;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .form-textarea {
        resize: vertical;
        min-height: 80px;
    }
    .form-submit-btn {
        background-color: #16a34a;
        color: white;
        font-weight: 700;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        width: 100%;
        font-size: 1.125rem;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .form-submit-btn:hover {
        background-color: #15803d;
    }
    .form-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Loading Spinner */
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Container */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }
    `;
    
    return <style>{css}</style>;
};

export default PolicyStyles;