import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ConfirmedShifts() {

const [shifts, setShifts] = useState([]);
const [loading, setLoading] = useState(true);


// Anchor: Convert 24h Time → AM/PM
function formatTime(time) {

  if (!time) return "";

  const [hour, minute] = time.split(":");
  let h = parseInt(hour);

  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12;
  h = h ? h : 12;

  return `${h}:${minute} ${ampm}`;
}


// Anchor: DOB → Age
function calculateAge(dob) {

  if (!dob) return "—";

  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}


// Anchor: Parse Tasks Automatically
function parseTasks(patient) {

  if (!patient) return [];

  // Handle array
  if (Array.isArray(patient.tasks)) {
    return patient.tasks;
  }

  // Handle JSON string
  if (typeof patient.tasks === "string") {

    try {
      const parsed = JSON.parse(patient.tasks);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    return patient.tasks.split(",").map(t => t.trim());
  }

  // fallback
  if (patient.care_type) {
    return [patient.care_type];
  }

  return [];
}

// Anchor: Group Shifts By Patient
function groupShiftsByPatient(assignments) {

  const grouped = {};

  assignments.forEach(shift => {

    const patientId = shift.patient_id;

    if (!grouped[patientId]) {

      grouped[patientId] = {
        patient: shift.patient,
        shifts: []
      };

    }

    grouped[patientId].shifts.push({
      day: shift.day_of_week,
      slots: shift.slots
    });

  });

  return Object.values(grouped);

}


// Anchor: Load Confirmed Shifts
useEffect(() => {
  loadConfirmedShifts();
}, []);


async function loadConfirmedShifts() {

  setLoading(true);

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!caregiver) return;

    const { data: assignments } = await supabase
      .from("schedule_assignments")
      .select("*")
      .eq("caregiver_id", caregiver.id)
      .eq("status", "accepted");

    if (!assignments || assignments.length === 0) {
      setShifts([]);
      setLoading(false);
      return;
    }

    const patientIds = [...new Set(assignments.map(a => a.patient_id))];

    const { data: patients } = await supabase
      .from("patients")
      .select("*")
      .in("id", patientIds);

    const patientMap = {};
    (patients || []).forEach(p => {
    patientMap[p.id] = p;
    });

    const combined = assignments.map(a => ({
    ...a,
    patient: patientMap[a.patient_id]
    }));

    const grouped = groupShiftsByPatient(combined);

    setShifts(grouped);

  } catch (err) {

    console.error("Error loading confirmed shifts", err);

  }

  setLoading(false);

}


return (

<div className="max-w-7xl mx-auto py-6 font-['Inter']">

{/* Header */}

<div className="mb-10">

<h1 className="text-3xl font-bold text-gray-100 tracking-tight mb-2">
Confirmed Visits
</h1>

<p className="text-gray-400 text-sm">
Everything you need before arriving to a visit.
</p>

</div>


{/* Loading */}

{loading && (
<div className="text-gray-400">
Loading shifts...
</div>
)}


{/* Empty */}

{!loading && shifts.length === 0 && (
<div className="text-gray-400">
No confirmed visits yet.
</div>
)}


{/* Shift Cards */}

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{shifts.map((group, i) => {

const patient = group.patient;
const patientShifts = group.shifts;

const patientName = patient
  ? `${patient.first_name} ${patient.last_name}`
  : "Unknown Patient";

const tasks = parseTasks(patient);


return (

<div
key={i}
className="group relative bg-gradient-to-b from-[#171717] to-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg hover:shadow-[0_8px_30px_rgba(167,55,55,0.12)] hover:border-[#a73737]/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
>

<div className="absolute top-0 right-0 w-24 h-24 bg-[#a73737]/5 rounded-full blur-2xl -mr-8 -mt-8"></div>


{/* Header */}

<div className="mb-4">

<h2 className="text-lg font-semibold text-gray-100">
{patientName}
</h2>

<div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
Confirmed Visits
</div>

</div>


{/* Time */}

<div className="mb-5">

<div className="text-gray-400 text-xs uppercase tracking-wider mb-2">
Visit Time
</div>

{patientShifts.map((visit, visitIndex) => (

<div
  key={visitIndex}
  className="flex justify-between items-center bg-[#2a2a2a]/40 p-3 rounded-lg mb-2"
>

<div className="text-xs font-semibold text-gray-300 bg-[#1f1f1f] px-2 py-1 rounded-md">
{visit.day}
</div>

<div>
{visit.slots?.map((slot, idx) => (
<div key={idx} className="text-[#a73737] font-medium text-sm">
{formatTime(slot.start)} - {formatTime(slot.end)}
</div>
))}
</div>

</div>

))}

</div>


{/* Patient Info */}

<div className="grid grid-cols-2 gap-4 text-sm mb-5">

<div>
<div className="text-gray-500 text-xs uppercase mb-1">Age</div>
<div className="text-gray-300">
{calculateAge(patient?.dob)}
</div>
</div>

<div>
<div className="text-gray-500 text-xs uppercase mb-1">Gender</div>
<div className="text-gray-300">
{patient?.gender || "—"}
</div>
</div>

<div>
<div className="text-gray-500 text-xs uppercase mb-1">Phone</div>
<div className="text-gray-300">
{patient?.phone || "—"}
</div>
</div>

<div>
<div className="text-gray-500 text-xs uppercase mb-1">Condition</div>
<div className="text-gray-300">
{patient?.condition || "—"}
</div>
</div>

</div>


{/* Address */}

<div className="mb-5">

<div className="text-gray-500 text-xs uppercase mb-1">
Address
</div>

<div className="text-gray-300 text-sm">
{patient?.address || "—"}
</div>

</div>


{/* Tasks */}

{tasks.length > 0 && (

<div className="mb-5">

<div className="text-gray-500 text-xs uppercase mb-2">
Care Tasks
</div>

<div className="flex flex-wrap gap-2">

{tasks.map((task, idx) => (

<div
key={idx}
className="text-xs bg-[#a73737]/10 text-[#a73737] px-3 py-1 rounded-md"
>
{task}
</div>

))}

</div>

</div>

)}


{/* Notes */}

{patient?.notes && (

<div className="pt-4 border-t border-[#2a2a2a]">

<div className="text-gray-500 text-xs uppercase mb-2">
Notes
</div>

<div className="text-gray-300 text-sm">
{patient.notes}
</div>

</div>

)}

</div>

);

})}

</div>

</div>

);

}