"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";

export default function ChatPage() {
  const { 
    chatHistory, 
    agentState, 
    sendMessage, 
    pendingPrompt, 
    setPendingPrompt,
    applications,
    documents
  } = useApp();

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat history
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking, thinkingSteps]);

  // Handle incoming pending prompts (e.g., redirect from Explore or Applications)
  useEffect(() => {
    if (pendingPrompt) {
      handleSendPrompt(pendingPrompt);
      setPendingPrompt("");
    }
  }, [pendingPrompt]);

  const handleSendPrompt = async (textToSend) => {
    if (!textToSend.trim() || isThinking) return;

    setIsThinking(true);
    
    // Determine thinking steps based on search term
    const query = textToSend.toLowerCase();
    let steps = [
      { text: "Reading context", status: "completed" },
      { text: "Analyzing query", status: "in_progress" }
    ];

    if (query.includes("prepare") || query.includes("apply")) {
      steps = [
        { text: "Loading user profile", status: "completed" },
        { text: "Verifying portal eligibility criteria", status: "completed" },
        { text: "Cross-matching certificates via DigiLocker", status: "in_progress" },
        { text: "Compiling draft form data", status: "pending" },
        { text: "OTP consent handoff", status: "locked" }
      ];
    } else if (query.includes("mismatch") || query.includes("why") || query.includes("reject") || query.includes("what happened")) {
      steps = [
        { text: "Fetching application submission log", status: "completed" },
        { text: "Extracting rejection code from MahaDBT/NSP", status: "completed" },
        { text: "Comparing profile data with uploaded documents", status: "in_progress" },
        { text: "Formulating resolution path", status: "pending" }
      ];
    } else if (query.includes("yes") || query.includes("update") || query.includes("fix")) {
      steps = [
        { text: "Accessing profile data fields", status: "completed" },
        { text: "Updating annual income boundary", status: "completed" },
        { text: "Re-scanning matching certificate parameters", status: "in_progress" },
        { text: "Submitting correction to verification queue", status: "pending" }
      ];
    } else if (query.includes("find") || query.includes("scholarship") || query.includes("qualify")) {
      steps = [
        { text: "Checking academic qualifications", status: "completed" },
        { text: "Checking state and income boundaries", status: "completed" },
        { text: "Searching scholarship database (NSP & MahaDBT)", status: "in_progress" },
        { text: "Ranking schemes by match percentage", status: "pending" }
      ];
    }

    setThinkingSteps(steps);
    setActiveStepIndex(steps.findIndex(s => s.status === "in_progress"));

    // Cycle thinking steps for visual effect
    const interval = setInterval(() => {
      setThinkingSteps(prev => {
        const next = [...prev];
        const currentIdx = next.findIndex(s => s.status === "in_progress");
        if (currentIdx !== -1 && currentIdx < next.length - 1) {
          next[currentIdx].status = "completed";
          next[currentIdx + 1].status = "in_progress";
          setActiveStepIndex(currentIdx + 1);
        }
        return next;
      });
    }, 1500);

    // Call sendMessage
    await sendMessage(textToSend);
    
    clearInterval(interval);
    setIsThinking(false);
    setThinkingSteps([]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendPrompt(input);
    setInput("");
  };

  // Get active blob animation values based on state
  const getBlobStyles = () => {
    switch (agentState) {
      case "Attentive":
        return {
          fill: "fill-amber-400/90",
          scale: "scale-105",
          pulseSpeed: "animate-[pulse_1.5s_infinite_ease-in-out]",
          radius: "rounded-[45%_55%_50%_50%/_50%_55%_45%_50%]"
        };
      case "Confused":
        return {
          fill: "fill-red-400/80",
          scale: "scale-100 rotate-12",
          pulseSpeed: "animate-[bounce_2s_infinite]",
          radius: "rounded-[30%_70%_40%_60%/_50%_60%_40%_50%]"
        };
      case "Suspicious":
        return {
          fill: "fill-purple-400/80",
          scale: "scale-95",
          pulseSpeed: "animate-[pulse_4s_infinite]",
          radius: "rounded-[60%_40%_60%_40%/_40%_60%_40%_60%]"
        };
      case "Excited":
        return {
          fill: "fill-emerald-400/90",
          scale: "scale-110",
          pulseSpeed: "animate-[bounce_1s_infinite]",
          radius: "rounded-[50%_50%_30%_70%/_50%_60%_40%_50%]"
        };
      case "Sleepy":
        return {
          fill: "fill-ink-300/60",
          scale: "scale-90",
          pulseSpeed: "animate-[pulse_5s_infinite]",
          radius: "rounded-[40%_60%_50%_50%/_60%_40%_60%_40%]"
        };
      case "Neutral":
      default:
        return {
          fill: "fill-amber-300/80",
          scale: "scale-100",
          pulseSpeed: "animate-[pulse_3s_infinite_ease-in-out]",
          radius: "rounded-[50%_50%_50%_50%/_50%_50%_50%_50%]"
        };
    }
  };

  const blob = getBlobStyles();

  // Find dynamic alerts to show as Work Cards
  const getAlertCards = () => {
    const cards = [];
    // 1. Income certificate expiring
    const incomeDoc = documents.find(d => d.id === "doc-income");
    if (incomeDoc) {
      cards.push({
        id: "alert-doc-expiry",
        title: "DOCUMENT EXPIRY",
        description: "Income Certificate expires in 28 days.",
        timestamp: "Renew soon",
        status: "attention"
      });
    }

    // 2. Application Mismatches
    applications.forEach(app => {
      if (app.status === "Action Required") {
        cards.push({
          id: `alert-app-${app.id}`,
          title: "ACTION REQUIRED",
          description: `${app.name}: Income certificate mismatch flagged.`,
          timestamp: "Urgent",
          status: "attention"
        });
      }
    });

    return cards;
  };

  const alertCards = getAlertCards();

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-6 relative">
      
      {/* LEFT COLUMN: Agent Workspace & Chat Feedback */}
      <div className="flex-grow flex flex-col bg-paper-50 rounded-2xl border border-ink-100 shadow-sm overflow-hidden p-4 sm:p-6 md:w-3/5">
        
        {/* Agent Banner / Blob presence */}
        <div className="flex items-center gap-4 border-b border-ink-100 pb-4 mb-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Morphing Blob SVG */}
            <div className={`absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent blur-sm rounded-full ${agentState === "Excited" ? "scale-125" : "scale-100"} transition-transform duration-500`}></div>
            <svg viewBox="0 0 100 100" className={`w-14 h-14 transition-all duration-700 ease-in-out transform ${blob.scale}`}>
              <path
                d="M 50,10 C 70,10 90,30 90,50 C 90,70 70,90 50,90 C 30,90 10,70 10,50 C 10,30 30,10 50,10 Z"
                className={`transition-all duration-700 ${blob.fill} ${blob.pulseSpeed} origin-center`}
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-ink-950 flex items-center gap-2">
              Hazela Agent
              <span className="text-[10px] bg-paper-200 px-2 py-0.5 rounded-full text-ink-600 font-semibold font-body tracking-wider uppercase">
                {agentState}
              </span>
            </h2>
            <p className="text-xs text-ink-500 font-body">
              {isThinking ? "Working on your request..." : "Watching for deadlines and alerts"}
            </p>
          </div>
        </div>

        {/* Chat Transcript Area */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 min-h-[300px] max-h-[480px]">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-ink-400 font-body p-6">
              <span className="text-3xl mb-2">👋</span>
              <p className="text-sm font-semibold">Start your delegation conversation.</p>
              <p className="text-xs max-w-xs mt-1">Ask the agent to scan schemes, check documents, or begin preparing forms.</p>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body shadow-sm border ${
                    msg.sender === "user" 
                      ? "bg-amber-500 text-white border-amber-600 rounded-tr-none" 
                      : "bg-paper-100 text-ink-950 border-ink-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
                
                {/* Embedded Work Cards in Agent message */}
                {msg.workCards && (
                  <div className="mt-2 w-full max-w-[80%] grid grid-cols-1 gap-2">
                    {msg.workCards.map(card => (
                      <div 
                        key={card.id}
                        className={`p-3 rounded-lg border shadow-xs bg-paper-50 flex items-center justify-between border-l-4 ${
                          card.status === "attention" ? "border-l-red-500 border-ink-150" : "border-l-emerald-500 border-ink-150"
                        }`}
                      >
                        <div>
                          <span className={`text-[10px] font-bold tracking-wider font-body ${card.status === "attention" ? "text-red-600" : "text-emerald-600"}`}>
                            {card.title}
                          </span>
                          <h4 className="text-xs font-semibold text-ink-950 mt-0.5">{card.description}</h4>
                          <span className="text-[10px] text-ink-400 font-body block mt-0.5">{card.timestamp}</span>
                        </div>
                        <a 
                          href={card.status === "attention" ? "/applications" : "/explore"}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 font-body cursor-pointer"
                        >
                          View Details
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                
                <span className="text-[10px] text-ink-400 mt-1 px-1 font-body">{msg.timestamp}</span>
              </div>
            ))
          )}

          {/* Real-time Agent Working State Progress Bar */}
          {isThinking && (
            <div className="bg-paper-100 border border-ink-200 rounded-2xl p-4 space-y-3 w-full max-w-[85%] border-tl-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-800 font-body uppercase tracking-wider">
                  Agent Operation Status
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              </div>
              
              <div className="space-y-2">
                {thinkingSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-body">
                    <span className="flex items-center gap-2">
                      {step.status === "completed" && <span className="text-green-600">✓</span>}
                      {step.status === "in_progress" && <span className="text-amber-500 animate-pulse">●</span>}
                      {step.status === "pending" && <span className="text-ink-300">○</span>}
                      {step.status === "locked" && <span className="text-ink-400">🔒</span>}
                      <span className={step.status === "completed" ? "text-ink-400 line-through" : step.status === "in_progress" ? "text-ink-950 font-semibold" : "text-ink-500"}>
                        {step.text}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-ink-400">
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="mt-auto border-t border-ink-100 pt-4 flex gap-2">
          <input
            type="text"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            placeholder={isThinking ? "Agent processing..." : "Type instructions (e.g. 'check matching scholarships', 'fix profile income')"}
            className="flex-grow appearance-none block w-full px-4 py-2.5 border border-ink-200 rounded-full shadow-inner placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-ink-950 text-sm font-body bg-white disabled:bg-paper-200"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-ink-300 text-white rounded-full px-5 py-2.5 text-sm font-semibold font-body transition-colors cursor-pointer shadow-md"
          >
            Send
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Active Work Cards & Alerts */}
      <div className="w-full md:w-2/5 flex flex-col gap-6">
        
        {/* Agent Workspace Status Header */}
        <div className="bg-paper-50 rounded-2xl border border-ink-100 p-6 shadow-sm">
          <h3 className="font-display font-bold text-lg text-ink-950 mb-2">Workspace Actions</h3>
          <p className="text-xs text-ink-500 font-body mb-4">
            Quickly delegate tasks or execute recommended updates verified by the agent.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSendPrompt("Find scholarships matching my profile")}
              disabled={isThinking}
              className="text-left w-full text-xs font-semibold font-body text-ink-700 bg-paper-100 hover:bg-paper-200 border border-ink-200 p-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🔍 Scan matching scholarships</span>
              <span className="text-amber-600">→</span>
            </button>
            <button
              onClick={() => handleSendPrompt("Why was my Central Sector application flagged?")}
              disabled={isThinking}
              className="text-left w-full text-xs font-semibold font-body text-ink-700 bg-paper-100 hover:bg-paper-200 border border-ink-200 p-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <span>⚠ Inspect Central Sector scheme issue</span>
              <span className="text-amber-600">→</span>
            </button>
            <button
              onClick={() => handleSendPrompt("Fix my profile income certificate mismatch")}
              disabled={isThinking}
              className="text-left w-full text-xs font-semibold font-body text-ink-700 bg-paper-100 hover:bg-paper-200 border border-ink-200 p-2.5 rounded-lg transition-all flex items-center justify-between cursor-pointer"
            >
              <span>⚡ Resolve income certificate discrepancy</span>
              <span className="text-amber-600">→</span>
            </button>
          </div>
        </div>

        {/* Dynamic Agent Work Cards */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display font-bold text-md text-ink-950 uppercase tracking-wider border-b border-ink-100 pb-2">
            Active Work Cards ({alertCards.length})
          </h4>

          {alertCards.length === 0 ? (
            <div className="bg-paper-50 rounded-xl border border-ink-100 p-6 text-center text-ink-400 text-xs font-body">
              No outstanding alerts. All document validations and submissions are in alignment.
            </div>
          ) : (
            alertCards.map(card => (
              <div 
                key={card.id}
                className="bg-paper-50 border border-ink-200 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col gap-2 border-l-4 border-l-red-500 animate-[visual-enter_0.35s_ease]"
                style={{
                  boxShadow: "0 2px 4px rgba(11, 18, 32, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                }}
              >
                {/* Physical note aesthetics */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-paper-200 rounded-bl-lg border-l border-b border-ink-200 opacity-60"></div>
                
                <span className="text-[10px] font-extrabold tracking-wider text-red-600 font-body uppercase">
                  {card.title}
                </span>
                
                <h5 className="font-display font-bold text-sm text-ink-950 mt-1 max-w-[90%]">
                  {card.description}
                </h5>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-ink-100">
                  <span className="text-[10px] text-ink-400 font-body font-semibold">
                    {card.timestamp}
                  </span>
                  <a
                    href={card.id.includes("doc") ? "/documents" : "/applications"}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 font-body cursor-pointer"
                  >
                    View Status
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
