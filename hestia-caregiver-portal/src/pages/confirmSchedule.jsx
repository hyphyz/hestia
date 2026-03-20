import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTime(time24) {
  if (!time24) return "";
  if (time24 === "24:00") return "12:00 AM";
  const [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function ConfirmSchedule() {
  const navigate = useNavigate();
  const [myAvailability, setMyAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAvailability = async () => {
      try {
        // 1. Get the logged-in user's ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error("No user logged in");
          return;
        }

        // 2. Fetch ONLY the caregiver record matching this auth_id
        const { data: caregiver, error } = await supabase
          .from("caregivers")
          .select("*")
          .eq("auth_id", user.id)
          .single(); // We use .single() because there should only be one "Me"

        if (error) throw error;

        setMyAvailability(caregiver);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAvailability();
  }, []);

  const isAllDay = (daySlots) => {
    if (!daySlots || daySlots.length !== 1) return false;
    const range = daySlots[0];
    return range.start === "00:00" && (range.end === "24:00" || range.end === "23:30");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8">
      <div className="flex items-center justify-between mb-8 w-full max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Availability
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            This is how your current schedule appears to patients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] text-sm hover:bg-[#3a3a3a]"
          >
            Edit Schedule
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-500"
          >
            Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : !myAvailability ? (
        <div className="max-w-4xl mx-auto text-center py-20 bg-[#141414] rounded-xl border border-[#2a2a2a]">
          <p className="text-gray-400">Caregiver profile not found.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#2a2a2a]">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">
                {myAvailability.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">{myAvailability.name}</h3>
                <p className="text-indigo-400 text-sm">Primary Caregiver</p>
              </div>
            </div>

            <div className="space-y-6">
              {days.map((day) => {
                const daySlots = myAvailability.available_hours?.[day] || [];
                const fullDay = isAllDay(daySlots);

                return (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center py-2">
                    <span className="text-gray-400 w-full sm:w-40 text-sm font-medium mb-2 sm:mb-0">
                      {day}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {fullDay ? (
                        <div className="px-4 py-1.5 text-xs rounded-lg bg-green-600/10 border border-green-500/30 text-green-400 font-bold">
                          OPEN 24 HOURS
                        </div>
                      ) : daySlots.length > 0 ? (
                        daySlots.map((slot, i) => (
                          <div
                            key={i}
                            className="px-4 py-1.5 text-xs rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 font-medium"
                          >
                            {formatTime(slot.start)} – {formatTime(slot.end)}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-600 text-sm italic">No availability set</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfirmSchedule;