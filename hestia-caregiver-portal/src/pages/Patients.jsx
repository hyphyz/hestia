import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { assignSchedules } from "../schedulerLogic";

export default function Patients() {

// Anchor: Core State
const [patients, setPatients] = useState({});
const [caregivers, setCaregivers] = useState({});
const [matches, setMatches] = useState({});
const [loading, setLoading] = useState(false);
const [currentUserId, setCurrentUserId] = useState(null);
const [myCaregiverDbId, setMyCaregiverDbId] = useState(null);

// Anchor: Assignment Index (10x faster lookups)
const [assignmentIndex, setAssignmentIndex] = useState({});

useEffect(() => {
  runScheduler();
}, []);


// Anchor: Load Data From Supabase And Return Fresh Objects
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

// Anchor: Convert Patients To Object Map
  const patientsObj = {};

  patientsData.forEach(p => {
    patientsObj[p.id] = p;
  });

// Anchor: Convert Caregivers To Object Map
  const caregiversObj = {};

  caregiversData.forEach(c => {

    caregiversObj[c.id] = c;

    if (user && c.auth_id === user.id) {
      setMyCaregiverDbId(c.id);
    }

  });

// Anchor: Build Assignment Index (O(1) lookups instead of array scans)
  const index = {};

  assignmentsData.forEach(a => {

    const key = `${a.patient_id}_${a.caregiver_id}_${a.day_of_week}`;

    index[key] = a.status;

  });

  setAssignmentIndex(index);
  setPatients(patientsObj);
  setCaregivers(caregiversObj);

  return {
    patients: patientsObj,
    caregivers: caregiversObj,
    assignments: assignmentsData,
    assignmentIndex: index
  };

}


// Anchor: Remove Accepted Shifts From Scheduler Input
function filterAcceptedSlots(patientsData, assignmentsData) {

  const accepted = assignmentsData.filter(a => a.status === "accepted");

  const updatedPatients = { ...patientsData };

  accepted.forEach(assign => {

    const patient = updatedPatients[assign.patient_id];

    if (!patient) return;

    const schedule = typeof patient.schedule === "string"
      ? JSON.parse(patient.schedule)
      : patient.schedule;

    if (!schedule || !schedule[assign.day_of_week]) return;

    schedule[assign.day_of_week] = schedule[assign.day_of_week].filter(slot => {

      return !assign.slots?.some(s =>
        s.start === slot.start && s.end === slot.end
      );

    });

    updatedPatients[assign.patient_id] = {
      ...patient,
      schedule
    };

  });

  return updatedPatients;

}


// Anchor: Fast Status Lookup
function getExistingStatus(patientId, caregiverId, day, index) {

  const key = `${patientId}_${caregiverId}_${day}`;

  return index[key] || "pending";

}


// Anchor: Run Scheduler
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

        matchesWithStatus[patientId][day] = assignmentsResult[patientId][day].map(

          shift => ({

            ...shift,

            status: getExistingStatus(patientId, shift.caregiver, day, data.assignmentIndex)

          })

        );

      }

    }

    setMatches(matchesWithStatus);

  } catch (err) {

    console.error("Scheduler error", err);

  }

  setLoading(false);

}


// Anchor: Accept Or Reject Shift
async function handleStatusChange(patientId, day, caregiverId, newStatus, matchedSlots) {

  setMatches(prev => ({ ...prev }));

  try {

    const { error } = await supabase
      .from("schedule_assignments")
      .upsert({

        patient_id: patientId,
        caregiver_id: caregiverId,
        day_of_week: day,
        status: newStatus,
        slots: matchedSlots,
        updated_at: new Date().toISOString()

      }, {
        onConflict: "patient_id, caregiver_id, day_of_week"
      });

    if (error) {

      alert(error.message);

      return;

    }

    await runScheduler();

  } catch (err) {

    console.error("Status update error", err);

  }

}


// Anchor: Filter Matches For Current Caregiver
const myMatchedPatientIds = Object.keys(matches).filter(patientId => {

  return Object.keys(matches[patientId]).some(day =>

    matches[patientId][day].some(shift =>
      shift.caregiver === myCaregiverDbId
    )

  );

});


return (

<div className="max-w-7xl mx-auto py-6 font-['Inter']">

{/* Header */}

<div className="flex justify-between items-center mb-10">

<div>

<h1 className="text-3xl font-bold text-gray-100 tracking-tight">
My Schedule Matches
</h1>

<p className="text-gray-400 text-sm mt-1">
Review and confirm your assigned patient visits.
</p>

</div>

<button
onClick={runScheduler}
disabled={loading}
className="bg-[#a73737] hover:bg-[#912e2e] text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-[0_8px_30px_rgba(167,55,55,0.25)]"
>
{loading ? "Running..." : "Find My Matches"}
</button>

</div>


{myCaregiverDbId && myMatchedPatientIds.length === 0 && (

<div className="text-gray-400">
No matches found
</div>

)}


{myMatchedPatientIds.map(patientId => {

const patient = patients[patientId];

const patientName = `${patient.first_name} ${patient.last_name}`;

return (

<div
key={patientId}
className="group relative bg-gradient-to-b from-[#171717] to-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg mb-6 overflow-hidden"
>

<div className="absolute top-0 right-0 w-24 h-24 bg-[#a73737]/5 rounded-full blur-2xl -mr-8 -mt-8"></div>

<h2 className="text-xl text-gray-100 mb-6 font-semibold">
{patientName}
</h2>


{Object.keys(matches[patientId]).map(day => {

const myShifts = matches[patientId][day].filter(
shift => shift.caregiver === myCaregiverDbId
);

if (myShifts.length === 0) return null;

return (

<div key={day} className="mb-6">

<div className="text-gray-300 font-semibold mb-3 uppercase text-xs tracking-wider">
{day}
</div>


{myShifts.map((shift, i) => (

<div
key={i}
className="flex justify-between items-center bg-[#2a2a2a]/40 p-4 rounded-xl mb-3 border border-[#2a2a2a] hover:border-[#a73737]/40 transition-all"
>

<div>

{shift.slots.map((slot, idx) => (

<div key={idx} className="text-gray-300 text-sm">
{slot.start} - {slot.end}
</div>

))}

</div>


<div className="flex gap-3 items-center">

{shift.status === "pending" && (

<>

<button
onClick={() => handleStatusChange(patientId, day, shift.caregiver, "rejected", shift.slots)}
className="text-red-400 hover:text-red-300 text-sm"
>
Decline
</button>

<button
onClick={() => handleStatusChange(patientId, day, shift.caregiver, "accepted", shift.slots)}
className="bg-[#a73737] hover:bg-[#912e2e] text-white px-4 py-2 rounded-lg text-sm transition-all"
>
Accept
</button>

</>

)}

{shift.status === "accepted" && (

<div className="text-green-400 text-sm font-medium">
Confirmed
</div>

)}

{shift.status === "rejected" && (

<div className="text-red-400 text-sm font-medium">
Declined
</div>

)}

</div>

</div>

))}

</div>

);

})}

</div>

);

})}

</div>

);

}