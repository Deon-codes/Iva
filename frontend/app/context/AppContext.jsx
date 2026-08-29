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
  const [sessionId, setSessionId] = useState(() => {
    try { return localStorage.getItem("hazela_session_id") || null; } catch { return null; }
  });

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

  // Fetch data when user is authenticated and onboarding is complete
  const refreshData = useCallback(async () => {
    const userId = user?.uid || user?.id || "demo-user";
    try {
      const [profileRes, schemesRes, appsRes, docsRes] = await Promise.all([
        fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`),
        fetch("/api/schemes"),
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

    router.push("/");
  };

  /**
   * Complete onboarding: save profile, mark as completed.
   */
  const completeOnboarding = async (profileData) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, user_id: user?.uid || user?.id || "demo-user", onboardingCompleted: true }),
      });

      const updatedProfile = res.ok ? await res.json() : profileData;

      // Merge and persist
    const fullProfile = {
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
    // Also save profile to backend for future reference
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileData, user_id: user?.uid || user?.id || "demo-user" }),
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

  const sendMessage = async (text, schemeContext = null, applicationContext = null) => {
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setAgentState("Attentive");

    const userId = user?.uid || user?.id || "demo-user";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          schemeContext,
          applicationContext,
          userId,
          sessionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Store session_id from backend for continuity across messages
        if (data.sessionId) {
          setSessionId(data.sessionId);
          try { localStorage.setItem("hazela_session_id", data.sessionId); } catch {}
        }

        setChatHistory((prev) => [...prev, data.chatMessage]);
        const newState = data.agentState || "Neutral";
        setAgentState(newState);
        if (["Excited", "Confused", "Suspicious"].includes(newState)) {
          setTimeout(() => setAgentState("Neutral"), 4000);
        }
        if (data.updatedApplications) setApplications(data.updatedApplications);
        if (data.updatedProfile) {
          setUser((prev) => (prev ? { ...prev, ...data.updatedProfile } : prev));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setChatHistory((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            sender: "agent",
            text: errData.error || "The agent encountered an issue. Please try again.",
            timestamp: "Just now",
            agentState: "Confused",
          },
        ]);
        setAgentState("Confused");
        setTimeout(() => setAgentState("Neutral"), 4000);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "agent",
          text: "I encountered a network issue. Please check if the backend is running and try again.",
          timestamp: "Just now",
          agentState: "Confused",
        },
      ]);
      setAgentState("Confused");
      setTimeout(() => setAgentState("Neutral"), 4000);
    }
  };

  // ─── Explore / Applications / Documents ────────────────────────────────────

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
        body: JSON.stringify({ schemeId: scheme.id, name: scheme.name, userId: user?.uid || user?.id || "demo-user" }),
      });

      if (res.ok) {
        const newApp = await res.json();
        setApplications((prev) => {
          const index = prev.findIndex((a) => a.id === newApp.id);
          if (index !== -1) return prev.map((a, i) => (i === index ? newApp : a));
          return [...prev, newApp];
        });
        setPendingPrompt(`Prepare application for ${scheme.name}`);
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const uploadDocument = async (docType, expiryDate) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docType, expiryDate, userId: user?.uid || user?.id || "demo-user" }),
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
        askAgentAboutScheme,
        askAgentAboutApplication,
        prepareApplication,
        updateApplication,
        uploadDocument,
        setAgentState,
        refreshData,
        isTransitioning,
        transitionTarget,
        triggerTransition,
        completeTransition,
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
