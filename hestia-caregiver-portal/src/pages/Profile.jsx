import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

// --- Helper Components ---
const InputField = ({ label, name, placeholder, type = "text", value, onChange, readOnly = false }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-400 mb-1.5 ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      placeholder={placeholder}
      onChange={onChange}
      readOnly={readOnly}
      className={`border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors w-full ${
        readOnly ? "bg-[#1f1f1f] cursor-not-allowed opacity-70" : "bg-[#0f0f0f]"
      }`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-400 mb-1.5 ml-1">{label}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors w-full appearance-none"
    >
      <option value="" disabled className="text-gray-600">Select an option...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const TextAreaField = ({ label, name, placeholder, value, onChange, rows = 3 }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-400 mb-1.5 ml-1">{label}</label>
    <textarea
      name={name}
      value={value || ""}
      placeholder={placeholder}
      onChange={onChange}
      rows={rows}
      className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors w-full resize-none"
    />
  </div>
);

export default function CaregiverProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    languages: "",
    certifications: "",
    skillsNotOpenTo: "",
    transportation: "",

    street: "",
    city: "",
    state: "",
    zip: "",

    maxMiles: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authId, setAuthId] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Authentication error:", authError);
          setIsLoading(false);
          return;
        }

        setAuthId(user.id);
        const authEmail = user.email;

        const { data, error } = await supabase
          .from("caregivers")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (data) {
          setForm({
            name: data.name || "",
            email: data.email || authEmail,
            age: data.age || "",
            gender: data.gender || "",
            languages: data.languages || "",
            certifications: data.certifications || "",
            skillsNotOpenTo: data.skills_not_open_to || "",
            transportation: data.transportation || "",

            street: data.street || "",
            city: data.city || "",
            state: data.state || "",
            zip: data.zip || "",

            maxMiles: data.max_miles || ""
          });
        } else {
          setForm(prev => ({ ...prev, email: authEmail }));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authId) {
      alert("You must be logged in.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      auth_id: authId,
      name: form.name,
      email: form.email,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender,
      languages: form.languages,
      certifications: form.certifications,
      skills_not_open_to: form.skillsNotOpenTo,
      transportation: form.transportation,

      street: form.street,
      city: form.city,
      state: form.state,
      zip: form.zip,

      max_miles: form.maxMiles ? parseInt(form.maxMiles) : null
    };

    const { error } = await supabase
      .from("caregivers")
      .upsert(payload, { onConflict: "auth_id" });

    setIsSubmitting(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Profile saved successfully!");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-gray-400">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <div className="max-w-4xl mx-auto pb-12 pt-4 px-6 lg:px-0">

        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-semibold text-white">Caregiver Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your personal information.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Full Name" name="name" value={form.name} onChange={handleChange} />
              <InputField label="Email Address" name="email" value={form.email} readOnly />

              <InputField label="Age" name="age" type="number" value={form.age} onChange={handleChange} />

              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={["Female","Male","Non-binary","Prefer not to say"]}
              />

              <InputField
                label="Languages"
                name="languages"
                value={form.languages}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Home Address</h2>

            <div className="space-y-5">

              <InputField
                label="Street Address"
                name="street"
                placeholder="123 Main St"
                value={form.street}
                onChange={handleChange}
              />

              <div className="grid grid-cols-3 gap-4">

                <InputField
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />

                <InputField
                  label="State"
                  name="state"
                  placeholder="CA"
                  value={form.state}
                  onChange={handleChange}
                />

                <InputField
                  label="ZIP Code"
                  name="zip"
                  placeholder="90001"
                  value={form.zip}
                  onChange={handleChange}
                />

              </div>

            </div>
          </div>

          {/* Logistics */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Logistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">

              <SelectField
                label="Reliable Transportation?"
                name="transportation"
                value={form.transportation}
                onChange={handleChange}
                options={["Yes","No"]}
              />

              <InputField
                label="Max Travel Range (Miles)"
                name="maxMiles"
                type="number"
                value={form.maxMiles}
                onChange={handleChange}
              />

            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-black px-10 py-3 rounded-lg"
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}