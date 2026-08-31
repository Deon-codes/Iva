// In-memory mock database for Iva API endpoints
// This will persist during the session, allowing dynamic updates.

export let mockProfile = {
  name: "Aarav Sharma",
  age: 21,
  state: "Maharashtra",
  education: "Undergraduate",
  incomeRange: "₹2,00,000 - ₹2,50,000",
  category: "OBC",
  phone: "+91 98765 43210",
  preferences: "Technical courses, Maharashtra state schemes, Central government scholarships",
  onboardingCompleted: true
};

export let mockSchemes = [
  {
    id: "obc-maharashtra",
    name: "Post-Matric Scholarship for OBC Students, Maharashtra",
    department: "Social Justice and Special Assistance Department",
    benefit: "100% Tuition fees waiver & maintenance allowance of up to ₹1,500/month.",
    eligibility: "Student must belong to OBC category, Maharashtra resident, household income <= ₹1,50,000 per annum (under review for renewal).",
    deadline: "2026-09-20",
    requiredDocuments: ["Income Certificate", "Caste Certificate", "Domicile Certificate", "College Admission Marksheet"],
    legitimacyStatus: "Legitimate (Verified MahaDBT Portal)",
    officialSource: "https://mahadbt.maharashtra.gov.in",
    whyRelevant: "Matches your OBC status, Maharashtra residency, and current Undergraduate study.",
    recommendedAction: "Prepare application for OBC Post-Matric Maharashtra scholarship."
  },
  {
    id: "central-sector",
    name: "Central Sector Scheme of Scholarship for College and University Students",
    department: "Department of Higher Education (MHRD)",
    benefit: "₹12,000 per annum for Graduation; ₹20,000 per annum for Post-Graduation.",
    eligibility: "Above 80th percentile in Class 12, pursuing a regular course, annual income <= ₹4,50,000.",
    deadline: "2026-09-30",
    requiredDocuments: ["Income Certificate", "Class 12 Marksheet", "Aadhaar Card", "College Fee Receipt"],
    legitimacyStatus: "Legitimate (National Scholarship Portal)",
    officialSource: "https://scholarships.gov.in",
    whyRelevant: "Your annual income is well within the ₹4.5 Lakh limit, and matches your higher education status.",
    recommendedAction: "Review and resolve the income certificate mismatch to proceed."
  },
  {
    id: "pragati-girls",
    name: "Pragati Scholarship Scheme for Girl Students",
    department: "All India Council for Technical Education (AICTE)",
    benefit: "₹50,000 per annum for tuition fees and incidentals.",
    eligibility: "Female students admitted to technical degree courses, maximum 2 girls per family, income <= ₹8,00,000.",
    deadline: "2026-10-15",
    requiredDocuments: ["AICTE Admission Letter", "Tuition Fee Receipt", "Income Certificate", "Family Declaration"],
    legitimacyStatus: "Legitimate (AICTE Official Portal)",
    officialSource: "https://www.aicte-india.org",
    whyRelevant: "Highly relevant technical degree scheme, but requires female gender status.",
    recommendedAction: "Currently on hold (Gender check pending)."
  },
  {
    id: "pm-yasasvi",
    name: "PM-YASASVI Post Matric Scholarship",
    department: "Ministry of Social Justice and Empowerment",
    benefit: "Complete school/college fees waiver up to ₹2.5 Lakhs per year.",
    eligibility: "OBC/EBC/DNT students studying in Top Class Institutions, income <= ₹2,50,000.",
    deadline: "2026-09-25",
    requiredDocuments: ["Caste Certificate", "Income Certificate", "Hostel Certificate (if applicable)", "Aadhaar Card"],
    legitimacyStatus: "Legitimate (Ministry of Social Justice Portal)",
    officialSource: "https://yet.nta.ac.in",
    whyRelevant: "OBC category match and annual income fits the eligibility cap.",
    recommendedAction: "Delegate to agent to check top-class college list matching."
  }
];

export let mockApplications = [
  {
    id: "app-central-sector",
    schemeId: "central-sector",
    name: "Central Sector Scheme of Scholarship",
    status: "Action Required",
    reason: "Income certificate mismatch. The official portal scanned your uploaded certificate and flagged a discrepancy: Certificate lists annual income of ₹2,60,000, while your profile states ₹2,50,000. Aadhaar matches successfully.",
    updatedAt: "12 mins ago",
    workflow: {
      profile: "completed", // 'completed', 'in_progress', 'attention', 'pending', 'locked'
      eligibility: "completed",
      documents: "attention",
      application: "pending",
      review: "pending",
      otp: "locked"
    },
    history: [
      { event: "Profile verified", status: "success", timestamp: "Yesterday, 10:00 AM" },
      { event: "Eligibility checked", status: "success", timestamp: "Yesterday, 10:15 AM" },
      { event: "Income certificate mismatch flagged", status: "attention", timestamp: "12 mins ago" }
    ]
  },
  {
    id: "app-obc-maharashtra",
    schemeId: "obc-maharashtra",
    name: "Post-Matric Scholarship for OBC Students, Maharashtra",
    status: "Approved & Disbursed",
    reason: "Disbursed ₹12,000 for Semester 1 maintenance allowance. Official reference ID #MHA-887126.",
    updatedAt: "5 days ago",
    workflow: {
      profile: "completed",
      eligibility: "completed",
      documents: "completed",
      application: "completed",
      review: "completed",
      otp: "completed"
    },
    history: [
      { event: "Application prepared by agent", status: "success", timestamp: "2026-08-10" },
      { event: "OTP verification completed by user", status: "success", timestamp: "2026-08-11" },
      { event: "Submitted to MahaDBT", status: "success", timestamp: "2026-08-11" },
      { event: "Approved by desk officer", status: "success", timestamp: "2026-08-18" },
      { event: "Funds disbursed", status: "success", timestamp: "2026-08-20" }
    ]
  }
];

export let mockDocuments = [
  {
    id: "doc-income",
    type: "Income Certificate (FY 2025-26)",
    status: "Valid",
    issueDate: "2025-10-15",
    expiryDate: "2026-09-22",
    alert: "Expires in 28 days! We need to renew this for any schemes closing in October.",
    applications: ["Central Sector Scheme of Scholarship", "Post-Matric Scholarship for OBC Students, Maharashtra"],
    fileUrl: "#"
  },
  {
    id: "doc-caste",
    type: "OBC Caste Certificate",
    status: "Verified",
    issueDate: "2021-04-12",
    expiryDate: "Never (Lifetime Validity)",
    alert: "Verified via DigiLocker Integration.",
    applications: ["Post-Matric Scholarship for OBC Students, Maharashtra"],
    fileUrl: "#"
  },
  {
    id: "doc-marksheet-s4",
    type: "Undergraduate Marksheet (Semester 4)",
    status: "Verified",
    issueDate: "2026-06-30",
    expiryDate: "Never",
    alert: "Verified official college transcript.",
    applications: ["Central Sector Scheme of Scholarship", "Post-Matric Scholarship for OBC Students, Maharashtra"],
    fileUrl: "#"
  },
  {
    id: "doc-aadhaar",
    type: "Aadhaar Card",
    status: "Verified",
    issueDate: "2018-02-14",
    expiryDate: "Never",
    alert: "OTP verification linked to +91 98*** **210.",
    applications: ["All applications"],
    fileUrl: "#"
  }
];

export let mockChatHistory = [
  {
    id: "msg-1",
    sender: "agent",
    text: "Good morning, Aarav. I have finished scanning for new opportunities and reviewed your active applications.",
    timestamp: "12 mins ago",
    agentState: "Neutral"
  },
  {
    id: "msg-2",
    sender: "agent",
    text: "I found an issue with your Central Sector Scheme application. There is an income certificate mismatch. Your profile states ₹2,50,000, but your uploaded income certificate lists ₹2,60,000.",
    timestamp: "12 mins ago",
    agentState: "Confused",
    type: "alert",
    workCards: [
      {
        id: "card-income-mismatch",
        title: "INCOME MISMATCH",
        description: "Central Sector Scholarship flagged. Certificate shows ₹2.6L, profile shows ₹2.5L.",
        timestamp: "Updated 12 min ago",
        status: "attention"
      }
    ]
  }
];

// Helper functions to modify state
export function updateProfile(newProfile) {
  Object.assign(mockProfile, newProfile);
  return mockProfile;
}

export function addApplication(app) {
  mockApplications.push(app);
  return mockApplications;
}

export function updateApplication(id, updates) {
  const index = mockApplications.findIndex(app => app.id === id);
  if (index !== -1) {
    mockApplications[index] = { ...mockApplications[index], ...updates };
  }
  return mockApplications;
}

export function addDocument(doc) {
  mockDocuments.push(doc);
  return mockDocuments;
}

export function addChatMessage(msg) {
  mockChatHistory.push(msg);
  return mockChatHistory;
}
