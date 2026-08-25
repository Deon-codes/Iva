"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function ExplorePage() {
  const { schemes, user, askAgentAboutScheme, prepareApplication } = useApp();
  const [selectedScheme, setSelectedScheme] = useState(null);

  return (
    <div className="flex-grow flex flex-col gap-6 font-body">
      
      {/* Editorial Header */}
      <div className="border-b border-ink-100 pb-4 mb-2">
        <h1 className="font-display font-bold text-3xl text-ink-950">Explore Opportunities</h1>
        <p className="text-sm text-ink-500 max-w-xl mt-1">
          Personalized opportunities compiled by your agent based on your profile matching Maharashtra Domicile, Undergraduate study, OBC category, and household income range of {user.incomeRange}.
        </p>
      </div>

      {/* Main Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schemes.map((scheme) => {
          // Check if scheme is highly matching
          const isEligibleMatch = scheme.id !== "pragati-girls" || user.category === "Female"; // simple mock
          
          return (
            <div
              key={scheme.id}
              className={`bg-paper-50 border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 ${
                isEligibleMatch ? "border-ink-200 hover:border-amber-400 hover:shadow-md" : "border-ink-100 opacity-60"
              }`}
            >
              <div>
                {/* Department & Legitimacy Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider font-mono">
                    {scheme.department}
                  </span>
                  <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">
                    {scheme.legitimacyStatus}
                  </span>
                </div>

                {/* Scheme Title */}
                <h3 className="font-display font-bold text-xl text-ink-950 leading-snug">
                  {scheme.name}
                </h3>

                {/* Benefits Banner */}
                <div className="mt-3 bg-amber-50/50 border border-amber-200/50 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Benefit Value</span>
                  <p className="text-sm font-semibold text-ink-950 mt-0.5">{scheme.benefit}</p>
                </div>

                {/* Why it is relevant explanation */}
                <div className="mt-4 border-l-2 border-amber-500 pl-3">
                  <span className="text-[10px] uppercase font-bold text-ink-400 block font-body">Relevancy Mapping</span>
                  <p className="text-xs text-ink-600 mt-0.5 italic">{scheme.whyRelevant}</p>
                </div>

                {/* Key metadata points */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-body border-t border-ink-100 pt-3">
                  <div>
                    <span className="text-ink-400 font-semibold block">Deadline</span>
                    <span className="text-ink-800 font-bold">{new Date(scheme.deadline).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-ink-400 font-semibold block">Documents Needed</span>
                    <span className="text-ink-800 font-semibold">{scheme.requiredDocuments.length} certificates</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedScheme(scheme)}
                  className="text-xs font-semibold text-ink-600 hover:text-ink-900 bg-paper-100 hover:bg-paper-200 border border-ink-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => askAgentAboutScheme(scheme)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Ask Agent
                  </button>
                  <button
                    onClick={() => prepareApplication(scheme)}
                    disabled={!isEligibleMatch}
                    className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-ink-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Prepare Application
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-50 border border-ink-200 max-w-xl w-full rounded-2xl shadow-xl overflow-hidden p-6 relative animate-[visual-enter_0.3s_ease]">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedScheme(null)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 font-bold cursor-pointer"
            >
              ✕
            </button>

            <span className="text-[10px] font-bold text-ink-500 uppercase tracking-wider font-mono">
              {selectedScheme.department}
            </span>
            
            <h2 className="font-display font-bold text-2xl text-ink-950 mt-1 mb-4 leading-tight">
              {selectedScheme.name}
            </h2>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block font-body">Benefits & Financial Aid</span>
                <p className="text-sm text-ink-950 mt-1">{selectedScheme.benefit}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block font-body">Eligibility Criteria</span>
                <p className="text-sm text-ink-950 mt-1">{selectedScheme.eligibility}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block font-body">Required Certificates</span>
                <ul className="list-disc list-inside mt-1 text-sm text-ink-950 space-y-1">
                  {selectedScheme.requiredDocuments.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-ink-100 pt-3 text-xs font-body">
                <div>
                  <span className="text-ink-400 font-semibold block">Official Source Link</span>
                  <a
                    href={selectedScheme.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline break-all"
                  >
                    {selectedScheme.officialSource}
                  </a>
                </div>
                <div>
                  <span className="text-ink-400 font-semibold block">Legitimacy Check</span>
                  <span className="text-green-600 font-semibold">{selectedScheme.legitimacyStatus}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-ink-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  askAgentAboutScheme(selectedScheme);
                  setSelectedScheme(null);
                }}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Ask Agent about this scheme
              </button>
              <button
                onClick={() => {
                  prepareApplication(selectedScheme);
                  setSelectedScheme(null);
                }}
                className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Prepare Application Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
