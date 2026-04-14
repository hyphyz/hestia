import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { console.error("No user logged in"); return; }
        const { data: caregiver, error } = await supabase
          .from("caregivers").select("*").eq("auth_id", user.id).single();
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

  const totalHours = myAvailability ? days.reduce((total, day) => {
    const slots = myAvailability.available_hours?.[day] || [];
    return total + slots.reduce((sum, slot) => {
      if (!slot.start || !slot.end) return sum;
      const [sh, sm] = slot.start.split(":").map(Number);
      const [eh, em] = slot.end.split(":").map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);
  }, 0) : 0;

  const activeDays = myAvailability ? days.filter(day =>
    (myAvailability.available_hours?.[day] || []).length > 0
  ).length : 0;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">My Availability</h1>
          <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
            This is how your schedule appears to the matching system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: "#EDE3DC", color: "#2C1810", background: "#fff" }}
          >
            Edit Schedule
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #C41858, #8B1035)",
              boxShadow: "0 4px 14px rgba(196, 24, 88, 0.3)"
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#C41858] border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: "#8C6B60" }}>Loading your availability...</p>
          </div>
        </div>
      ) : !myAvailability ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
          <p style={{ color: "#8C6B60" }}>Caregiver profile not found.</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Active Days", value: activeDays },
              { label: "Hours / Week", value: Math.round(totalHours * 10) / 10 },
              { label: "Max Hours", value: myAvailability.max_hours_per_week || 40 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border p-4 text-center"
                style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
                <p className="text-3xl font-bold" style={{ color: "#C41858" }}>{stat.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: "#B59890" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Caregiver Card */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE3DC", boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>

            {/* Profile header */}
            <div className="px-6 py-5 border-b flex items-center gap-4"
              style={{ borderColor: "#F5EDE8", background: "#FFF8F5" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                style={{ background: "linear-gradient(135deg, #C41858, #8B1035)" }}>
                {myAvailability.name?.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#2C1810]">{myAvailability.name}</h3>
                <p className="text-sm font-medium" style={{ color: "#C41858" }}>Caregiver</p>
              </div>
            </div>

            {/* Schedule rows */}
            <div className="divide-y" style={{ divideColor: "#F5EDE8" }}>
              {days.map((day) => {
                const daySlots = myAvailability.available_hours?.[day] || [];
                const full = isAllDay(daySlots);
                const hasSlots = daySlots.length > 0;

                return (
                  <div key={day} className="flex items-center px-6 py-3.5 gap-4">
                    <span className="w-28 text-sm font-semibold shrink-0" style={{ color: hasSlots ? "#2C1810" : "#C4A898" }}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {full ? (
                        <span className="px-3 py-1 text-xs rounded-lg font-bold" style={{ background: "rgba(34, 166, 118, 0.12)", color: "#22A676", border: "1px solid rgba(34,166,118,0.25)" }}>
                          Open All Day
                        </span>
                      ) : hasSlots ? (
                        daySlots.map((slot, i) => (
                          <span key={i} className="px-3 py-1 text-xs rounded-lg font-semibold" style={{ background: "rgba(196,24,88,0.09)", color: "#C41858", border: "1px solid rgba(196,24,88,0.2)" }}>
                            {formatTime(slot.start)} &ndash; {formatTime(slot.end)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm italic" style={{ color: "#C4A898" }}>Unavailable</span>
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
