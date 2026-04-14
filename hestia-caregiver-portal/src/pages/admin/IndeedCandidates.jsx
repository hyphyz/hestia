import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";

// --- Geographic Math & Caching ---
const ZIP_API_CACHE = {};

async function fetchZipCoord(zip) {
  if (!zip) return null;
  const clean = String(zip).trim().slice(0, 5);
  if (ZIP_API_CACHE[clean]) return ZIP_API_CACHE[clean];
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.places && json.places.length > 0) {
      const coords = { lat: parseFloat(json.places[0].latitude), lng: parseFloat(json.places[0].longitude) };
      ZIP_API_CACHE[clean] = coords;
      return coords;
    }
  } catch (err) {
    console.error(`Failed to fetch coords for ${clean}`);
  }
  return null;
}

function calculateMiles(a, b) {
  if (!a || !b) return 999;
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLon = (b.lng - a.lng) * (Math.PI / 180);
  const lat1 = a.lat * (Math.PI / 180);
  const lat2 = b.lat * (Math.PI / 180);
  const A = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}

function getDynamicDistanceTier(miles) {
  if (miles === 999) return "Unknown";
  if (miles <= 10) return 10;
  if (miles <= 20) return 20;
  if (miles <= 30) return 30;
  return 35;
}

const PIPELINE_STATUSES = ["New", "Reviewed", "Contacted", "Interviewing", "Offer", "Rejected"];

export default function IndeedCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [languageFilter, setLanguageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [targetZip, setTargetZip] = useState("");
  const [activeTargetZip, setActiveTargetZip] = useState("");
  const [dynamicDistances, setDynamicDistances] = useState({});

  useEffect(() => { fetchDatabase(); }, []);

  async function fetchDatabase() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("indeed_candidates").select("*").eq("is_archived", false);
      if (error) throw error;
      setCandidates(data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateCandidate = async (candidate, updates) => {
    setIsSaving(true);
    try {
      const matchColumn = candidate.id ? "id" : "full_name";
      const matchValue = candidate.id ? candidate.id : candidate.full_name;
      const { data, error } = await supabase.from("indeed_candidates")
        .update(updates).eq(matchColumn, matchValue).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update Blocked! Check your Supabase RLS settings.");
      setCandidates(prev => prev.map(c => (c[matchColumn] === matchValue) ? { ...c, ...updates } : c));
      setTimeout(() => setIsSaving(false), 800);
    } catch (err) {
      console.error("Supabase Update Failed:", err);
      alert("Database Error: " + err.message);
      setIsSaving(false);
    }
  };

  const handleSaveSidebarProfile = () => {
    if (!selectedCandidate) return;
    handleUpdateCandidate(selectedCandidate, {
      pipeline_status: selectedCandidate.pipeline_status || "New",
      primary_ethnicity: selectedCandidate.primary_ethnicity || "none",
      experience_summary: selectedCandidate.experience_summary || ""
    });
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase.from("indeed_candidates")
        .update({ pipeline_status: newStatus }).in("id", idsArray);
      if (error) throw error;
      setCandidates(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, pipeline_status: newStatus } : c));
      setSelectedIds(new Set());
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkHide = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    try {
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase.from("indeed_candidates")
        .update({ is_archived: true }).in("id", idsArray);
      if (error) throw error;
      setCandidates(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (err) {
      alert("Failed to hide candidates.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipSearch = async () => {
    if (targetZip.length !== 5) return;
    setIsCalculating(true);
    setActiveTargetZip(targetZip);
    const targetCoords = await fetchZipCoord(targetZip);
    if (!targetCoords) {
      alert("Invalid Zip Code or API unreachable.");
      setIsCalculating(false);
      return;
    }
    const uniqueZips = [...new Set(candidates.map(c => c.zip_code).filter(Boolean))];
    await Promise.all(uniqueZips.map(z => fetchZipCoord(z)));
    const newDistances = {};
    candidates.forEach(c => {
      if (!c.zip_code) { newDistances[c.id] = 999; return; }
      const cCoords = ZIP_API_CACHE[c.zip_code];
      newDistances[c.id] = calculateMiles(targetCoords, cCoords);
    });
    setDynamicDistances(newDistances);
    setIsCalculating(false);
  };

  const processedCandidates = useMemo(() => {
    let filtered = candidates;
    if (languageFilter !== "All") filtered = filtered.filter(c => c.primary_ethnicity?.toLowerCase() === languageFilter.toLowerCase());
    if (statusFilter !== "All") filtered = filtered.filter(c => (c.pipeline_status || "New") === statusFilter);
    return [...filtered].sort((a, b) => {
      const distA = dynamicDistances[a.id] ?? a.distance_tier;
      const distB = dynamicDistances[b.id] ?? b.distance_tier;
      const tierA = getDynamicDistanceTier(distA);
      const tierB = getDynamicDistanceTier(distB);
      if (tierA !== tierB) {
        if (tierA === "Unknown") return 1;
        if (tierB === "Unknown") return -1;
        return tierA - tierB;
      }
      if (a.match_score !== b.match_score) return b.match_score - a.match_score;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [candidates, languageFilter, statusFilter, dynamicDistances]);

  const availableLanguages = useMemo(() => {
    const langs = new Set(candidates.map(c => c.primary_ethnicity).filter(Boolean));
    return ["All", ...Array.from(langs).map(l => l.charAt(0).toUpperCase() + l.slice(1))];
  }, [candidates]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === processedCandidates.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(processedCandidates.map(c => c.id)));
  };

  const getDistanceStyle = (tier) => {
    switch (tier) {
      case 10: return { bg: "rgba(34,166,118,0.1)", color: "#22A676", border: "rgba(34,166,118,0.2)" };
      case 20: return { bg: "rgba(107,91,154,0.1)", color: "#6B5B9A", border: "rgba(107,91,154,0.2)" };
      case 30: return { bg: "rgba(232,149,27,0.1)", color: "#C47B10", border: "rgba(232,149,27,0.2)" };
      default: return { bg: "rgba(196,24,88,0.08)", color: "#C41858", border: "rgba(196,24,88,0.18)" };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "#22A676";
    if (score >= 70) return "#C47B10";
    if (score > 0) return "#7A5C52";
    return "#C4A898";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Offer": case "Hired": return { bg: "rgba(34,166,118,0.1)", color: "#22A676", border: "rgba(34,166,118,0.2)" };
      case "Interviewing": return { bg: "rgba(107,91,154,0.1)", color: "#6B5B9A", border: "rgba(107,91,154,0.2)" };
      case "Rejected": return { bg: "rgba(196,24,88,0.08)", color: "#C41858", border: "rgba(196,24,88,0.18)" };
      case "Contacted": return { bg: "rgba(232,149,27,0.1)", color: "#C47B10", border: "rgba(232,149,27,0.2)" };
      default: return { bg: "#F5EDE8", color: "#7A5C52", border: "#EDE3DC" };
    }
  };

  const filterSelectStyle = {
    background: "#FAF3EF",
    border: "1px solid #EDE3DC",
    color: "#2C1810",
    outline: "none",
  };

  return (
    <div className="max-w-7xl mx-auto w-full">

      {/* Header & Filters */}
      <div className="bg-white rounded-2xl border p-5 mb-5 flex flex-wrap justify-between items-end gap-4"
        style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">Master Lead Roster</h1>
          <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
            {processedCandidates.length} candidates visible
            {activeTargetZip && ` · Sorted by proximity to ${activeTargetZip}`}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Zip Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#B59890" }}>Client Zip</label>
            <div className="flex gap-2">
              <input
                type="text" maxLength="5" placeholder="90210"
                value={targetZip}
                onChange={(e) => setTargetZip(e.target.value.replace(/\D/g, ''))}
                className="w-24 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C41858]/25"
                style={filterSelectStyle}
              />
              <button
                onClick={handleZipSearch}
                disabled={isCalculating || targetZip.length !== 5}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C41858, #8B1035)" }}
              >
                {isCalculating ? "..." : "Apply"}
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#B59890" }}>Pipeline Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm w-40 cursor-pointer"
              style={filterSelectStyle}>
              <option value="All">All Statuses</option>
              {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#B59890" }}>Language</label>
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm w-40 cursor-pointer"
              style={filterSelectStyle}>
              {availableLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 px-5 py-3.5 rounded-2xl border flex items-center justify-between"
          style={{ background: "rgba(232,149,27,0.07)", borderColor: "rgba(232,149,27,0.25)" }}>
          <span className="text-sm font-semibold" style={{ color: "#C47B10" }}>
            {selectedIds.size} candidate{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <select
              onChange={(e) => { if (e.target.value) { handleBulkStatusChange(e.target.value); e.target.value = ""; } }}
              className="px-3 py-1.5 rounded-xl text-xs cursor-pointer"
              style={filterSelectStyle}
            >
              <option value="">Move to Stage...</option>
              {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkHide}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50"
              style={{ background: "rgba(196,24,88,0.07)", color: "#C41858", borderColor: "rgba(196,24,88,0.2)" }}
            >
              {isLoading ? "Archiving..." : "Hide Selected"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-5 py-3.5 rounded-2xl border text-sm"
          style={{ background: "rgba(196,24,88,0.07)", borderColor: "rgba(196,24,88,0.2)", color: "#C41858" }}>
          Error loading candidates: {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden mb-10"
        style={{ borderColor: "#EDE3DC", boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ background: "#FAF3EF", borderBottom: "1px solid #EDE3DC" }}>
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={processedCandidates.length > 0 && selectedIds.size === processedCandidates.length}
                    onChange={toggleAll}
                    className="rounded cursor-pointer"
                    style={{ accentColor: "#C41858" }}
                  />
                </th>
                {["Candidate", "Contact", "Location", "Profile", "Status"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#B59890" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-sm" style={{ color: "#8C6B60" }}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#C41858] border-t-transparent animate-spin" />
                      Loading roster...
                    </div>
                  </td>
                </tr>
              ) : processedCandidates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-sm" style={{ color: "#8C6B60" }}>
                    No candidates match these filters.
                  </td>
                </tr>
              ) : (
                processedCandidates.map((candidate) => {
                  const distMiles = dynamicDistances[candidate.id] ?? null;
                  const displayTier = distMiles !== null ? getDynamicDistanceTier(distMiles) : candidate.distance_tier;
                  const displayMiles = distMiles !== null && distMiles !== 999 ? distMiles.toFixed(1) : null;
                  const currentStatus = candidate.pipeline_status || "New";
                  const distStyle = getDistanceStyle(displayTier);
                  const statusStyle = getStatusStyle(currentStatus);

                  return (
                    <tr key={candidate.id || candidate.full_name}
                      className="border-t transition-colors"
                      style={{
                        borderColor: "#F5EDE8",
                        background: selectedIds.has(candidate.id) ? "rgba(196,24,88,0.03)" : "transparent"
                      }}
                      onMouseEnter={(e) => { if (!selectedIds.has(candidate.id)) e.currentTarget.style.background = "#FFF8F5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = selectedIds.has(candidate.id) ? "rgba(196,24,88,0.03)" : "transparent"; }}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(candidate.id)}
                          onChange={() => toggleSelection(candidate.id)}
                          className="rounded cursor-pointer"
                          style={{ accentColor: "#C41858" }}
                        />
                      </td>

                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setSelectedCandidate({ ...candidate, dynamicTier: displayTier, dynamicMiles: displayMiles })}
                          className="font-semibold text-left transition-colors hover:opacity-75"
                          style={{ color: "#C41858" }}
                        >
                          {candidate.full_name}
                        </button>
                      </td>

                      <td className="px-5 py-3.5">
                        {candidate.phone
                          ? <p className="text-sm font-medium text-[#2C1810]">{candidate.phone}</p>
                          : <p className="text-xs italic" style={{ color: "#C4A898" }}>No Phone</p>
                        }
                        <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "#8C6B60" }}>
                          {candidate.email || "No Email"}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 text-xs rounded-lg font-semibold border inline-block"
                          style={{ background: distStyle.bg, color: distStyle.color, borderColor: distStyle.border }}>
                          {displayTier === "Unknown" ? "Unknown" : `${displayTier} mi radius`}
                        </span>
                        <p className="text-xs mt-1" style={{ color: "#B59890" }}>
                          ZIP {candidate.zip_code || "—"}
                          {displayMiles && <span style={{ color: "#6B5B9A" }}> · {displayMiles} mi</span>}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-xl font-bold" style={{ color: getScoreColor(candidate.match_score) }}>
                          {candidate.match_score > 0 ? `${candidate.match_score}%` : "—"}
                        </p>
                        <p className="text-xs mt-0.5 capitalize" style={{ color: "#B59890" }}>
                          {candidate.primary_ethnicity !== "none" ? candidate.primary_ethnicity : "English"}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 text-xs rounded-lg font-semibold border inline-block"
                          style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Detail Sidebar */}
      {selectedCandidate && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity"
            style={{ background: "rgba(44, 24, 16, 0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedCandidate(null)}
          />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col overflow-y-auto"
            style={{
              background: "#fff",
              borderLeft: "1px solid #EDE3DC",
              boxShadow: "-8px 0 40px rgba(44,24,16,0.12)",
              animation: "slideInRight 0.3s ease-out"
            }}
          >
            {/* Sidebar header */}
            <div className="px-7 pt-7 pb-5 border-b" style={{ borderColor: "#F5EDE8", background: "#FFF8F5" }}>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-xl border transition-colors"
                style={{ borderColor: "#EDE3DC", color: "#8C6B60", background: "#fff" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-[#2C1810] pr-10">{selectedCandidate.full_name}</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "#C41858" }}>
                {selectedCandidate.job_applied_for || "Applicant"}
              </p>
            </div>

            <div className="flex-1 px-7 py-6 space-y-5">

              {/* Pipeline Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#B59890" }}>Pipeline Status</label>
                <select
                  value={selectedCandidate.pipeline_status || "New"}
                  onChange={(e) => setSelectedCandidate({ ...selectedCandidate, pipeline_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C41858]/25"
                  style={{ background: "#FAF3EF", border: "1px solid #EDE3DC", color: "#2C1810" }}
                >
                  {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#B59890" }}>Primary Language</label>
                <input
                  type="text"
                  value={selectedCandidate.primary_ethnicity === "none" ? "" : selectedCandidate.primary_ethnicity}
                  placeholder="e.g., Spanish, Tagalog..."
                  onChange={(e) => setSelectedCandidate({ ...selectedCandidate, primary_ethnicity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C41858]/25"
                  style={{ background: "#FAF3EF", border: "1px solid #EDE3DC", color: "#2C1810" }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#B59890" }}>
                  Experience / Internal Notes
                </label>
                <textarea
                  rows={6}
                  value={selectedCandidate.experience_summary || ""}
                  onChange={(e) => setSelectedCandidate({ ...selectedCandidate, experience_summary: e.target.value })}
                  placeholder="Add interview notes or relevant experience here..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C41858]/25"
                  style={{ background: "#FAF3EF", border: "1px solid #EDE3DC", color: "#2C1810" }}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSidebarProfile}
                disabled={isSaving}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                style={{
                  background: isSaving
                    ? "rgba(34,166,118,0.15)"
                    : "linear-gradient(135deg, #C41858, #8B1035)",
                  color: isSaving ? "#22A676" : "#fff",
                  boxShadow: isSaving ? "none" : "0 4px 14px rgba(196, 24, 88, 0.3)"
                }}
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : "Save Profile Changes"}
              </button>
            </div>

            {/* Indeed link */}
            <div className="px-7 pb-7 pt-3 border-t" style={{ borderColor: "#F5EDE8" }}>
              <a
                href={`https://employers.indeed.com/j#candidates?q=${encodeURIComponent(selectedCandidate.email || "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm border transition-all gap-2"
                style={{ borderColor: "#EDE3DC", color: "#2C1810", background: "#FAF7F4" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Indeed Dashboard
              </a>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
