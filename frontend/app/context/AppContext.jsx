"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const AppContext = createContext();

export function AppProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // App States
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [agentState, setAgentState] = useState("Neutral");
  
  // Chat input prefixing for context routing
  const [pendingPrompt, setPendingPrompt] = useState("");

  // Guard: prevent refreshData from being called in a loop
  const fetchedRef = useRef(false);

  // Load session from localStorage if exists
  useEffect(() => {
    const storedUser = localStorage.getItem("hazela_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Fetch data when user is authenticated
  const refreshData = async () => {
    try {
      const [profileRes, schemesRes, appsRes, docsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/schemes"),
        fetch("/api/applications"),
        fetch("/api/documents")
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        // Sync user details if logged in
        if (user) {
          setUser(prev => ({ ...prev, ...profileData }));
        }
      }
      if (schemesRes.ok) setSchemes(await schemesRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
      if (docsRes.ok) setDocuments(await docsRes.json());
    } catch (error) {
      console.error("Error loading mock database in AppContext:", error);
    }
  };

  useEffect(() => {
    if (user?.onboardingCompleted && !fetchedRef.current) {
      fetchedRef.current = true;
      refreshData();
    }
  }, [user?.onboardingCompleted]);

  // Auth Operations
  const login = (name, phone) => {
    const mockUser = {
      name: name || "Aarav Sharma",
      phone: phone || "+91 98765 43210",
      onboardingCompleted: true
    };
    setUser(mockUser);
    localStorage.setItem("hazela_user", JSON.stringify(mockUser));
    router.push("/chat");
  };

  const signup = (name, phone) => {
    const mockUser = {
      name,
      phone,
      onboardingCompleted: false
    };
    setUser(mockUser);
    localStorage.setItem("hazela_user", JSON.stringify(mockUser));
    router.push("/onboarding");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hazela_user");
    fetchedRef.current = false;
    router.push("/");
  };

  const completeOnboarding = async (profileData) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, onboardingCompleted: true })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        const updatedUser = { ...user, onboardingCompleted: true, name: updatedProfile.name };
        setUser(updatedUser);
        localStorage.setItem("hazela_user", JSON.stringify(updatedUser));
        router.push("/chat");
      }
    } catch (error) {
      console.error("Onboarding API error:", error);
    }
  };

  // Chat message submission
  const sendMessage = async (text, schemeContext = null, applicationContext = null) => {
    // Add user message locally first for responsiveness
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now"
    };
    setChatHistory(prev => [...prev, userMsg]);
    setAgentState("Attentive");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          schemeContext,
          applicationContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Append agent response
        setChatHistory(prev => [...prev, data.chatMessage]);
        setAgentState(data.agentState || "Neutral");
        
        // Sync modified states
        if (data.updatedApplications) setApplications(data.updatedApplications);
        if (data.updatedProfile) {
          setUser(prev => ({ ...prev, ...data.updatedProfile }));
        }
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setChatHistory(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "agent",
          text: "I encountered a local network issue checking that. Please retry.",
          timestamp: "Just now",
          agentState: "Confused"
        }
      ]);
      setAgentState("Confused");
    }
  };

  // Explore and Application interactions with the Chat agent
  const askAgentAboutScheme = (scheme) => {
    setPendingPrompt(`Explain eligibility criteria for ${scheme.name}`);
    router.push("/chat");
  };

  const askAgentAboutApplication = (app) => {
    setPendingPrompt(`Why is my application for ${app.name} showing ${app.status}?`);
    router.push("/chat");
  };

  const updateApplication = async (id, updates) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
        return updated;
      }
    } catch (error) {
      console.error("Application update error:", error);
    }
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const prepareApplication = async (scheme) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: scheme.id,
          name: scheme.name
        })
      });

      if (res.ok) {
        const newApp = await res.json();
        setApplications(prev => {
          const index = prev.findIndex(a => a.id === newApp.id);
          if (index !== -1) return prev.map((a, i) => i === index ? newApp : a);
          return [...prev, newApp];
        });
        
        // Push context to chat
        setPendingPrompt(`Prepare application for ${scheme.name}`);
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  // Add a document
  const uploadDocument = async (docType, expiryDate) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          expiryDate
        })
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [...prev, newDoc]);
        
        // Inform user in chat
        setChatHistory(prev => [
          ...prev,
          {
            id: `msg-doc-${Date.now()}`,
            sender: "agent",
            text: `I have successfully scanned and logged your ${docType}. I will run check routines against matching schemes now.`,
            timestamp: "Just now",
            agentState: "Excited"
          }
        ]);
        setAgentState("Excited");
      }
    } catch (error) {
      console.error("Document upload error:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        schemes,
        applications,
        documents,
        chatHistory,
        agentState,
        pendingPrompt,
        setPendingPrompt,
        login,
        signup,
        logout,
        completeOnboarding,
        sendMessage,
        askAgentAboutScheme,
        askAgentAboutApplication,
        prepareApplication,
        updateApplication,
        uploadDocument,
        setAgentState,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
