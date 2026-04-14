import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const inputBase = "w-full px-4 py-2.5 rounded-xl text-sm text-[#2C1810] placeholder-[#C4A898] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C41858]/30 focus:border-[#C41858]/60";
const inputStyle = { background: "#FAF3EF", border: "1px solid #EDE3DC" };
const readOnlyStyle = { background: "#F5EDE8", border: "1px solid #EDE3DC", cursor: "not-allowed", opacity: 0.7 };

const InputField = ({ label, name, placeholder, type = "text", value, onChange, readOnly = false }) => (
  <div className="flex flex-col w-full">
    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      placeholder={placeholder}
      onChange={onChange}
      readOnly={readOnly}
      className={inputBase}
      style={readOnly ? readOnlyStyle : inputStyle}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col w-full">
    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>{label}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className={`${inputBase} appearance-none`}
      style={inputStyle}
    >
      <option value="" disabled>Select an option...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default function CaregiverProfile() {
  const [form, setForm] = useState({
    name: "", email: "", age: "", gender: "", languages: "",
    certifications: "", skillsNotOpenTo: "", transportation: "",
    street: "", city: "", state: "", zip: "", maxMiles: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authId, setAuthId] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setIsLoading(false); return; }

        setAuthId(user.id);
        const { data } = await supabase.from("caregivers").select("*").eq("auth_id", user.id).single();

        if (data) {
          setForm({
            name: data.name || "", email: data.email || user.email,
            age: data.age || "", gender: data.gender || "", languages: data.languages || "",
            certifications: data.certifications || "", skillsNotOpenTo: data.skills_not_open_to || "",
            transportation: data.transportation || "", street: data.street || "",
            city: data.city || "", state: data.state || "", zip: data.zip || "",
            maxMiles: data.max_miles || ""
          });
        } else {
          setForm(prev => ({ ...prev, email: user.email }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authId) { alert("You must be logged in."); return; }
    setIsSubmitting(true);

    const payload = {
      auth_id: authId, name: form.name, email: form.email,
      age: form.age ? parseInt(form.age) : null, gender: form.gender,
      languages: form.languages, certifications: form.certifications,
      skills_not_open_to: form.skillsNotOpenTo, transportation: form.transportation,
      street: form.street, city: form.city, state: form.state, zip: form.zip,
      max_miles: form.maxMiles ? parseInt(form.maxMiles) : null
    };

    const { error } = await supabase.from("caregivers").upsert(payload, { onConflict: "auth_id" });
    setIsSubmitting(false);

    if (error) alert(error.message);
    else alert("Profile saved successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C41858] border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "#8C6B60" }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const initials = form.name ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:opacity-70" style={{ color: "#8C6B60" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: "linear-gradient(135deg, #C41858, #8B1035)" }}>
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2C1810]">Caregiver Profile</h1>
            <p className="text-sm mt-0.5" style={{ color: "#8C6B60" }}>Manage your personal information and preferences</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "#C41858" }}>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" name="name" value={form.name} onChange={handleChange} />
            <InputField label="Email Address" name="email" value={form.email} readOnly />
            <InputField label="Age" name="age" type="number" value={form.age} onChange={handleChange} />
            <SelectField
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              options={["Female", "Male", "Non-binary", "Prefer not to say"]}
            />
            <div className="md:col-span-2">
              <InputField label="Languages Spoken" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g., English, Spanish" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "#C41858" }}>
            Home Address
          </h2>
          <div className="space-y-4">
            <InputField label="Street Address" name="street" placeholder="123 Main St" value={form.street} onChange={handleChange} />
            <div className="grid grid-cols-3 gap-4">
              <InputField label="City" name="city" value={form.city} onChange={handleChange} />
              <InputField label="State" name="state" placeholder="CA" value={form.state} onChange={handleChange} />
              <InputField label="ZIP Code" name="zip" placeholder="90001" value={form.zip} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "#C41858" }}>
            Logistics & Availability
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField
              label="Reliable Transportation?"
              name="transportation"
              value={form.transportation}
              onChange={handleChange}
              options={["Yes", "No"]}
            />
            <InputField
              label="Max Travel Range (Miles)"
              name="maxMiles"
              type="number"
              value={form.maxMiles}
              onChange={handleChange}
              placeholder="e.g., 25"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-1 pb-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #C41858, #8B1035)",
              boxShadow: "0 4px 16px rgba(196, 24, 88, 0.3)"
            }}
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </div>

      </form>
    </div>
  );
}
