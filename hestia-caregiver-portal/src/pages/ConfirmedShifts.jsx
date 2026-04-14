import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ConfirmedShifts() {

const [shifts, setShifts] = useState([]);
const [loading, setLoading] = useState(true);

function formatTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  let h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${minute} ${ampm}`;
}

function calculateAge(dob) {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function parseTasks(patient) {
  if (!patient) return [];
  if (Array.isArray(patient.tasks)) return patient.tasks;
  if (typeof patient.tasks === "string") {
    try {
      const parsed = JSON.parse(patient.tasks);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return patient.tasks.split(",").map(t => t.trim());
  }
  if (patient.care_type) return [patient.care_type];
  return [];
}

function groupShiftsByPatient(assignments) {
  const grouped = {};
  assignments.forEach(shift => {
    const patientId = shift.patient_id;
    if (!grouped[patientId]) grouped[patientId] = { patient: shift.patient, shifts: [] };
    grouped[patientId].shifts.push({ day: shift.day_of_week, slots: shift.slots });
  });
  return Object.values(grouped);
}

useEffect(() => { loadConfirmedShifts(); }, []);

async function loadConfirmedShifts() {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: caregiver } = await supabase.from("caregivers").select("*").eq("auth_id", user.id).single();
    if (!caregiver) return;

    const { data: assignments } = await supabase.from("schedule_assignments")
      .select("*").eq("caregiver_id", caregiver.id).eq("status", "accepted");

    if (!assignments || assignments.length === 0) { setShifts([]); setLoading(false); return; }

    const patientIds = [...new Set(assignments.map(a => a.patient_id))];
    const { data: patients } = await supabase.from("patients").select("*").in("id", patientIds);

    const patientMap = {};
    (patients || []).forEach(p => { patientMap[p.id] = p; });

    const combined = assignments.map(a => ({ ...a, patient: patientMap[a.patient_id] }));
    setShifts(groupShiftsByPatient(combined));
  } catch (err) {
    console.error("Error loading confirmed shifts", err);
  }
  setLoading(false);
}

return (
  <div className="max-w-4xl mx-auto">

    {/* Header */}
    <div className="mb-7">
      <h1 className="text-2xl font-bold text-[#2C1810]">Confirmed Visits</h1>
      <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
        Everything you need before arriving to a visit.
      </p>
    </div>

    {/* Loading */}
    {loading && (
      <div className="flex items-center justify-center h-48 rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C41858] border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "#8C6B60" }}>Loading your confirmed visits...</p>
        </div>
      </div>
    )}

    {/* Empty state */}
    {!loading && shifts.length === 0 && (
      <div className="text-center py-16 rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#FFF0F4" }}>
          <svg className="w-7 h-7" fill="none" stroke="#C41858" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-[#2C1810]">No confirmed visits yet</p>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>Accept a match to see your visits here.</p>
      </div>
    )}

    {/* Visit Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {shifts.map((group, i) => {
        const patient = group.patient;
        const patientShifts = group.shifts;
        const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Unknown Patient";
        const initials = patient
          ? `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase()
          : "?";
        const tasks = parseTasks(patient);

        return (
          <div key={i} className="bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            style={{ borderColor: "#EDE3DC", boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>

            {/* Patient header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F5EDE8", background: "#FFF8F5" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #C41858, #8B1035)" }}>
                  {initials}
                </div>
                <div>
                  <h2 className="font-bold text-[#2C1810]">{patientName}</h2>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#C41858" }}>Confirmed Visits</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Visit times */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#B59890" }}>Visit Times</p>
                <div className="space-y-1.5">
                  {patientShifts.map((visit, visitIndex) => (
                    <div key={visitIndex} className="flex justify-between items-center px-3 py-2 rounded-xl"
                      style={{ background: "#FAF7F4" }}>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(196,24,88,0.09)", color: "#C41858" }}>
                        {visit.day}
                      </span>
                      <div className="text-right">
                        {visit.slots?.map((slot, idx) => (
                          <p key={idx} className="text-sm font-semibold text-[#2C1810]">
                            {formatTime(slot.start)} &ndash; {formatTime(slot.end)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Age", value: calculateAge(patient?.dob) },
                  { label: "Gender", value: patient?.gender || "—" },
                  { label: "Phone", value: patient?.phone || "—" },
                  { label: "Condition", value: patient?.condition || "—" },
                ].map((item) => (
                  <div key={item.label} className="px-3 py-2.5 rounded-xl" style={{ background: "#FAF7F4" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#B59890" }}>{item.label}</p>
                    <p className="text-sm font-medium text-[#2C1810] truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              {patient?.address && (
                <div className="px-3 py-2.5 rounded-xl" style={{ background: "#FAF7F4" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#B59890" }}>Address</p>
                  <p className="text-sm text-[#2C1810]">{patient.address}</p>
                </div>
              )}

              {/* Care Tasks */}
              {tasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#B59890" }}>Care Tasks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tasks.map((task, idx) => (
                      <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(232,149,27,0.12)", color: "#C47B10", border: "1px solid rgba(232,149,27,0.2)" }}>
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {patient?.notes && (
                <div className="pt-3 border-t" style={{ borderColor: "#F5EDE8" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#B59890" }}>Notes</p>
                  <p className="text-sm" style={{ color: "#7A5C52" }}>{patient.notes}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

}
