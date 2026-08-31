"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { User, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, updateUserProfile } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");
  const [category, setCategory] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setState(user.state || "");
      setAge(user.age || "");
      setEducation(user.education || "");
      setCategory(user.category || "");
      setIncomeRange(user.incomeRange || "");
      setGender(user.gender || "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateUserProfile({
      name, email, state, age, education, category, incomeRange, gender,
    });
    setSaving(false);
    if (result.success) setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fieldStyle = {
    width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
    border: "1px solid #E5E0D8", fontSize: "0.875rem", fontFamily: "inherit",
    background: "#fff", color: "#061508", outline: "none",
  };
  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "#4A5568",
    marginBottom: 4, display: "block",
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <Link href="/chat" style={{ color: "#4A5568" }}><ArrowLeft size={20} /></Link>
        <User size={20} color="#1B5E20" />
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#061508", margin: 0 }}>My Profile</h1>
      </div>
      <p style={{ fontSize: "0.8rem", color: "#81C784", marginBottom: "1.5rem" }}>
        This information is used by Iva to match you with relevant government schemes.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={fieldStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>State</label>
            <input style={fieldStyle} value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Maharashtra" />
          </div>
          <div>
            <label style={labelStyle}>Age</label>
            <input style={fieldStyle} type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Education</label>
            <select style={fieldStyle} value={education} onChange={(e) => setEducation(e.target.value)}>
              <option value="">Select</option>
              <option value="10th">10th</option>
              <option value="12th">12th</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Annual Income</label>
            <select style={fieldStyle} value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)}>
              <option value="">Select</option>
              <option value="Below ₹1,50,000">Below ₹1,50,000</option>
              <option value="₹1,50,000 - ₹2,50,000">₹1,50,000 – ₹2,50,000</option>
              <option value="₹2,50,000 - ₹4,50,000">₹2,50,000 – ₹4,50,000</option>
              <option value="Above ₹4,50,000">Above ₹4,50,000</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={fieldStyle} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: "1.5rem", width: "100%", padding: "0.625rem",
          borderRadius: 8, border: "none", background: "#1B5E20",
          color: "#fff", fontSize: "0.875rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
          opacity: saving ? 0.7 : 1,
        }}
      >
        <Save size={16} />
        {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
      </button>
    </div>
  );
}
