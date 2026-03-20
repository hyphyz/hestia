// schedulerLogic.js
// Async scheduler that fetches zip coordinates via API when needed,
// normalizes DB rows, parses notes, and uses a constrained-first scheduling pass.

const ZIP_COORDS = {
  "90001": { lat: 33.973951, lng: -118.248405 },
  "90002": { lat: 33.949098, lng: -118.246737 },
  "90003": { lat: 33.964131, lng: -118.273089 },
  "90004": { lat: 34.0766, lng: -118.3089 },
  "90005": { lat: 34.0585, lng: -118.3071 }
};

const ZIP_API_CACHE = { ...ZIP_COORDS };

// ---------------- Helper to properly compare time objects ----------------
function doShiftsMatch(cgSlot, patientSlot) {
  if (!cgSlot || !patientSlot) return false;
  // If they are saved as strings (legacy format)
  if (typeof cgSlot === 'string' && typeof patientSlot === 'string') return cgSlot === patientSlot;
  
  // NEW LOGIC: Check if Caregiver availability ENCOMPASSES the patient's needs
  return cgSlot.start <= patientSlot.start && cgSlot.end >= patientSlot.end;
}

// ---------------- Helper to slice caregiver availability ----------------
// If a caregiver has 08:00-17:00, and takes a 10:00-14:00 shift, 
// this returns their remaining hours: [08:00-10:00, 14:00-17:00]
function sliceAvailability(availableSlots, matchedPatientSlots) {
  let currentAvail = [...availableSlots];
  
  for (const match of matchedPatientSlots) {
    let nextAvail = [];
    for (const avail of currentAvail) {
      if (avail.start <= match.start && avail.end >= match.end) {
        // The availability encompasses the match, so we slice it
        if (avail.start < match.start) {
          nextAvail.push({ start: avail.start, end: match.start });
        }
        if (avail.end > match.end) {
          nextAvail.push({ start: match.end, end: avail.end });
        }
      } else {
        // Doesn't intersect this specific match, keep it as is
        nextAvail.push(avail);
      }
    }
    currentAvail = nextAvail;
  }
  return currentAvail;
}

// ---------------- Notes parser (lightweight) ----------------
function parseNotes(notes = "") {
  const t = (notes || "").toLowerCase();
  const result = {};

  const LANGS = ["spanish", "mandarin", "cantonese", "hindi", "arabic", "french", "english", "korean"];
  for (const lang of LANGS) if (t.includes(lang)) { result.language = lang[0].toUpperCase() + lang.slice(1); break; }

  if (t.match(/\bfemale\b/) && t.match(/\bcaregiver\b/)) result.gender = "Female";
  if (t.match(/\bmale\b/) && t.match(/\bcaregiver\b/)) result.gender = "Male";
  if (t.match(/\bnon-?binary\b/) || t.match(/\bnon ?binary\b/)) result.gender = "Non-binary";

  const SKILLS_KEYWORDS = [
    ["bathing", "bathing"],
    ["meal prep", "meal prep"],
    ["feeding", "feeding"],
    ["dementia", "dementia"],
    ["lifting", "lifting"],
    ["toileting", "toileting"],
    ["medication", "medication"],
    ["wound", "wound care"],
    ["iv", "iv"]
  ];
  const skills = new Set();
  for (const [k, name] of SKILLS_KEYWORDS) if (t.includes(k)) skills.add(name);
  if (skills.size) result.required_skills = Array.from(skills);

  if (t.includes("no smoker") || t.includes("no smokers")) result.no_smokers = true;

  return result;
}

// ------------ Utility helpers ------------
function tryParseJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function splitToArray(text) {
  if (!text && text !== 0) return [];
  if (Array.isArray(text)) return text;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return String(text).split(",").map(s => s.trim()).filter(Boolean);
}

function cleanZip(zip) {
  if (!zip && zip !== 0) return null;
  return String(zip).trim().slice(0, 5);
}

// -------------- ZIP -> coord API (zippopotam.us) --------------
async function fetchZipCoordFromApi(zip) {
  const z = cleanZip(zip);
  if (!z) return null;
  if (ZIP_API_CACHE[z]) return ZIP_API_CACHE[z];

  const url = `https://api.zippopotam.us/us/${z}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.places && json.places.length) {
      const p = json.places[0];
      const lat = parseFloat(p.latitude);
      const lng = parseFloat(p.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const val = { lat, lng };
        ZIP_API_CACHE[z] = val;
        return val;
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}

// -------------- Distance (Haversine) --------------
function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const A = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * C;
}

// --------------- Normalizers ---------------
function normalizePatients(patientObj = {}) {
  const patientRows = Array.isArray(patientObj) ? patientObj : Object.values(patientObj);
  const map = {};
  for (const p of patientRows) {
    const parsed = parseNotes(p.notes || "");
    const prefs = p.preferences || (typeof p.preferences === "string" ? tryParseJson(p.preferences) : null);

    const meta = {
      id: p.id,
      zip: p.zip || (p.location && p.location.zip) || null,
      care_type: p.care_type || null,
      transport_reimbursement: p.transport_reimbursement ?? 0,
      language: (prefs && prefs.language) || p.language || parsed.language || null,
      gender: (prefs && prefs.gender) || p.gender || parsed.gender || null,
      required_skills: p.tasks || (prefs && prefs.required_skills) || parsed.required_skills || []
    };

    let schedule = {};
    if (p.schedule) schedule = typeof p.schedule === "string" ? tryParseJson(p.schedule) || {} : p.schedule || {};
    map[p.id] = { meta, schedule };
  }
  return map;
}

function normalizeCaregivers(caregiverObj = {}) {
  const caregiverRows = Array.isArray(caregiverObj) ? caregiverObj : Object.values(caregiverObj);
  const map = {};
  for (const c of caregiverRows) {
    const languages = splitToArray(c.languages);
    const skills_not_open_to = splitToArray(c.skills_not_open_to || c.skills_not_open_to_tc || "");
    let schedule = {};
    if (c.available_hours) schedule = typeof c.available_hours === "string" ? tryParseJson(c.available_hours) || {} : c.available_hours || {};
    else if (c.schedule) schedule = typeof c.schedule === "string" ? tryParseJson(c.schedule) || {} : c.schedule || {};

    // FIX: Strictly use the primary 'id' here to match your schema!
    map[c.id] = {
      id: c.id,
      zip: c.zip || (c.location && c.location.zip) || null,
      max_miles: c.max_miles ?? (c.max_travel_miles ?? null),
      transportation: c.transportation || (c.has_transportation ? "Yes" : "No") || "No",
      languages,
      skills_not_open_to,
      gender: c.gender || null,
      schedule,
      max_hours_per_week: c.max_hours_per_week ?? c.max_hours ?? 40,
      initial_load: c.total_assigned_hours ?? c.total_assigned_hours_week ?? 0
    };
  }
  return map;
}

// ----------------- Main scheduler -----------------
export async function assignSchedules(patientData, caregiverData, previousAssignments = {}) {
  const patients = normalizePatients(patientData || []);
  const caregivers = normalizeCaregivers(caregiverData || []);

  const zipSet = new Set();
  for (const pid in patients) { if (patients[pid].meta.zip) zipSet.add(cleanZip(patients[pid].meta.zip)); }
  for (const cid in caregivers) { if (caregivers[cid].zip) zipSet.add(cleanZip(caregivers[cid].zip)); }

  const toFetch = [];
  for (const z of zipSet) {
    if (!ZIP_COORDS[z] && !ZIP_API_CACHE[z]) toFetch.push(z);
  }
  const CONCURRENCY = 10;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(z => fetchZipCoordFromApi(z)));
  }

  const assignments = {};
  const unfilledShifts = {};
  const caregiverLoad = {};

  for (const cgId in caregivers) {
    caregiverLoad[cgId] = Number(caregivers[cgId].initial_load) || 0;
    caregivers[cgId].schedule = caregivers[cgId].schedule || {};
  }

  function hardMatch(patientMeta, caregiver) {
    if (!caregiver) return false;
    if (patientMeta?.care_type && caregiver?.care_type && caregiver?.care_type !== patientMeta.care_type) return false;
    if (patientMeta?.transport_reimbursement > 0 && String(caregiver?.transportation).toLowerCase() !== "yes") return false;
    if (patientMeta?.required_skills && caregiver?.skills_not_open_to?.some(skill => patientMeta.required_skills.includes(skill))) return false;
    return true;
  }

  function distanceMilesByZipLocal(zipA, zipB) {
    const a = ZIP_COORDS[cleanZip(zipA)] || ZIP_API_CACHE[cleanZip(zipA)];
    const b = ZIP_COORDS[cleanZip(zipB)] || ZIP_API_CACHE[cleanZip(zipB)];
    if (!a || !b) return 999;
    return haversineMiles(a, b);
  }

  function distanceScore(patientMeta, caregiver) {
    const dist = distanceMilesByZipLocal(patientMeta?.zip, caregiver?.zip);
    if (dist === 999) return -100;
    const limit = caregiver?.max_miles ?? 15;
    if (dist <= limit) return 50;
    if (dist <= limit + 5) return 30;
    if (dist <= limit + 15) return 10;
    return -100;
  }

  function preferenceScore(patientMeta, caregiver) {
    let score = 0;
    if (patientMeta?.language && caregiver?.languages?.some(l => String(l).toLowerCase() === String(patientMeta.language).toLowerCase())) score += 10;
    if (patientMeta?.gender && caregiver?.gender && caregiver?.gender === patientMeta.gender) score += 5;
    score += distanceScore(patientMeta, caregiver);
    return score;
  }

  function coverageCount(patientSchedule, caregiverSchedule) {
    let count = 0;
    for (const day in patientSchedule) {
      const patientSlots = patientSchedule[day] || [];
      const caregiverSlots = caregiverSchedule?.[day] || [];
      for (const slot of patientSlots) {
        if (caregiverSlots.some(cgSlot => doShiftsMatch(cgSlot, slot))) count++;
      }
    }
    return count;
  }

  const eligibleCounts = {};
  for (const pid in patients) {
    const patient = patients[pid];
    const eligible = Object.keys(caregivers).filter(cid => hardMatch(patient.meta, caregivers[cid]));
    eligibleCounts[pid] = eligible.length;
  }

  const orderedPatientIds = Object.keys(patients).sort((a, b) => {
    const ca = eligibleCounts[a] ?? 0;
    const cb = eligibleCounts[b] ?? 0;
    if (ca !== cb) return ca - cb; 
    const slotsA = Object.values(patients[a].schedule || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
    const slotsB = Object.values(patients[b].schedule || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
    return slotsB - slotsA;
  });

  for (const patientId of orderedPatientIds) {
    const patient = patients[patientId];
    const vip = previousAssignments?.[patientId];

    assignments[patientId] = {};

    const eligible = Object.keys(caregivers).filter(cid => hardMatch(patient.meta, caregivers[cid]));

    const caregiverList = eligible.sort((aId, bId) => {
      const a = caregivers[aId];
      const b = caregivers[bId];
      const coverageA = coverageCount(patient.schedule, a.schedule);
      const coverageB = coverageCount(patient.schedule, b.schedule);
      if (coverageA !== coverageB) return coverageB - coverageA;
      const scoreA = preferenceScore(patient.meta, a) - (caregiverLoad[aId] || 0);
      const scoreB = preferenceScore(patient.meta, b) - (caregiverLoad[bId] || 0);
      return scoreB - scoreA;
    });

    const pool = vip && caregiverList.includes(vip) ? [vip, ...caregiverList.filter(c => c !== vip)] : caregiverList;

    for (const day in patient.schedule) {
      const requiredSlots = patient.schedule[day] || [];
      assignments[patientId][day] = [];
      let remainingSlots = [...requiredSlots];

      for (const caregiverId of pool) {
        if (!remainingSlots.length) break;
        const cg = caregivers[caregiverId];
        const MAX_HOURS = Number(cg.max_hours_per_week ?? 40);
        const currentLoad = caregiverLoad[caregiverId] || 0;
        if (currentLoad >= MAX_HOURS) continue;
        
        const availableSlots = (cg.schedule && cg.schedule[day]) ? [...cg.schedule[day]] : [];
        if (!availableSlots.length) continue;
        
        const capacity = MAX_HOURS - currentLoad;
        
        let matched = remainingSlots.filter(slot => availableSlots.some(avail => doShiftsMatch(avail, slot)));
        if (!matched.length) continue;
        if (matched.length > capacity) matched = matched.slice(0, capacity);
        
        assignments[patientId][day].push({ caregiver: caregiverId, slots: matched });
        
        // NEW LOGIC: Slice the availability perfectly instead of deleting it
        cg.schedule[day] = sliceAvailability(availableSlots, matched);
        // Calculate actual duration for the load
        const hoursMatched = matched.reduce((sum, slot) => {
            const [sH, sM] = slot.start.split(':').map(Number);
            const [eH, eM] = slot.end.split(':').map(Number);
            return sum + ((eH + eM / 60) - (sH + sM / 60));
        }, 0);

        caregiverLoad[caregiverId] = (caregiverLoad[caregiverId] || 0) + hoursMatched;
        
        // Remove the matched slots from the remaining pool
        remainingSlots = remainingSlots.filter(s => !matched.includes(s));
      }

      // Secondary pass
      if (remainingSlots.length > 0) {
        for (const caregiverId of pool) {
          if (!remainingSlots.length) break;
          const cg = caregivers[caregiverId];
          const MAX_HOURS = Number(cg.max_hours_per_week ?? 40);
          const currentLoad = caregiverLoad[caregiverId] || 0;
          if (currentLoad >= MAX_HOURS) continue;
          
          const availableSlots = (cg.schedule && cg.schedule[day]) ? [...cg.schedule[day]] : [];
          if (!availableSlots.length) continue;
          
          const fragment = remainingSlots.filter(slot => availableSlots.some(avail => doShiftsMatch(avail, slot)));
          if (!fragment.length) continue;
          const capacity = MAX_HOURS - currentLoad;
          const limited = fragment.slice(0, capacity);
          
          assignments[patientId][day].push({ caregiver: caregiverId, slots: limited });
          
          // NEW LOGIC: Slice the availability here too
          cg.schedule[day] = sliceAvailability(availableSlots, limited);
          // Calculate actual duration for the load
          // Calculate actual duration for the load in the secondary pass
          const hoursMatched = limited.reduce((sum, slot) => { // Use 'limited' here!
              const [sH, sM] = slot.start.split(':').map(Number);
              const [eH, eM] = slot.end.split(':').map(Number);
              return sum + ((eH + eM / 60) - (sH + sM / 60));
          }, 0);

          caregiverLoad[caregiverId] = (caregiverLoad[caregiverId] || 0) + hoursMatched;
          
          remainingSlots = remainingSlots.filter(s => !limited.includes(s));
        }
      }

      if (remainingSlots.length > 0) {
        if (!unfilledShifts[patientId]) unfilledShifts[patientId] = {};
        unfilledShifts[patientId][day] = remainingSlots;
      }
    }
  }

  return { assignments, caregiverLoad, unfilledShifts };
}