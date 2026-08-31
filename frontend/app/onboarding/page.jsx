"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, completeOnboarding } = useApp();
  const router = useRouter();

  // Onboarding fields
  const [formData, setFormData] = useState({
    name: "",
    age: "21",
    state: "Maharashtra",
    education: "Undergraduate",
    incomeRange: "₹2,00,000 - ₹2,50,000",
    category: "OBC",
    phone: "",
    preferences: "Technical courses, Maharashtra state schemes, Central government scholarships"
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || ""
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    completeOnboarding(formData);
  };

  const fillDemoData = () => {
    setFormData({
      name: "Aarav Sharma",
      age: "21",
      state: "Maharashtra",
      education: "Undergraduate",
      incomeRange: "₹2,00,000 - ₹2,50,000",
      category: "OBC",
      phone: "+91 98765 43210",
      preferences: "Technical courses, Maharashtra state/Central schemes"
    });
  };

  return (
    <main className="min-h-screen bg-paper-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Background radial gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_10%,rgba(198,132,31,0.04),transparent_50%),radial-gradient(circle_at_10%_90%,rgba(35,43,69,0.03),transparent_40%)]"
      />

      <div className="max-w-2xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-3xl text-ink-950">Iva</span>
          <h1 className="mt-4 font-display font-bold text-3xl text-ink-950">
            Tell us about yourself
          </h1>
          <p className="mt-2 text-ink-600 text-sm font-body max-w-md mx-auto">
            Your agent uses these details to match eligibility criteria and auto-fill official forms.
          </p>
        </div>

        <div className="bg-paper-50 rounded-xl shadow-md border border-ink-100 p-6 sm:p-10">
          <div className="flex justify-between items-center mb-6 border-b border-ink-100 pb-4">
            <h3 className="font-display font-semibold text-lg text-ink-950">Eligibility Profile</h3>
            <button
              type="button"
              onClick={fillDemoData}
              className="text-xs font-semibold font-body text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
            >
              ⚡ Auto-fill Demo Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold text-ink-700 font-body">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold text-ink-700 font-body">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 font-body">Age</label>
                <input
                  type="number"
                  name="age"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 font-body">State of Domicile</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-ink-700 font-body">Social Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                >
                  <option value="OBC">OBC</option>
                  <option value="General">General / Open</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold text-ink-700 font-body">Current Education</label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                >
                  <option value="Undergraduate">Undergraduate (Degree)</option>
                  <option value="Postgraduate">Postgraduate (Masters)</option>
                  <option value="Class 12">Class 12 (HSC)</option>
                  <option value="Class 10">Class 10 (SSC)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold text-ink-700 font-body">Annual Household Income</label>
                <select
                  name="incomeRange"
                  value={formData.incomeRange}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                >
                  <option value="Below ₹1,50,000">Below ₹1,50,000</option>
                  <option value="₹1,50,000 - ₹2,50,000">₹1,50,000 - ₹2,50,000</option>
                  <option value="₹2,50,000 - ₹4,50,000">₹2,50,000 - ₹4,50,000</option>
                  <option value="Above ₹4,50,000">Above ₹4,50,000</option>
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-semibold text-ink-700 font-body">Preferences & Keywords</label>
                <textarea
                  name="preferences"
                  rows={2}
                  value={formData.preferences}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-ink-200 rounded-md shadow-sm text-ink-950 text-sm font-body bg-white"
                  placeholder="e.g. technical, girls scholarship, tuition benefits..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100 flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 font-body transition-colors cursor-pointer"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
