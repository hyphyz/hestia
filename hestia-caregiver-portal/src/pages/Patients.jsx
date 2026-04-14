import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { assignSchedules } from "../schedulerLogic";

export default function Patients() {

const [patients, setPatients] = useState({});
const [caregivers, setCaregivers] = useState({});
const [matches, setMatches] = useState({});
const [loading, setLoading] = useState(false);
const [currentUserId, setCurrentUserId] = useState(null);
const [myCaregiverDbId, setMyCaregiverDbId] = useState(null);
const [assignmentIndex, setAssignmentIndex] = useState({});

useEffect(() => { runScheduler(); }, []);

async function loadData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) setCurrentUserId(user.id);

  const [patientsRes, caregiversRes, assignmentsRes] = await Promise.all([
    supabase.from("patients").select("*"),
    supabase.from("caregivers").select("*"),
    supabase.from("schedule_assignments").select("*")
  ]);

  const patientsData = patientsRes.data || [];
  const caregiversData = caregiversRes.data || [];
  const assignmentsData = assignmentsRes.data || [];

  const patientsObj = {};
  patientsData.forEach(p => { patientsObj[p.id] = p; });

  const caregiversObj = {};
  caregiversData.forEach(c => {
    caregiversObj[c.id] = c;
    if (user && c.auth_id === user.id) setMyCaregiverDbId(c.id);
  });

  const index = {};
  assignmentsData.forEach(a => {
    index[`${a.patient_id}_${a.caregiver_id}_${a.day_of_week}`] = a.status;
  });

  setAssignmentIndex(index);
  setPatients(patientsObj);
  setCaregivers(caregiversObj);

  return { patients: patientsObj, caregivers: caregiversObj, assignments: assignmentsData, assignmentIndex: index };
}

function filterAcceptedSlots(patientsData, assignmentsData) {
  const accepted = assignmentsData.filter(a => a.status === "accepted");
  const updatedPatients = { ...patientsData };
  accepted.forEach(assign => {
    const patient = updatedPatients[assign.patient_id];
    if (!patient) return;
    const schedule = typeof patient.schedule === "string" ? JSON.parse(patient.schedule) : patient.schedule;
    if (!schedule || !schedule[assign.day_of_week]) return;
    schedule[assign.day_of_week] = schedule[assign.day_of_week].filter(slot =>
      !assign.slots?.some(s => s.start === slot.start && s.end === slot.end)
    );
    updatedPatients[assign.patient_id] = { ...patient, schedule };
  });
  return updatedPatients;
}

function getExistingStatus(patientId, caregiverId, day, index) {
  return index[`${patientId}_${caregiverId}_${day}`] || "pending";
}

async function runScheduler() {
  setLoading(true);
  try {
    const data = await loadData();
    const filteredPatients = filterAcceptedSlots(data.patients, data.assignments);
    const result = await assignSchedules(filteredPatients, data.caregivers);
    const assignmentsResult = result.assignments;
    const matchesWithStatus = {};
    for (const patientId in assignmentsResult) {
      matchesWithStatus[patientId] = {};
      for (const day in assignmentsResult[patientId]) {
        matchesWithStatus[patientId][day] = assignmentsResult[patientId][day].map(shift => ({
          ...shift,
          status: getExistingStatus(patientId, shift.caregiver, day, data.assignmentIndex)
        }));
      }
    }
    setMatches(matchesWithStatus);
  } catch (err) {
    console.error("Scheduler error", err);
  }
  setLoading(false);
}

async function handleStatusChange(patientId, day, caregiverId, newStatus, matchedSlots) {
  setMatches(prev => ({ ...prev }));
  try {
    const { error } = await supabase.from("schedule_assignments").upsert({
      patient_id: patientId, caregiver_id: caregiverId, day_of_week: day,
      status: newStatus, slots: matchedSlots, updated_at: new Date().toISOString()
    }, { onConflict: "patient_id, caregiver_id, day_of_week" });
    if (error) { alert(error.message); return; }
    await runScheduler();
  } catch (err) {
    console.error("Status update error", err);
  }
}

const myMatchedPatientIds = Object.keys(matches).filter(patientId =>
  Object.keys(matches[patientId]).some(day =>
    matches[patientId][day].some(shift => shift.caregiver === myCaregiverDbId)
  )
);

return (
  <div className="max-w-4xl mx-auto">

    {/* Header */}
    <div className="flex justify-between items-start mb-7">
      <div>
        <h1 className="text-2xl font-bold text-[#2C1810]">Schedule Matches</h1>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
          Review and confirm your assigned patient visits.
        </p>
      </div>
      <button
        onClick={runScheduler}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #C41858, #8B1035)",
          boxShadow: "0 4px 14px rgba(196, 24, 88, 0.3)"
        }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Running...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Find My Matches
          </>
        )}
      </button>
    </div>

    {/* Empty state */}
    {myCaregiverDbId && myMatchedPatientIds.length === 0 && !loading && (
      <div className="text-center py-16 rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#FFF0F4" }}>
          <svg className="w-7 h-7" fill="none" stroke="#C41858" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-semibold text-[#2C1810]">No matches found</p>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>Check back after updating your availability.</p>
      </div>
    )}

    {/* Patient Match Cards */}
    <div className="space-y-5">
      {myMatchedPatientIds.map(patientId => {
        const patient = patients[patientId];
        const patientName = `${patient.first_name} ${patient.last_name}`;
        const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();

        return (
          <div key={patientId} className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: "#EDE3DC", boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>

            {/* Patient header */}
            <div className="px-6 py-4 border-b flex items-center gap-3"
              style={{ borderColor: "#F5EDE8", background: "#FFF8F5" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, #E8951B, #C47B10)" }}>
                {initials}
              </div>
              <div>
                <h2 className="font-bold text-[#2C1810]">{patientName}</h2>
                <p className="text-xs font-medium" style={{ color: "#8C6B60" }}>
                  {patient.condition || "Patient"} &bull; {patient.address || patient.city || ""}
                </p>
              </div>
            </div>

            {/* Shifts */}
            <div className="px-6 py-4 space-y-4">
              {Object.keys(matches[patientId]).map(day => {
                const myShifts = matches[patientId][day].filter(shift => shift.caregiver === myCaregiverDbId);
                if (myShifts.length === 0) return null;

                return (
                  <div key={day}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#B59890" }}>{day}</p>
                    <div className="space-y-2">
                      {myShifts.map((shift, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3 rounded-xl border"
                          style={{ background: "#FAF7F4", borderColor: "#EDE3DC" }}>
                          <div>
                            {shift.slots.map((slot, idx) => (
                              <p key={idx} className="text-sm font-semibold text-[#2C1810]">
                                {slot.start} &ndash; {slot.end}
                              </p>
                            ))}
                          </div>

                          <div className="flex gap-2 items-center">
                            {shift.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(patientId, day, shift.caregiver, "rejected", shift.slots)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                                  style={{ borderColor: "#F5DDD4", color: "#C41858", background: "#FFF5F2" }}
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleStatusChange(patientId, day, shift.caregiver, "accepted", shift.slots)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                                  style={{
                                    background: "linear-gradient(135deg, #C41858, #8B1035)",
                                    boxShadow: "0 2px 8px rgba(196,24,88,0.3)"
                                  }}
                                >
                                  Accept
                                </button>
                              </>
                            )}
                            {shift.status === "accepted" && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "rgba(34,166,118,0.1)", color: "#22A676" }}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmed
                              </span>
                            )}
                            {shift.status === "rejected" && (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "#FFF5F2", color: "#C41858" }}>
                                Declined
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

}
