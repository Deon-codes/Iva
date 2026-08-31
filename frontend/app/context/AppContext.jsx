"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";

const AppContext = createContext();

export function AppProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App States
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [agentState, setAgentState] = useState("Neutral");

  // Chat session state — preserves Agent Core session across messages
  const [sessionId, setSessionId] = useState(null);

  // Chat history — list of past conversations
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Last sent message for retry
  const [lastMessage, setLastMessage] = useState(null);

  // Chat input prefixing for context routing
  const [pendingPrompt, setPendingPrompt] = useState("");

  // Bloub transition state
  const [transitionTarget, setTransitionTarget] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Guard: prevent refreshData from being called in a loop
  const fetchedRef = useRef(false);

  // ─── Firebase Auth Listener ────────────────────────────────────────────────
  // Single onAuthStateChanged listener. Sets user state + merges profile from localStorage.
  // This is the single source of truth for auth state.
  // Also supports a demo-mode localStorage fallback when Firebase isn't configured.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Merge Firebase user data with stored profile data
        const storedProfile = getStoredProfile(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: storedProfile?.name || firebaseUser.displayName || "",
          phone: storedProfile?.phone || "",
          state: storedProfile?.state || "",
          education: storedProfile?.education || "",
          category: storedProfile?.category || "",
          incomeRange: storedProfile?.incomeRange || "",
          preferences: storedProfile?.preferences || "",
          age: storedProfile?.age || "",
          onboardingCompleted: storedProfile?.onboardingCompleted || false,
        });
      } else {
        // No Firebase user — check localStorage for demo-mode session
        try {
          const stored = localStorage.getItem("hazela_user");
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Sync profile to backend on auth state change ───────────────────────
  // When the user object changes (login, demo, Firebase), ensure the backend
  // has the profile data so Agent tools can access it.
  useEffect(() => {
    if (user?.uid && user?.onboardingCompleted) {
      syncProfileToBackend(user.uid, user);
      // Seed demo profile for fresh accounts (first login)
      seedDemoProfile(user.uid);
    }
  }, [user?.uid, user?.onboardingCompleted]);

  // Fetch data when user is authenticated and onboarding is complete
  const refreshData = useCallback(async () => {
    const userId = user?.uid || user?.id || "demo-user";
    try {
      const [profileRes, schemesRes, appsRes, docsRes] = await Promise.all([
        fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`),
        fetch(`/api/schemes?user_id=${encodeURIComponent(userId)}`),
        fetch(`/api/applications?user_id=${encodeURIComponent(userId)}`),
        fetch(`/api/documents?user_id=${encodeURIComponent(userId)}`),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser((prev) => (prev ? { ...prev, ...profileData } : prev));
      }
      if (schemesRes.ok) setSchemes(await schemesRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
      if (docsRes.ok) setDocuments(await docsRes.json());
    } catch (error) {
      console.error("Error loading data from backend:", error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.onboardingCompleted && !fetchedRef.current) {
      fetchedRef.current = true;
      refreshData();
    }
  }, [user?.onboardingCompleted, refreshData]);

  // ─── Chat History ───────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    const userId = user?.uid || user?.id || "demo-user";
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/history?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.uid]);

  // Load conversations on mount
  useEffect(() => {
    if (user?.onboardingCompleted) loadConversations();
  }, [user?.onboardingCompleted, loadConversations]);

  // Switch to an existing conversation
  const switchChat = useCallback(async (chatSessionId) => {
    try {
      const res = await fetch(`/api/chat/${chatSessionId}`);
      if (res.ok) {
        const session = await res.json();
        setSessionId(session.id);
        try { localStorage.setItem("hazela_session_id", session.id); } catch {}
        // Convert backend messages to frontend format
        const history = (session.messages || []).map((m) => ({
          id: `msg-${m.role}-${Date.now()}-${Math.random()}`,
          sender: m.role === "user" ? "user" : "agent",
          text: m.content,
          timestamp: m.timestamp || "",
          isError: false,
        }));
        setChatHistory(history);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  // Start a new chat
  const newChat = useCallback(() => {
    setSessionId(null);
    setChatHistory([]);
    setLastMessage(null);
    setAgentState("Neutral");
    try { localStorage.removeItem("hazela_session_id"); } catch {}
  }, []);

  // ─── Profile Persistence (localStorage) ───────────────────────────────────
  // Store app-specific profile keyed by Firebase UID.
  // Also persists chat session for continuity.
  function getStoredProfile(uid) {
    try {
      const raw = localStorage.getItem(`hazela_profile_${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveStoredProfile(uid, profile) {
    try {
      localStorage.setItem(`hazela_profile_${uid}`, JSON.stringify(profile));
    } catch {
      // localStorage may be full or disabled — non-critical
    }
  }

  function removeStoredProfile(uid) {
    try {
      localStorage.removeItem(`hazela_profile_${uid}`);
    } catch {
      // ignore
    }
  }

  /**
   * Sync the current user profile to the backend.
   * This ensures the backend has the profile data so Agent tools
   * (prepare_form_fields, get_user_profile, etc.) can access it.
   * The frontend API route /api/profile handles field-name mapping.
   */
  async function syncProfileToBackend(uid, profile) {
    if (!uid || !profile?.onboardingCompleted) return;
    try {
      // POST to frontend proxy — it maps frontend fields to backend shape
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, user_id: uid, onboardingCompleted: true }),
      });
    } catch (err) {
      // Non-critical — profile sync is best-effort
      console.error("Profile sync to backend failed:", err);
    }
  }

  // Demo document seeding is now handled by the backend demo scenario endpoint.
  // Call POST /api/demo/scenario?user_id=xxx with { scenario: "fully_verified" }
  // to seed verified demo documents. No client-side seeding needed.

  // ─── Auth Operations ──────────────────────────────────────────────────────

  /**
   * Sign in with email + password via Firebase.
   * Returns { success, error } — caller decides how to display.
   */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener handles setUser
      router.push("/chat");
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  /**
   * Create a new Firebase user + set display name.
   * Returns { success, error }.
   */
  const signup = async (email, password, name, phone) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name on Firebase user
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      // Store initial profile data (not yet onboarded)
      saveStoredProfile(cred.user.uid, {
        name: name || "",
        phone: phone || "",
        onboardingCompleted: false,
      });

      // onAuthStateChanged will fire and set user with onboardingCompleted: false
      router.push("/onboarding");
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  /**
   * Sign in with Google popup.
   * Returns { success, error }.
   */
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user.uid;

      // Check if this Google user already has a stored profile
      const existing = getStoredProfile(uid);

      if (existing?.onboardingCompleted) {
        // Returning user — profile complete, go to dashboard
        router.push("/chat");
      } else {
        // New user — store profile stub and redirect to onboarding
        saveStoredProfile(uid, {
          name: cred.user.displayName || "",
          phone: "",
          onboardingCompleted: false,
        });
        // onAuthStateChanged will fire → user set with onboardingCompleted: false
        router.push("/onboarding");
      }

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  /**
   * Sign out of Firebase and clear all local state.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Sign out should always proceed even if Firebase call fails
    }

    // Clear local app state
    if (user?.uid) removeStoredProfile(user.uid);
    try {
      localStorage.removeItem("hazela_user");
      localStorage.removeItem("hazela_session_id");
    } catch { /* ignore */ }
    setUser(null);
    fetchedRef.current = false;
    setSchemes([]);
    setApplications([]);
    setDocuments([]);
    setChatHistory([]);
    setAgentState("Neutral");
    setPendingPrompt("");
    setSessionId(null);
    setConversations([]);
    setLastMessage(null);

    router.push("/");
  };

  /**
   * Complete onboarding: save profile, mark as completed.
   */
  const completeOnboarding = async (profileData) => {
    const uid = user?.uid || user?.id || "demo-user";
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, user_id: uid, onboardingCompleted: true }),
      });

      const updatedProfile = res.ok ? await res.json() : profileData;

      // Merge and persist locally (keep frontend field names for UI)
    const fullProfile = {
      ...profileData,
      ...updatedProfile,
      onboardingCompleted: true,
    };

    if (user?.uid) {
      saveStoredProfile(user.uid, fullProfile);
    }

    setUser((prev) => (prev ? { ...prev, ...fullProfile } : prev));
    router.push("/chat");
  } catch (error) {
    console.error("Onboarding API error:", error);
    // Still mark onboarded locally so user isn't stuck
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, user_id: uid, onboardingCompleted: true }),
      });
    } catch {}
    if (user?.uid) {
      saveStoredProfile(user.uid, { ...profileData, onboardingCompleted: true });
    }
    setUser((prev) =>
      prev ? { ...prev, ...profileData, onboardingCompleted: true } : prev
    );
    router.push("/chat");
  }
  };

  // ─── Chat ─────────────────────────────────────────────────────────────────
  // Session persistence: sessionId is stored in localStorage and reused across
  // messages so the Agent Core maintains conversational context.

  const sendMessage = async (text, extraContext = null) => {
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
      isError: false,
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setAgentState("Attentive");
    setLastMessage({ text, extraContext });

    const userId = user?.uid || user?.id || "demo-user";

    // Build context with profile info + any extra context (scheme, application)
    const context = {};
    if (user?.state) context.state = user.state;
    if (user?.education) context.education = user.education;
    if (user?.category) context.category = user.category;
    if (user?.incomeRange) context.income_range = user.incomeRange;
    if (user?.age) context.age = user.age;
    if (extraContext) Object.assign(context, extraContext);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          user_id: userId,
          session_id: sessionId,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Store session_id from backend for continuity across messages
        if (data.session_id) {
          setSessionId(data.session_id);
          try { localStorage.setItem("hazela_session_id", data.session_id); } catch {}
        }

        // Map actions for display
        const actionsText = (data.actions || []).length > 0
          ? "\n\nActions: " + data.actions.map((a) => a.tool_name).join(", ")
          : "";
        const nextSteps = (data.suggested_next_steps || []).length > 0
          ? "\n\nNext steps:\n" + data.suggested_next_steps.map((s) => "• " + s).join("\n")
          : "";

        setChatHistory((prev) => [...prev, {
          id: `msg-agent-${Date.now()}`,
          sender: "agent",
          text: data.response_text + actionsText + nextSteps,
          timestamp: "Just now",
          isError: false,
        }]);

        const newState = data.status_update === "action_required" ? "Confused"
          : data.prepared_application_id ? "Excited"
          : "Neutral";
        setAgentState(newState);
        if (["Excited", "Confused"].includes(newState)) {
          setTimeout(() => setAgentState("Neutral"), 4000);
        }

        // Refresh data after agent response
        refreshData();
        // Refresh chat history list
        loadConversations();
      } else {
        const errData = await res.json().catch(() => ({}));
        const rawMsg = errData.detail || errData.error || "";
        // Sanitize error — never expose backend internals to users
        const errorMsg = (!rawMsg || rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota") || rawMsg.includes("gemini") || rawMsg.includes("google") || rawMsg.includes("llm"))
          ? "I'm getting a lot of requests right now. Please try again in a moment."
          : rawMsg;
        setChatHistory((prev) => [...prev, {
          id: `msg-err-${Date.now()}`,
          sender: "agent",
          text: errorMsg,
          timestamp: "Just now",
          isError: true,
        }]);
        setAgentState("Confused");
        setTimeout(() => setAgentState("Neutral"), 4000);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setChatHistory((prev) => [...prev, {
        id: `msg-err-${Date.now()}`,
        sender: "agent",
        text: "Couldn't reach the agent. Please check your connection and try again.",
        timestamp: "Just now",
        isError: true,
      }]);
      setAgentState("Confused");
      setTimeout(() => setAgentState("Neutral"), 4000);
    }
  };

  // Retry the last failed message
  const retryLastMessage = useCallback(() => {
    if (!lastMessage) return;
    // Remove the last error message from history
    setChatHistory((prev) => prev.filter((m) => !m.isError));
    setLastMessage(null);
    sendMessage(lastMessage.text, lastMessage.extraContext);
  }, [lastMessage, sendMessage]);

  // ─── Explore / Applications / Documents ────────────────────────────────────

  const askAgentAboutScheme = (scheme) => {
    setPendingPrompt({ text: `Explain eligibility criteria for ${scheme.name}`, extraContext: { scheme_id: scheme.id, scheme_name: scheme.name } });
    router.push("/chat");
  };

  const askAgentAboutApplication = (app) => {
    setPendingPrompt({ text: `Why is my application for ${app.name} showing ${app.status}?`, extraContext: { application_id: app.id, application_name: app.name } });
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
    // Route through the Agent — the Agent decides to invoke prepare_form_fields
    // and create_application via the form_prep_agent sub-agent.
    // Include scheme_id in the message text so the Agent can extract it,
    // since context propagation through ADK may not reach sub-agents.
    setPendingPrompt({
      text: `Prepare my application for ${scheme.name} (scheme_id: ${scheme.id}).`,
      extraContext: { scheme_id: scheme.id, scheme_name: scheme.name },
    });
    router.push("/chat");
  };

  const uploadDocument = async (docType, expiryDate) => {
    const uid = user?.uid || user?.id || "demo-user";
    // Map display name to document_type key
    const typeMap = {
      "Income Certificate (FY 2026-27)": "income_certificate",
      "Caste Certificate": "caste_certificate",
      "Domicile Certificate": "domicile_certificate",
      "Class 12 Passing Certificate": "marksheet",
      "Aadhaar Card": "aadhaar",
      "Bank Passbook": "bank_passbook",
      "Admission Letter": "admission_letter",
      "Marksheet": "marksheet",
      "Disability Certificate": "disability_certificate",
    };
    const docTypeKey = typeMap[docType] || docType.toLowerCase().replace(/[^a-z_]/g, "");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: docTypeKey,
          user_id: uid,
          filename: `${docTypeKey}.pdf`,
          status: "verified",
          extracted_fields: expiryDate ? { expiryDate } : {},
        }),
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments((prev) => [...prev, newDoc]);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `msg-doc-${Date.now()}`,
            sender: "agent",
            text: `I have successfully scanned and logged your ${docType}. I will run check routines against matching schemes now.`,
            timestamp: "Just now",
            agentState: "Excited",
          },
        ]);
        setAgentState("Excited");
        setTimeout(() => setAgentState("Neutral"), 4000);
      }
    } catch (error) {
      console.error("Document upload error:", error);
    }
  };

  // ─── Bloub Transition ─────────────────────────────────────────────────────

  const triggerTransition = (target) => {
    if (isTransitioning) return;
    setTransitionTarget(target);
    setIsTransitioning(true);
  };

  const completeTransition = () => {
    if (transitionTarget) {
      router.push(transitionTarget);
    }
    setIsTransitioning(false);
    setTransitionTarget(null);
  };

  // ─── Profile Editing ─────────────────────────────────────────────────────
  // ─── Document Deletion ────────────────────────────────────────────────
  const deleteDocument = async (docId) => {
    const uid = user?.uid || user?.id || "demo-user";
    try {
      const res = await fetch(`/api/documents/${docId}?user_id=${encodeURIComponent(uid)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        return { success: true };
      }
    } catch (error) {
      console.error("Document delete error:", error);
    }
    return { success: false };
  };

  // ─── Demo Scenario ───────────────────────────────────────────────────
  const setDemoScenario = async (scenario) => {
    const uid = user?.uid || user?.id || "demo-user";
    try {
      const res = await fetch(`/api/demo/scenario?user_id=${encodeURIComponent(uid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (res.ok) {
        // Refresh documents and applications after scenario switch
        await refreshData();
      }
    } catch { /* ignore */ }
  };

  // ─── Demo Profile Seeding ────────────────────────────────────────────
  // On first login, seed a realistic demo profile so the demo works immediately.
  async function seedDemoProfile(uid) {
    try {
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const profile = await res.json();
        // If profile has no name/education, it's likely a fresh account — seed it
        if (!profile.name && !profile.education_level) {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: uid,
              name: "Demo User",
              email: "demo@hazela.app",
              state: "Maharashtra",
              age: 22,
              annual_income_inr: 500000,
              education_level: "Undergraduate",
              caste_category: "OBC",
              gender: "Male",
              institution_name: "Fr. Conceicao Rodrigues College of Engineering",
              course_name: "B.Tech Computer Engineering",
            }),
          });
          // Also seed fully_verified scenario documents
          await fetch(`/api/demo/scenario?user_id=${encodeURIComponent(uid)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenario: "fully_verified" }),
          });
        }
      }
    } catch { /* best effort */ }
  }

  const updateUserProfile = async (updates) => {
    const uid = user?.uid || user?.id || "demo-user";
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, user_id: uid }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Merge with frontend field names
        const merged = {
          ...user,
          ...updates,
          name: updated.name || user?.name,
          state: updated.state || user?.state,
          education: updated.education_level || user?.education,
          category: updated.caste_category || user?.category,
          age: updated.age ? String(updated.age) : user?.age,
          gender: updated.gender || user?.gender,
        };
        setUser(merged);
        if (uid) saveStoredProfile(uid, merged);
        return { success: true };
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
    return { success: false };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading: authLoading,
        schemes,
        applications,
        documents,
        chatHistory,
        agentState,
        pendingPrompt,
        setPendingPrompt,
        login,
        signup,
        loginWithGoogle,
        logout,
        completeOnboarding,
        sendMessage,
        retryLastMessage,
        askAgentAboutScheme,
        askAgentAboutApplication,
        prepareApplication,
        updateApplication,
        uploadDocument,
        deleteDocument,
        setDemoScenario,
        updateUserProfile,
        setAgentState,
        refreshData,
        isTransitioning,
        transitionTarget,
        triggerTransition,
        completeTransition,
        conversations,
        loadingHistory,
        loadConversations,
        switchChat,
        newChat,
        sessionId,
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
