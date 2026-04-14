import { useState } from "react";
import { Link } from "react-router-dom";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initialSchedule = daysOfWeek.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

const initialFormState = {
  first_name: "", last_name: "", dob: "", gender: "", phone: "",
  phone_alt: "", email: "", address: "", city: "", state: "", zip: "",
  location: "", start_of_care: "", needs_since: "", condition: "",
  condition_details: "", care_type: "", rate: "", transport_reimbursement: "",
  tasks: "", preferences: "", candidate_caregivers: "", notes: ""
};

const inputBase = "w-full px-4 py-2.5 rounded-xl text-sm text-[#2C1810] placeholder-[#C4A898] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C41858]/25 focus:border-[#C41858]/50";
const inputStyle = { background: "#FAF3EF", border: "1px solid #EDE3DC" };

// MOVED OUTSIDE: This prevents the input from losing focus on every keystroke!
const InputField = ({ label, name, placeholder, type = "text", value, onChange, step }) => (
  <div className="flex flex-col w-full">
    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      step={step}
      placeholder={placeholder}
      onChange={onChange}
      className={inputBase}
      style={inputStyle}
    />
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
    <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "#C41858" }}>{title}</h2>
    {children}
  </div>
);

export default function NewPatient() {
  const [form, setForm] = useState(initialFormState);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [copiedShifts, setCopiedShifts] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addTimeSlot = (day) => {
    setSchedule((prev) => ({ ...prev, [day]: [...prev[day], { start: "", end: "" }] }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setSchedule((prev) => {
      const newSlots = [...prev[day]];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, [day]: newSlots };
    });
  };

  const removeTimeSlot = (day, index) => {
    setSchedule((prev) => ({ ...prev, [day]: prev[day].filter((_, i) => i !== index) }));
  };

  const handleCopy = (day) => setCopiedShifts(schedule[day].map(shift => ({ ...shift })));

  const handlePaste = (day) => {
    if (!copiedShifts) return;
    setSchedule((prev) => ({ ...prev, [day]: copiedShifts.map(shift => ({ ...shift })) }));
  };

  async function createPatient(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedSchedule = {};
    Object.keys(schedule).forEach((day) => {
      const validShifts = schedule[day].filter((shift) => shift.start && shift.end);
      if (validShifts.length > 0) formattedSchedule[day] = validShifts;
    });

    const payload = {
      first_name: form.first_name, last_name: form.last_name,
      dob: form.dob || null, gender: form.gender,
      phone: form.phone, phone_alt: form.phone_alt, email: form.email,
      address: form.address, city: form.city, state: form.state, zip: form.zip,
      location: form.location, start_of_care: form.start_of_care || null,
      needs_since: form.needs_since || null, condition: form.condition,
      condition_details: form.condition_details, care_type: form.care_type,
      rate: form.rate ? parseFloat(form.rate) : null,
      transport_reimbursement: form.transport_reimbursement ? parseFloat(form.transport_reimbursement) : null,
      tasks: form.tasks ? form.tasks.split(",").map((t) => t.trim()) : [],
      candidate_caregivers: form.candidate_caregivers ? form.candidate_caregivers.split(",").map((t) => t.trim()) : [],
      preferences: { notes: form.preferences }, notes: form.notes, schedule: formattedSchedule
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const apiKey = import.meta.env.VITE_PROCESSOR_API_KEY;
      const response = await fetch(`${apiUrl}/api/patients/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to process patient record via secure server.");
      alert("Patient securely created!");
      setForm(initialFormState);
      setSchedule(initialSchedule);
      setCopiedShifts(null);
    } catch (error) {
      console.error("Submission Error:", error);
      alert(`Error creating patient: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:opacity-70" style={{ color: "#8C6B60" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#2C1810]">New Patient Intake</h1>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
          Register a new patient and configure their care schedule.
        </p>
      </div>

      <form onSubmit={createPatient} className="space-y-5">

        {/* Section 1: Patient Information */}
        <SectionCard title="Patient Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InputField label="First Name" name="first_name" placeholder="John" value={form.first_name} onChange={handleChange} />
            <InputField label="Last Name" name="last_name" placeholder="Doe" value={form.last_name} onChange={handleChange} />
            <InputField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} />
            <InputField label="Gender" name="gender" placeholder="e.g., Male, Female" value={form.gender} onChange={handleChange} />
            <InputField label="Primary Phone" name="phone" placeholder="(555) 123-4567" value={form.phone} onChange={handleChange} />
            <InputField label="Email" name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} />
            <InputField label="Alternate Phone" name="phone_alt" placeholder="(555) 987-6543" value={form.phone_alt} onChange={handleChange} />
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <InputField label="Start of Care" name="start_of_care" type="date" value={form.start_of_care} onChange={handleChange} />
              <InputField label="Needs Since" name="needs_since" type="date" value={form.needs_since} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-4 mt-1 border-t" style={{ borderColor: "#F5EDE8" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#B59890" }}>Address Details</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <InputField label="Street Address" name="address" placeholder="123 Main St" value={form.address} onChange={handleChange} />
              </div>
              <InputField label="City" name="city" placeholder="Los Angeles" value={form.city} onChange={handleChange} />
              <InputField label="State" name="state" placeholder="CA" value={form.state} onChange={handleChange} />
              <InputField label="Zip Code" name="zip" placeholder="90001" value={form.zip} onChange={handleChange} />
              <div className="md:col-span-3">
                <InputField label="General Location" name="location" placeholder="e.g., West LA" value={form.location} onChange={handleChange} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Service & Billing */}
        <SectionCard title="Service & Billing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Care Type" name="care_type" placeholder="e.g., HHA, RN" value={form.care_type} onChange={handleChange} />
            <InputField label="Hourly Rate ($)" name="rate" placeholder="25.00" type="number" step="0.01" value={form.rate} onChange={handleChange} />
            <InputField label="Transport Reimbursement ($/mi)" name="transport_reimbursement" placeholder="0.73" type="number" step="0.01" value={form.transport_reimbursement} onChange={handleChange} />
          </div>
        </SectionCard>

        {/* Section 3: Weekly Schedule */}
        <SectionCard title="Weekly Schedule">
          <div className="flex justify-between items-center mb-5">
            <p className="text-sm" style={{ color: "#8C6B60" }}>Add shifts and use Copy/Paste to duplicate schedules across days.</p>
            {copiedShifts && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(34,166,118,0.1)", color: "#22A676", border: "1px solid rgba(34,166,118,0.2)" }}>
                Shift copied!
              </span>
            )}
          </div>

          <div className="space-y-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="rounded-xl border overflow-hidden" style={{ borderColor: "#EDE3DC" }}>

                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ background: "#FAF7F4" }}>
                  <h3 className="font-semibold text-sm text-[#2C1810]">{day}</h3>
                  <div className="flex items-center gap-2">
                    {schedule[day].length > 0 && (
                      <button type="button" onClick={() => handleCopy(day)}
                        className="flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-lg"
                        style={{ color: "#8C6B60", background: "#EDE3DC" }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    )}
                    {copiedShifts && (
                      <button type="button" onClick={() => handlePaste(day)}
                        className="flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-lg"
                        style={{ color: "#22A676", background: "rgba(34,166,118,0.1)" }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Paste
                      </button>
                    )}
                    <button type="button" onClick={() => addTimeSlot(day)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition-all"
                      style={{ background: "linear-gradient(135deg, #C41858, #8B1035)" }}>
                      + Add Shift
                    </button>
                  </div>
                </div>

                {/* Shift rows */}
                {schedule[day].length === 0 ? (
                  <p className="text-xs italic px-4 py-3" style={{ color: "#C4A898" }}>No shifts for {day}.</p>
                ) : (
                  <div className="p-4 space-y-2">
                    {schedule[day].map((slot, index) => (
                      <div key={index} className="flex items-end gap-3 rounded-xl p-3" style={{ background: "#FAF3EF" }}>
                        <InputField label="Start Time" type="time" value={slot.start}
                          onChange={(e) => updateTimeSlot(day, index, "start", e.target.value)} />
                        <InputField label="End Time" type="time" value={slot.end}
                          onChange={(e) => updateTimeSlot(day, index, "end", e.target.value)} />
                        <div className="pb-0.5">
                          <button type="button" onClick={() => removeTimeSlot(day, index)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-colors"
                            style={{ borderColor: "#EDE3DC", color: "#C41858", background: "#fff" }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Section 4: Medical & Notes */}
        <SectionCard title="Medical & Care Information">
          <div className="space-y-4">
            <InputField label="Primary Condition" name="condition" placeholder="e.g., Dementia, Mobility Impaired" value={form.condition} onChange={handleChange} />

            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>Condition Details</label>
              <textarea name="condition_details" value={form.condition_details}
                placeholder="Elaborate on the patient's condition..."
                onChange={handleChange} rows="2"
                className="text-sm text-[#2C1810] placeholder-[#C4A898] rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#C41858]/25 transition-all"
                style={{ background: "#FAF3EF", border: "1px solid #EDE3DC" }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Tasks (Comma separated)", name: "tasks", placeholder: "Bathing, Meal Prep, Medication..." },
                { label: "Candidate Caregivers (Comma separated IDs)", name: "candidate_caregivers", placeholder: "Caregiver IDs..." },
                { label: "Preferences", name: "preferences", placeholder: "e.g., Prefers female caregiver, no pets" },
                { label: "Administrative Notes", name: "notes", placeholder: "Any other internal notes..." },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>{field.label}</label>
                  <textarea name={field.name} value={form[field.name]} placeholder={field.placeholder}
                    onChange={handleChange} rows="2"
                    className="text-sm text-[#2C1810] placeholder-[#C4A898] rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#C41858]/25 transition-all"
                    style={{ background: "#FAF3EF", border: "1px solid #EDE3DC" }} />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Submit */}
        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #C41858, #8B1035)",
              boxShadow: "0 4px 16px rgba(196, 24, 88, 0.3)"
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving Patient...
              </>
            ) : "Create Patient"}
          </button>
        </div>

      </form>
    </div>
  );
}
