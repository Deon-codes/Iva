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

  const getStatusColor = (doc) => {
    if (doc.expiryDate !== "Never" && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", label: "Expiring Soon" };
    }
    if (doc.status === "Verified") {
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Verified" };
    }
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: doc.status };
  };

  const isExpiring = (doc) => doc.expiryDate !== "Never" && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex-grow flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-[#C8E6C9] pb-5 mb-1">
        <h1
          className="font-bold text-3xl text-[#0A270D] mb-1"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Verification Documents
        </h1>
        <p
          className="text-sm text-[#2E7D32] max-w-xl"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Browse certificates synced to your profile. The agent uses these to verify eligibility limits and auto-fill submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Documents List */}
        <div className="lg:col-span-2 space-y-4">
          {documents.length === 0 ? (
            <div className="bg-white border border-[#C8E6C9] rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p
                className="text-[#2E7D32] font-semibold mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                No documents yet
              </p>
              <p
                className="text-sm text-[#66BB6A]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Upload your first certificate to get started.
              </p>
            </div>
          ) : (
            documents.map((doc) => {
              const status = getStatusColor(doc);
              const expiring = isExpiring(doc);

              return (
                <div
                  key={doc.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm relative transition-all duration-200 hover:shadow-md ${
                    expiring ? "border-red-200" : "border-[#C8E6C9] hover:border-[#66BB6A]"
                  }`}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-bold text-[#81C784] uppercase tracking-wider"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Official Cert Type
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${status.bg} ${status.text} ${status.border} border`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Document Title */}
                  <h3
                    className="font-bold text-lg text-[#0A270D] mb-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {doc.type}
                  </h3>

                  {/* Expiry Alert */}
                  {expiring && doc.alert && (
                    <div
                      className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold mb-3"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      ⚠️ {doc.alert}
                    </div>
                  )}

                  {/* Verification Note */}
                  {!expiring && doc.alert && (
                    <p
                      className="text-xs text-[#2E7D32] mb-3 font-medium"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      ✓ {doc.alert}
                    </p>
                  )}

                  {/* Validity Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs border-t border-[#E8F5E9] pt-3 mb-3">
                    <div>
                      <span
                        className="text-[#81C784] font-bold block mb-0.5"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Issued On
                      </span>
                      <span
                        className="text-[#0A270D] font-semibold"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {doc.issueDate === "Never"
                          ? "N/A"
                          : new Date(doc.issueDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </span>
                    </div>
                    <div>
                      <span
                        className="text-[#81C784] font-bold block mb-0.5"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Expires On
                      </span>
                      <span
                        className="text-[#0A270D] font-semibold"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {doc.expiryDate === "Never"
                          ? "Never (Permanent)"
                          : new Date(doc.expiryDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </span>
                    </div>
                  </div>

                  {/* Linked Applications */}
                  <div className="pt-3 border-t border-[#E8F5E9]">
                    <span
                      className="text-[10px] uppercase font-bold text-[#81C784] block mb-2 tracking-wider"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Linked Applications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.applications.length === 0 ? (
                        <span
                          className="text-xs text-[#A5D6A7]"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          Not currently linked
                        </span>
                      ) : (
                        doc.applications.map((app, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-2.5 py-1 text-[#2E7D32] font-semibold"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            📁 {app}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Upload Form */}
        <div className="bg-white border border-[#C8E6C9] rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
          <h3
            className="font-bold text-lg text-[#0A270D] mb-1"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Sync Document
          </h3>
          <p
            className="text-xs text-[#2E7D32] mb-5"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Upload new certificates to update your agent workspace for scheme scanning.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold text-[#1B5E20] mb-1.5"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="block w-full px-3 py-2.5 border border-[#C8E6C9] rounded-xl text-[#0A270D] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#66BB6A] focus:border-[#66BB6A] transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <option value="Income Certificate (FY 2026-27)">Income Certificate (FY 2026-27)</option>
                <option value="Domicile Certificate Maharashtra">Domicile Certificate Maharashtra</option>
                <option value="Class 12 Passing Certificate">Class 12 Passing Certificate</option>
                <option value="AICTE Course Admission Certificate">AICTE Course Admission Certificate</option>
                <option value="Disability Certificate">Disability Certificate</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-[#1B5E20] mb-1.5"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Expiry Date
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="block w-full px-3 py-2.5 border border-[#C8E6C9] rounded-xl text-[#0A270D] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#66BB6A] focus:border-[#66BB6A] transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-3 rounded-xl text-[11px] text-[#2E7D32] leading-relaxed">
              💡 Document parsing uses AI OCR scan to extract issue identifiers and digital signatures automatically.
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full text-xs font-bold text-white bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-[#A5D6A7] py-3 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 shadow-md"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {isUploading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning Document OCR...
                </>
              ) : (
                "Scan & Add Document"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
