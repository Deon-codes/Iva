"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function DocumentsPage() {
  const { documents, uploadDocument } = useApp();
  const [docType, setDocType] = useState("Income Certificate (FY 2026-27)");
  const [expiryDate, setExpiryDate] = useState("2027-03-31");
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setIsUploading(true);

    setTimeout(() => {
      uploadDocument(docType, expiryDate);
      setIsUploading(false);
      setDocType("Income Certificate (FY 2026-27)");
    }, 1200);
  };

  return (
    <div className="flex-grow flex flex-col gap-6 font-body">
      
      {/* Editorial Header */}
      <div className="border-b border-ink-100 pb-4 mb-2 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink-950">Verification Documents</h1>
          <p className="text-sm text-ink-500 max-w-xl mt-1">
            Browse certificates synced to your profile. The agent uses these to verify eligibility limits and auto-fill submissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Documents List (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {documents.map((doc) => {
            const isExpiring = doc.expiryDate !== "Never" && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            return (
              <div 
                key={doc.id}
                className={`bg-paper-50 border rounded-2xl p-6 shadow-xs relative flex flex-col justify-between transition-all duration-300 border-ink-200 hover:border-amber-400`}
              >
                <div>
                  {/* Status header & Expiry warning */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider font-mono">
                      Official Cert Type
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isExpiring 
                        ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {isExpiring ? "Expiring Soon" : doc.status}
                    </span>
                  </div>

                  {/* Document Title */}
                  <h3 className="font-display font-bold text-xl text-ink-950">
                    {doc.type}
                  </h3>

                  {/* Expiry alerts */}
                  {isExpiring && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-semibold font-body">
                      ⚠️ {doc.alert}
                    </div>
                  )}

                  {!isExpiring && doc.alert && (
                    <p className="text-xs text-ink-500 mt-2 font-body font-medium">
                      ✓ {doc.alert}
                    </p>
                  )}

                  {/* Validity Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-body border-t border-ink-100 pt-3">
                    <div>
                      <span className="text-ink-400 font-semibold block">Issued On</span>
                      <span className="text-ink-800 font-bold">
                        {doc.issueDate === "Never" ? "N/A" : new Date(doc.issueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-400 font-semibold block">Expires On</span>
                      <span className="text-ink-800 font-bold">
                        {doc.expiryDate === "Never" ? "Never (Permanent)" : new Date(doc.expiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Used by active applications list */}
                <div className="mt-4 pt-3 border-t border-ink-100">
                  <span className="text-[10px] uppercase font-bold text-ink-400 block font-body tracking-wider">
                    Linked Applications
                  </span>
                  
                  <div className="mt-1 flex flex-wrap gap-1">
                    {doc.applications.length === 0 ? (
                      <span className="text-xs text-ink-400 font-body">Not currently linked in active drafts.</span>
                    ) : (
                      doc.applications.map((app, idx) => (
                        <span key={idx} className="text-xs bg-paper-100 border border-ink-150 rounded-md px-2.5 py-1 text-ink-700 font-semibold font-body">
                          📁 {app}
                        </span>
                      ))
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Right Column: Upload Document Module (1/3 width) */}
        <div className="bg-paper-50 border border-ink-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg text-ink-950 mb-2">Sync Document</h3>
          <p className="text-xs text-ink-500 font-body mb-4">
            Upload new certificates to update your agent workspace for scheme scanning.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 font-body">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
              >
                <option value="Income Certificate (FY 2026-27)">Income Certificate (FY 2026-27)</option>
                <option value="Domicile Certificate Maharashtra">Domicile Certificate Maharashtra</option>
                <option value="Class 12 Passing Certificate">Class 12 Passing Certificate</option>
                <option value="AICTE Course Admission Certificate">AICTE Course Admission Certificate</option>
                <option value="Disability Certificate">Disability Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 font-body">Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
              />
            </div>

            <div className="bg-paper-100 border border-ink-150 p-3 rounded-lg text-[10px] text-ink-500 font-body leading-relaxed">
              💡 Document parsing uses AI OCR scan to extract issue identifiers and digital signatures automatically.
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-ink-300 py-2.5 rounded-lg transition-colors cursor-pointer flex justify-center items-center font-body shadow-sm"
            >
              {isUploading ? "Scanning Document OCR..." : "Scan & Add Document"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
