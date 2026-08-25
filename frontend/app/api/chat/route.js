import { NextResponse } from "next/server";
import { 
  addChatMessage, 
  updateApplication, 
  updateProfile, 
  mockProfile, 
  mockApplications,
  addApplication
} from "../mockDb";

export async function POST(request) {
  try {
    const { message, schemeContext, applicationContext } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const query = message.toLowerCase();
    let reply = "";
    let agentState = "Attentive";
    let updatedApplications = null;
    let workCards = [];

    // Simulate agent intelligence
    if (query.includes("hi") || query.includes("hello") || query.includes("good morning")) {
      reply = "Good day, Aarav! How can I help you delegate your scholarship tasks today? I'm actively tracking your OBC Post-Matric scheme and the Central Sector application.";
      agentState = "Neutral";
    } 
    else if (query.includes("mismatch") || query.includes("rejected") || query.includes("why") || query.includes("what happened")) {
      reply = "For the **Central Sector Scheme of Scholarship**, the portal flagged a mismatch: your profile lists ₹2,50,000 but the uploaded Income Certificate lists ₹2,60,000. Both are below the eligibility threshold of ₹4,50,000. Would you like me to update your profile income to ₹2,60,000 to match your certificate and re-verify?";
      agentState = "Confused";
      workCards = [
        {
          id: "card-fix-mismatch",
          title: "PROFILE MISMATCH",
          description: "Update profile income to ₹2.6L to match certificate.",
          timestamp: "Action required",
          status: "attention"
        }
      ];
    }
    else if (query.includes("yes") || query.includes("update") || query.includes("fix") || query.includes("agree")) {
      // Perform profile update
      updateProfile({ incomeRange: "₹2,50,000 - ₹3,00,000" }); // set to match
      
      // Update application state
      updateApplication("app-central-sector", {
        status: "Review Required",
        reason: "Income certificate verified. The agent has prepared the application. Final review and OTP consent are pending.",
        workflow: {
          profile: "completed",
          eligibility: "completed",
          documents: "completed",
          application: "completed",
          review: "attention",
          otp: "locked"
        },
        history: [
          { event: "Profile updated by agent", status: "success", timestamp: "Just now" },
          { event: "Income certificate verified", status: "success", timestamp: "Just now" },
          { event: "Application draft prepared", status: "success", timestamp: "Just now" }
        ]
      });

      reply = "Done! I have updated your profile income range to match the certificate. The documents check is now green, and I have successfully prepared the application draft! You can see the updated status in the **Applications** tab. Please click 'Review' and provide your OTP consent to submit.";
      agentState = "Excited";
    }
    else if (query.includes("find") || query.includes("qualify") || query.includes("eligible") || query.includes("scholarship")) {
      reply = "Based on your profile, you qualify for 3 scholarships:\n\n1. **Post-Matric Scholarship for OBC Students, Maharashtra** (Tuition waiver, closes Sep 20)\n2. **Central Sector Scheme of Scholarship** (₹12,000/yr, active issue)\n3. **PM-YASASVI Post Matric Scholarship** (Fee waiver up to ₹2.5L/yr, closes Sep 25)\n\nI recommend preparing the OBC Post-Matric scholarship next. Would you like me to start preparing it?";
      agentState = "Excited";
      workCards = [
        {
          id: "card-obc-match",
          title: "OBC SCHOLARSHIP",
          description: "OBC Post-Matric Maharashtra closes in 25 days.",
          timestamp: "Highly relevant",
          status: "success"
        }
      ];
    }
    else if (query.includes("prepare") || query.includes("apply") || query.includes("start")) {
      // Check if they specified OBC
      const isOBC = query.includes("obc") || query.includes("maharashtra") || query.includes("post-matric");
      
      if (isOBC) {
        // Create/Update Maharashtra OBC scholarship app
        const existing = mockApplications.find(a => a.schemeId === "obc-maharashtra");
        if (existing) {
          updateApplication("app-obc-maharashtra", {
            status: "Preparing Application",
            workflow: {
              profile: "completed",
              eligibility: "in_progress",
              documents: "pending",
              application: "pending",
              review: "pending",
              otp: "locked"
            }
          });
        } else {
          addApplication({
            id: "app-obc-maharashtra",
            schemeId: "obc-maharashtra",
            name: "Post-Matric Scholarship for OBC Students, Maharashtra",
            status: "Preparing Application",
            reason: "Agent checking Maharashtra OBC eligibility criteria.",
            updatedAt: "Just now",
            workflow: {
              profile: "completed",
              eligibility: "in_progress",
              documents: "pending",
              application: "pending",
              review: "pending",
              otp: "locked"
            },
            history: [{ event: "Initiated", status: "success", timestamp: "Just now" }]
          });
        }

        reply = "I'm starting the preparation flow for the **Post-Matric Scholarship for OBC Students, Maharashtra**. I will check your profile eligibility and match it with your caste certificate. I will let you know once the draft form is compiled.";
        agentState = "Attentive";
      } else {
        reply = "Which scholarship would you like me to prepare? I can start preparing the **Post-Matric Scholarship for OBC Students** or the **PM-YASASVI Post Matric Scholarship**.";
        agentState = "Confused";
      }
    }
    else {
      // Context checks
      if (schemeContext) {
        reply = `I have received context for the scheme: **${schemeContext.name}**. I've checked that it matches your profile guidelines. Would you like me to verify eligibility or prepare the draft application?`;
      } else if (applicationContext) {
        reply = `I am now focusing on your application for **${applicationContext.name}**. The current status is '${applicationContext.status}'. Let me know what you would like me to adjust or explain.`;
      } else {
        reply = "I've logged your request. I will cross-reference this with official portals and verify how to proceed. Let me know if you want to run eligibility checks.";
        agentState = "Neutral";
      }
    }

    const agentMessage = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      text: reply,
      timestamp: "Just now",
      agentState,
      workCards: workCards.length > 0 ? workCards : undefined
    };

    addChatMessage({ id: `msg-user-${Date.now()}`, sender: "user", text: message, timestamp: "Just now" });
    addChatMessage(agentMessage);

    return NextResponse.json({
      reply,
      agentState,
      chatMessage: agentMessage,
      updatedApplications: mockApplications,
      updatedProfile: mockProfile
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
