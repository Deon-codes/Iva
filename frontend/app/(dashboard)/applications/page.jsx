"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function ApplicationsPage() {
  const { applications, askAgentAboutApplication, updateApplication, setPendingPrompt, sendMessage } = useApp();
  const [selectedApp, setSelectedApp] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpModalApp, setOtpModalApp] = useState(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const getWorkflowStepColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 border-green-200 bg-green-50";
      case "attention":
        return "text-red-600 border-red-200 bg-red-50 font-bold animate-pulse";
      case "in_progress":
        return "text-amber-600 border-amber-300 bg-amber-50 animate-pulse";
      case "locked":
        return "text-ink-400 border-ink-150 bg-paper-100";
      case "pending":
      default:
        return "text-ink-500 border-ink-150 bg-paper-50";
    }
  };

  const getWorkflowStepIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "attention":
        return "⚠";
      case "in_progress":
        return "●";
      case "locked":
        return "🔒";
      case "pending":
      default:
        return "○";
    }
  };

  // Simulate OTP Verification Handoff
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otpInput.trim() !== "123456") {
      alert("Invalid OTP code. For demo, use 123456.");
      return;
    }

    setIsVerifyingOtp(true);
    setTimeout(() => {
      // Update app status
      updateApplication(otpModalApp.id, {
        status: "Submitted to Department",
        reason: "OTP verification completed. Form successfully submitted to official portal. Reference ID: #NSP-998127.",
        workflow: {
          profile: "completed",
          eligibility: "completed",
          documents: "completed",
          application: "completed",
          review: "completed",
          otp: "completed"
        },
        history: [
          ...otpModalApp.history,
          { event: "OTP consent verified", status: "success", timestamp: "Just now" },
          { event: "Submitted to official portal", status: "success", timestamp: "Just now" }
        ]
      });

      setIsVerifyingOtp(false);
      setOtpModalApp(null);
      setOtpInput("");
      
      // Let the user know via agent message
      setPendingPrompt("Check Central Sector submission status");
    }, 1500);
  };

  return (
    <div className="flex-grow flex flex-col gap-6 font-body">
      
      {/* Editorial Header */}
      <div className="border-b border-ink-100 pb-4 mb-2">
        <h1 className="font-display font-bold text-3xl text-ink-950">Application Workspace</h1>
        <p className="text-sm text-ink-500 max-w-xl mt-1">
          Monitor draft compilations, legitimacy ratings, portal status, and manual verification steps delegated to the agent.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-paper-50 rounded-2xl border border-ink-150 p-12 text-center max-w-xl mx-auto mt-6">
          <span className="text-4xl block mb-3">📁</span>
          <h3 className="font-display font-bold text-lg text-ink-950">No applications initiated</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-xs mx-auto">
            Browse matching opportunities in the Explore tab and delegate compilation to the agent to get started.
          </p>
          <a
            href="/explore"
            className="mt-6 inline-block bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
          >
            Explore Schemes
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {applications.map((app) => {
            const hasAttention = Object.values(app.workflow).includes("attention");
            const canReview = app.workflow.review === "attention" || app.workflow.review === "in_progress";
            const isDisbursed = app.status.includes("Disbursed");

            return (
              <div
                key={app.id}
                className={`bg-paper-50 border rounded-2xl shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 border-l-4 ${
                  hasAttention 
                    ? "border-l-red-500 border-ink-200" 
                    : isDisbursed 
                      ? "border-l-green-600 border-ink-200" 
                      : "border-l-amber-500 border-ink-200"
                }`}
              >
                
                {/* Left Panel: App Info & History Log */}
                <div className="flex-grow md:w-3/5 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-bold text-xl text-ink-950">
                        {app.name}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${
                        hasAttention 
                          ? "bg-red-50 text-red-600 border-red-200" 
                          : isDisbursed
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Dynamic context alert/status details */}
                    <p className="text-xs text-ink-600 font-medium mt-2 leading-relaxed bg-paper-100 p-3 rounded-lg border border-ink-150">
                      <strong>Current Phase:</strong> {app.reason}
                    </p>

                    {/* Timestamp */}
                    <span className="text-[10px] text-ink-400 block mt-2 font-mono">
                      Last Action: {app.updatedAt}
                    </span>
                  </div>

                  {/* Integration actions back to chat */}
                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-100 flex-wrap">
                    {hasAttention ? (
                      <button
                        onClick={() => askAgentAboutApplication(app)}
                        className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Ask Agent What Happened
                      </button>
                    ) : (
                      <button
                        onClick={() => askAgentAboutApplication(app)}
                        className="text-xs font-semibold text-ink-600 hover:text-ink-950 bg-paper-100 border border-ink-200 px-3 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Ask Agent status review
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => {
                          // Trigger OTP consent modal
                          setOtpModalApp(app);
                        }}
                        className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Provide OTP Consent
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Panel: Workflow State Visual Pipeline */}
                <div className="md:w-2/5 border-t md:border-t-0 md:border-l border-ink-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center">
                  <h4 className="text-[10px] font-extrabold text-ink-400 uppercase tracking-widest mb-4">
                    Agent Action Pipeline
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      { label: "Profile verified", key: "profile" },
                      { label: "Eligibility verified", key: "eligibility" },
                      { label: "Documents matched", key: "documents" },
                      { label: "Application compiled", key: "application" },
                      { label: "User review completed", key: "review" },
                      { label: "Identity OTP submitted", key: "otp" }
                    ].map((step, idx) => {
                      const state = app.workflow[step.key];
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs font-body">
                          <span className="flex items-center gap-2">
                            <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${getWorkflowStepColor(state)}`}>
                              {getWorkflowStepIcon(state)}
                            </span>
                            <span className={state === "completed" ? "text-ink-400 line-through" : "text-ink-700"}>
                              {step.label}
                            </span>
                          </span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider ${
                            state === "completed" ? "text-green-600" : state === "attention" ? "text-red-500" : "text-ink-400"
                          }`}>
                            {state === "attention" ? "FLAGGED" : state}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* OTP verification Modal */}
      {otpModalApp && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-50 border border-ink-200 max-w-sm w-full rounded-2xl shadow-xl overflow-hidden p-6 relative animate-[visual-enter_0.3s_ease]">
            <button
              onClick={() => setOtpModalApp(null)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 font-bold cursor-pointer"
            >
              ✕
            </button>

            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider font-mono">
              Identity Verification Intercept
            </span>
            
            <h3 className="font-display font-bold text-xl text-ink-950 mt-1 mb-2">
              OTP Consent Required
            </h3>
            
            <p className="text-xs text-ink-600 font-body leading-relaxed mb-4">
              Hazela's agent has successfully compiled the application form for <strong>{otpModalApp.name}</strong>. Government security controls require a manual OTP submission to log into the official portal.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-body mb-4">
              <strong>Verification Code Sent:</strong> Check your registered mobile number for a 6-digit Aadhaar OTP code.
              <span className="block mt-1 font-bold">Demo Bypass Code: 123456</span>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-700 font-body">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-center text-lg font-mono text-ink-950 bg-white tracking-widest focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalApp(null)}
                  className="w-1/2 text-xs font-semibold text-ink-600 bg-paper-100 hover:bg-paper-200 border border-ink-200 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-1/2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 py-2 rounded-lg transition-colors cursor-pointer flex justify-center items-center"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
