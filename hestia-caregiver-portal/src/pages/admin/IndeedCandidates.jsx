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
      const coords = {
        lat: parseFloat(json.places[0].latitude),
        lng: parseFloat(json.places[0].longitude)
      };
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
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * C;
}

function getDynamicDistanceTier(miles) {
  if (miles === 999) return "Unknown";
  if (miles <= 10) return 10;
  if (miles <= 20) return 20;
  if (miles <= 30) return 30;
  return 35;
}

export default function IndeedCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [languageFilter, setLanguageFilter] = useState("All");
  
  const [targetZip, setTargetZip] = useState("");
  const [activeTargetZip, setActiveTargetZip] = useState("");
  const [dynamicDistances, setDynamicDistances] = useState({});

  useEffect(() => {
    async function fetchDatabase() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from("indeed_candidates").select("*");
        if (error) throw error;
        setCandidates(data);
      } catch (err) {
        console.error("Error fetching candidates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDatabase();
  }, []);

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

    const newDistances = {};
    const uniqueZips = [...new Set(candidates.map(c => c.zip_code).filter(Boolean))];
    
    await Promise.all(uniqueZips.map(z => fetchZipCoord(z)));

    candidates.forEach(c => {
      if (!c.zip_code) {
        newDistances[c.id] = 999;
      } else {
        const cCoords = ZIP_API_CACHE[c.zip_code];
        newDistances[c.id] = calculateMiles(targetCoords, cCoords);
      }
    });

    setDynamicDistances(newDistances);
    setIsCalculating(false);
  };

  const processedCandidates = useMemo(() => {
    let filtered = candidates;
    if (languageFilter !== "All") {
      filtered = candidates.filter(c => c.primary_ethnicity?.toLowerCase() === languageFilter.toLowerCase());
    }

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
      if (a.match_score !== b.match_score) {
        return b.match_score - a.match_score; 
      }
      return a.full_name.localeCompare(b.full_name);
    });
  }, [candidates, languageFilter, dynamicDistances]);

  const availableLanguages = useMemo(() => {
    const langs = new Set(candidates.map(c => c.primary_ethnicity).filter(Boolean));
    return ["All", ...Array.from(langs).map(l => l.charAt(0).toUpperCase() + l.slice(1))];
  }, [candidates]);

  const getDistanceColor = (tier) => {
    switch (tier) {
      case 10: return "bg-emerald-900/30 text-emerald-400 border-emerald-900/50";
      case 20: return "bg-blue-900/30 text-blue-400 border-blue-900/50";
      case 30: return "bg-amber-900/30 text-amber-400 border-amber-900/50";
      default: return "bg-red-900/30 text-red-400 border-red-900/50";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score > 0) return "text-gray-400";
    return "text-red-900/50"; 
  };

  const getIndeedLink = (email) => {
    return `https://employers.indeed.com/j#candidates?q=${encodeURIComponent(email || "")}`;
  };

  return (
    <div className="max-w-6xl mx-auto w-full pt-8 relative">
      
      <div className="mb-8 flex justify-between items-end bg-[#171717] p-6 rounded-xl border border-[#2a2a2a] shadow-lg">
        <div>
          <h1 className="text-2xl font-semibold text-white">Master Lead Roster</h1>
          <p className="text-gray-400 text-sm mt-1">
            {candidates.length} candidates locked. Adjust client zip code to recalculate proximity.
          </p>
        </div>
        
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">Client Zip Code</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                maxLength="5"
                placeholder="e.g. 90210"
                value={targetZip}
                onChange={(e) => setTargetZip(e.target.value.replace(/\D/g, ''))}
                className="bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm rounded-lg focus:ring-[#FFCC00] focus:border-[#FFCC00] block w-24 p-2.5 outline-none"
              />
              <button 
                onClick={handleZipSearch}
                disabled={isCalculating || targetZip.length !== 5}
                className="bg-[#2a2a2a] hover:bg-[#333] text-white font-medium rounded-lg text-sm px-4 py-2 disabled:opacity-50 transition-colors"
              >
                {isCalculating ? "Syncing..." : "Update"}
              </button>
            </div>
          </div>

          {availableLanguages.length > 1 && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">Language Lane</label>
              <select 
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm rounded-lg focus:ring-[#FFCC00] focus:border-[#FFCC00] block p-2.5 outline-none cursor-pointer w-40"
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg mb-6 text-sm">
          Error loading candidates: {error}
        </div>
      )}

      <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Candidate Info</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">
                  Location {activeTargetZip && <span className="text-[#FFCC00] ml-1">(From {activeTargetZip})</span>}
                </th>
                <th className="px-6 py-4 font-medium">Language Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Loading your master roster...
                  </td>
                </tr>
              ) : processedCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No candidates found for this lane.
                  </td>
                </tr>
              ) : (
                processedCandidates.map((candidate, index) => {
                  const distMiles = dynamicDistances[candidate.id] ?? null;
                  const displayTier = distMiles !== null ? getDynamicDistanceTier(distMiles) : candidate.distance_tier;
                  const displayMiles = distMiles !== null && distMiles !== 999 ? distMiles.toFixed(1) : null;

                  return (
                    <tr key={candidate.id || index} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xl font-bold text-gray-600">#{index + 1}</span>
                      </td>

                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedCandidate({ ...candidate, dynamicTier: displayTier, dynamicMiles: displayMiles })}
                          className="font-medium text-white hover:text-[#FFCC00] transition-colors underline decoration-[#2a2a2a] underline-offset-4 text-left"
                        >
                          {candidate.full_name}
                        </button>
                        {candidate.status === 'new' && (
                          <span className="block mt-1 w-max px-2 py-0.5 text-[10px] uppercase tracking-wider bg-[#2a2a2a] text-gray-300 rounded">
                            New Lead
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 space-y-1">
                        {candidate.phone ? <div className="text-gray-300">{candidate.phone}</div> : <div className="text-gray-600 italic text-xs">No Phone</div>}
                        {candidate.email ? <div className="text-gray-400 text-xs truncate max-w-[200px]">{candidate.email}</div> : <div className="text-gray-600 italic text-xs">No Email</div>}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2.5 py-1 text-xs border rounded-full font-medium ${getDistanceColor(displayTier)}`}>
                            {displayTier === "Unknown" ? "Unknown Radius" : `${displayTier} Mile Radius`}
                          </span>
                          <span className="text-gray-500 text-xs ml-1 flex gap-2">
                            <span>Zip: {candidate.zip_code}</span>
                            {displayMiles && <span className="text-blue-400">• {displayMiles} mi</span>}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getScoreColor(candidate.match_score)}`}>
                              {candidate.match_score > 0 ? `${candidate.match_score}%` : 'N/A'}
                            </span>
                            {candidate.languages?.includes('AI Inferred') ? (
                              <span className="text-xs text-purple-400 border border-purple-900/50 bg-purple-900/20 px-2 py-0.5 rounded">AI Inferred</span>
                            ) : candidate.primary_ethnicity !== 'none' ? (
                              <span className="text-xs text-green-400 border border-green-900/50 bg-green-900/20 px-2 py-0.5 rounded">Explicit</span>
                            ) : (
                              <span className="text-xs text-gray-500 border border-gray-800 bg-gray-900/20 px-2 py-0.5 rounded">Standard</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 capitalize">
                            {candidate.primary_ethnicity !== 'none' ? candidate.primary_ethnicity : 'English Only'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCandidate && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedCandidate(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-[#2a2a2a] z-50 p-8 shadow-2xl overflow-y-auto animate-[slide-in-right_0.3s_ease-out]">
            <button 
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-1 pr-8">{selectedCandidate.full_name}</h2>
            <p className="text-[#FFCC00] text-xs font-semibold mb-8 uppercase tracking-widest">{selectedCandidate.job_applied_for || "Caregiver Applicant"}</p>

            <div className="space-y-8">
              <section>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Profile</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a]">
                    <p className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Match Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(selectedCandidate.match_score)}`}>
                      {selectedCandidate.match_score > 0 ? `${selectedCandidate.match_score}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#141414] p-4 rounded-xl border border-[#2a2a2a]">
                    <p className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Distance</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {selectedCandidate.dynamicMiles ? `${selectedCandidate.dynamicMiles} mi` : `${selectedCandidate.dynamicTier} mi tier`}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Relevant Experience</h3>
                <div className="bg-[#141414] p-5 rounded-xl border border-[#2a2a2a]">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCandidate.experience_summary && selectedCandidate.experience_summary !== "nan" 
                      ? selectedCandidate.experience_summary 
                      : "No relevant experience detailed in the Indeed export."}
                  </p>
                </div>
              </section>

              <section className="pt-4 mt-auto">
                <a 
                  href={getIndeedLink(selectedCandidate.email)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-full bg-[#171717] hover:bg-[#2a2a2a] text-white font-bold py-4 rounded-xl border border-[#333] transition-all shadow-lg gap-3 group"
                >
                  <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M21.5 2h-19C1.1 2 0 3.1 0 4.5v15C0 20.9 1.1 22 2.5 22h19c1.4 0 2.5-1.1 2.5-2.5v-15C24 3.1 22.9 2 21.5 2zm-12 15h-3v-9h3v9zm-1.5-10.2c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zm9.5 10.2h-3v-4.5c0-1.1-.9-2-2-2s-2 .9-2 2v4.5h-3v-9h3v1.3c.8-1.2 2.1-1.6 3.4-1.6 2.3 0 3.6 1.6 3.6 4.3v5z"/></svg>
                  Open in Indeed Dashboard
                </a>
              </section>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}