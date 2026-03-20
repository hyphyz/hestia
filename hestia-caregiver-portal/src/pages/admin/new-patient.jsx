import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initialSchedule = daysOfWeek.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

const initialFormState = {
  first_name: "",
  last_name: "",
  dob: "",
  gender: "",
  phone: "",
  phone_alt: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  location: "",
  start_of_care: "",
  needs_since: "",
  condition: "",
  condition_details: "",
  care_type: "",
  rate: "",
  transport_reimbursement: "",
  tasks: "",
  preferences: "",
  candidate_caregivers: "",
  notes: ""
};

// MOVED OUTSIDE: This prevents the input from losing focus on every keystroke!
const InputField = ({ label, name, placeholder, type = "text", value, onChange, step }) => (
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-400 mb-1.5 ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      step={step}
      placeholder={placeholder}
      onChange={onChange}
      className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors w-full"
    />
  </div>
);

export default function NewPatient() {
  const [form, setForm] = useState(initialFormState);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [copiedShifts, setCopiedShifts] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // --- Schedule Handlers ---
  const addTimeSlot = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "", end: "" }]
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setSchedule((prev) => {
      const newSlots = [...prev[day]];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, [day]: newSlots };
    });
  };

  const removeTimeSlot = (day, index) => {
    setSchedule((prev) => {
      const newSlots = prev[day].filter((_, i) => i !== index);
      return { ...prev, [day]: newSlots };
    });
  };

  // --- Copy / Paste Handlers ---
  const handleCopy = (day) => {
    const shiftsToCopy = schedule[day].map(shift => ({ ...shift }));
    setCopiedShifts(shiftsToCopy);
  };

  const handlePaste = (day) => {
    if (!copiedShifts) return;
    setSchedule((prev) => ({
      ...prev,
      [day]: copiedShifts.map(shift => ({ ...shift }))
    }));
  };

  // --- Submit Handler ---
  async function createPatient(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedSchedule = {};
    Object.keys(schedule).forEach((day) => {
      const validShifts = schedule[day].filter((shift) => shift.start && shift.end);
      if (validShifts.length > 0) {
        formattedSchedule[day] = validShifts;
      }
    });

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      dob: form.dob || null,
      gender: form.gender,
      phone: form.phone,
      phone_alt: form.phone_alt,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      location: form.location,
      start_of_care: form.start_of_care || null,
      needs_since: form.needs_since || null,
      condition: form.condition,
      condition_details: form.condition_details,
      care_type: form.care_type,
      rate: form.rate ? parseFloat(form.rate) : null,
      transport_reimbursement: form.transport_reimbursement ? parseFloat(form.transport_reimbursement) : null,
      tasks: form.tasks ? form.tasks.split(",").map((t) => t.trim()) : [],
      candidate_caregivers: form.candidate_caregivers ? form.candidate_caregivers.split(",").map((t) => t.trim()) : [],
      preferences: { notes: form.preferences },
      notes: form.notes,
      schedule: formattedSchedule 
    };

    const { error } = await supabase.from("patients").insert(payload);

    setIsSubmitting(false);

    if (error) {
      console.error("Supabase Error:", error);
      alert(`Error creating patient: ${error.message}`);
    } else {
      alert("Patient created successfully!");
      setForm(initialFormState);
      setSchedule(initialSchedule);
      setCopiedShifts(null); 
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <div className="max-w-6xl mx-auto pb-12 pt-4">
        
        <div className="mb-8">
          {/* Back Navigation */}
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Dashboard
          </Link>
          
          <h1 className="text-2xl font-semibold text-white">New Patient Intake</h1>
          <p className="text-gray-400 text-sm mt-1">Register a new patient and configure their multi-shift schedule.</p>
        </div>

        <form onSubmit={createPatient} className="space-y-6">
          
          {/* Section 1: Demographics & Contact */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <InputField label="First Name" name="first_name" placeholder="John" value={form.first_name} onChange={handleChange} />
              <InputField label="Last Name" name="last_name" placeholder="Doe" value={form.last_name} onChange={handleChange} />
              <InputField label="DOB" name="dob" type="date" value={form.dob} onChange={handleChange} />
              
              <InputField label="Gender" name="gender" placeholder="e.g., Male, Female" value={form.gender} onChange={handleChange} />
              <InputField label="Primary Phone" name="phone" placeholder="(555) 123-4567" value={form.phone} onChange={handleChange} />
              <InputField label="Email" name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} />
              
              <InputField label="Alternate Phone" name="phone_alt" placeholder="(555) 987-6543" value={form.phone_alt} onChange={handleChange} />
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <InputField label="Start of Care" name="start_of_care" type="date" value={form.start_of_care} onChange={handleChange} />
                <InputField label="Needs Since" name="needs_since" type="date" value={form.needs_since} onChange={handleChange} />
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-400 mb-3 border-t border-[#2a2a2a] pt-4">Address Details</h3>
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

          {/* Section 2: Service & Billing */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Service & Billing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Care Type" name="care_type" placeholder="e.g., HHA, RN" value={form.care_type} onChange={handleChange} />
              <InputField label="Hourly Rate ($)" name="rate" placeholder="25.00" type="number" step="0.01" value={form.rate} onChange={handleChange} />
              <InputField label="Transport Reimb. ($/mi)" name="transport_reimbursement" placeholder="0.73" type="number" step="0.01" value={form.transport_reimbursement} onChange={handleChange} />
            </div>
          </div>

          {/* Section 3: Multi-Shift Schedule Builder */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-medium text-white">Weekly Schedule</h2>
                <p className="text-sm text-gray-400 mt-1">Add shifts. Use Copy/Paste to duplicate schedules across days.</p>
              </div>
              {copiedShifts && (
                 <div className="text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                   Shift copied to clipboard!
                 </div>
              )}
            </div>
            
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="p-5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
                  
                  {/* Day Header & Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-white text-lg">{day}</h3>
                    
                    <div className="flex items-center space-x-3">
                      {schedule[day].length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopy(day)}
                          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          Copy
                        </button>
                      )}
                      
                      {copiedShifts && (
                        <button
                          type="button"
                          onClick={() => handlePaste(day)}
                          className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          Paste
                        </button>
                      )}

                      <div className="w-px h-4 bg-[#333] mx-1"></div>

                      <button
                        type="button"
                        onClick={() => addTimeSlot(day)}
                        className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-3 py-1.5 rounded transition-colors"
                      >
                        + Add Shift
                      </button>
                    </div>
                  </div>

                  {/* Shifts Map */}
                  {schedule[day].length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No shifts scheduled for {day}.</p>
                  ) : (
                    <div className="space-y-3">
                      {schedule[day].map((slot, index) => (
                        <div key={index} className="flex items-center space-x-4 bg-[#0f0f0f] p-3 rounded border border-[#2a2a2a]">
                          <InputField
                            label="Start Time"
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(day, index, "start", e.target.value)}
                          />
                          <InputField
                            label="End Time"
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(day, index, "end", e.target.value)}
                          />
                          <div className="pt-6">
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(day, index)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-2"
                              title="Remove shift"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Medical & Notes */}
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Medical & Task Information</h2>
            <div className="space-y-4">
              <InputField label="Primary Condition" name="condition" placeholder="e.g., Dementia, Mobility Impaired" value={form.condition} onChange={handleChange} />
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-400 mb-1.5 ml-1">Condition Details</label>
                <textarea
                  name="condition_details"
                  value={form.condition_details}
                  placeholder="Elaborate on the patient's condition..."
                  onChange={handleChange}
                  rows="2"
                  className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-400 mb-1.5 ml-1">Tasks (Comma separated)</label>
                  <textarea
                    name="tasks"
                    value={form.tasks}
                    placeholder="Bathing, Meal Prep..."
                    onChange={handleChange}
                    rows="2"
                    className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors resize-none"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm text-gray-400 mb-1.5 ml-1">Candidate Caregivers (Comma separated IDs)</label>
                  <textarea
                    name="candidate_caregivers"
                    value={form.candidate_caregivers}
                    placeholder="Caregiver IDs..."
                    onChange={handleChange}
                    rows="2"
                    className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-400 mb-1.5 ml-1">Preferences</label>
                  <textarea
                    name="preferences"
                    value={form.preferences}
                    placeholder="e.g., Prefers female caregiver, no pets"
                    onChange={handleChange}
                    rows="3"
                    className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-gray-400 mb-1.5 ml-1">Administrative Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    placeholder="Any other internal notes..."
                    onChange={handleChange}
                    rows="3"
                    className="bg-[#0f0f0f] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-white text-black font-medium px-10 py-3.5 rounded-lg hover:bg-gray-200 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] focus:ring-white ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Saving Patient..." : "Create Patient"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}