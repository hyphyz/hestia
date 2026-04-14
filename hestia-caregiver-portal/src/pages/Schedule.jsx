import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const slots = Array.from({ length: 48 }, (_, i) => {
  if (i === 0) return "";
  const shifted = i - 1;
  const hour = Math.floor(shifted / 2);
  const minute = shifted % 2 === 0 ? "00" : "30";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${displayHour}:${minute} ${ampm}`;
});

function getWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return `${monday.getMonth() + 1}/${monday.getDate()}`;
}

const parseScheduleFromDB = (dbSchedule) => {
  const result = {};
  if (!dbSchedule) return result;
  Object.entries(dbSchedule).forEach(([day, ranges]) => {
    const indices = [];
    ranges.forEach((range) => {
      const [startH, startM] = range.start.split(":").map(Number);
      const [endH, endM] = range.end.split(":").map(Number);
      const startIdx = (startH * 60 + startM) / 30 + 1;
      const endIdx = (endH * 60 + endM) / 30 + 1;
      for (let i = startIdx; i < endIdx; i++) indices.push(i);
    });
    result[day] = indices;
  });
  return result;
};

function Schedule() {
  const [schedule, setSchedule] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const weekStart = getWeekStart();

  useEffect(() => {
    const fetchExistingSchedule = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;
        const { data, error } = await supabase
          .from("caregivers").select("available_hours").eq("auth_id", user.id).single();
        if (error) throw error;
        if (data?.available_hours) setSchedule(parseScheduleFromDB(data.available_hours));
      } catch (err) {
        console.error("Failed to load existing availability:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExistingSchedule();
  }, []);

  const updateSlot = useCallback((day, index, mode) => {
    if (index === 0) return;
    setSchedule((prev) => {
      const daySlots = prev[day] || [];
      const exists = daySlots.includes(index);
      if (mode === "add" && !exists) return { ...prev, [day]: [...daySlots, index] };
      if (mode === "remove" && exists) return { ...prev, [day]: daySlots.filter((s) => s !== index) };
      return prev;
    });
  }, []);

  const handleMouseDown = (day, index) => {
    if (index === 0) return;
    setIsDragging(true);
    const isCurrentlySelected = (schedule[day] || []).includes(index);
    const mode = isCurrentlySelected ? "remove" : "add";
    setDragMode(mode);
    updateSlot(day, index, mode);
  };

  const handleMouseEnter = (day, index) => {
    if (isDragging) updateSlot(day, index, dragMode);
  };

  const handleMouseUp = () => { setIsDragging(false); setDragMode(null); };

  const toggleAllDay = (day) => {
    setSchedule((prev) => {
      const currentSlots = prev[day] || [];
      if (currentSlots.length >= 47) return { ...prev, [day]: [] };
      return { ...prev, [day]: Array.from({ length: 47 }, (_, i) => i + 1) };
    });
  };

  const copyMondayToAll = () => {
    const mondaySlots = schedule["Monday"] || [];
    setSchedule((prev) => {
      const updated = { ...prev };
      days.forEach((day) => { if (day !== "Monday") updated[day] = [...mondaySlots]; });
      return updated;
    });
  };

  const clearAll = () => setSchedule({});

  const formatScheduleForDB = (scheduleObj) => {
    const indexToTime = (i) => {
      const minutes = (i - 1) * 30;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    const result = {};
    Object.entries(scheduleObj).forEach(([day, currentSlots]) => {
      const sorted = [...currentSlots].sort((a, b) => a - b);
      const ranges = [];
      let start = null, prev = null;
      sorted.forEach((slot) => {
        if (start === null) { start = slot; prev = slot; return; }
        if (slot === prev + 1) { prev = slot; return; }
        ranges.push({ start: indexToTime(start), end: indexToTime(prev + 1) });
        start = slot; prev = slot;
      });
      if (start !== null) ranges.push({ start: indexToTime(start), end: indexToTime(prev + 1) });
      result[day] = ranges;
    });
    return result;
  };

  const handleConfirm = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const formattedSchedule = formatScheduleForDB(schedule);
      const { error } = await supabase.from("caregivers")
        .update({ available_hours: formattedSchedule }).eq("auth_id", data.user.id);
      if (error) throw error;
      navigate("/confirmSchedule", { state: { schedule: formattedSchedule, weekStart } });
    } catch (err) {
      console.error("Failed saving availability:", err);
    }
  };

  const totalSelectedSlots = Object.values(schedule).reduce((sum, slots) => sum + slots.length, 0);
  const totalHours = Math.round((totalSelectedSlots * 0.5) * 10) / 10;

  return (
    <div
      className="min-h-screen select-none"
      style={{ background: "#FAF7F4" }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">My Availability</h1>
          <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
            Week of {weekStart} &mdash; Click or drag to set your available hours
          </p>
          {totalHours > 0 && (
            <p className="text-xs mt-1 font-semibold" style={{ color: "#C41858" }}>
              {totalHours} hours selected this week
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-full border transition-colors font-semibold"
              style={{ borderColor: "#EDE3DC", color: "#B59890", background: "#fff" }}
            >
              ?
            </button>
            {showInfo && (
              <div className="absolute right-0 top-9 w-64 text-xs rounded-xl p-3.5 shadow-xl z-50"
                style={{ background: "#fff", border: "1px solid #EDE3DC", color: "#7A5C52" }}>
                Your availability carries over week to week unless you manually change it. Click and drag to quickly select or deselect time slots.
              </div>
            )}
          </div>

          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm font-medium rounded-xl border transition-colors"
            style={{ borderColor: "#EDE3DC", color: "#8C6B60", background: "#fff" }}
          >
            Clear All
          </button>

          <button
            onClick={copyMondayToAll}
            className="px-4 py-2 text-sm font-medium rounded-xl border transition-colors"
            style={{ borderColor: "#EDE3DC", color: "#8C6B60", background: "#fff" }}
          >
            Copy Mon &rarr; All
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #C41858, #8B1035)",
              boxShadow: "0 4px 14px rgba(196, 24, 88, 0.3)"
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-[500px] rounded-2xl border" style={{ background: "#fff", borderColor: "#EDE3DC" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#C41858] border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: "#8C6B60" }}>Loading your schedule...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#EDE3DC", boxShadow: "0 2px 16px rgba(44,24,16,0.06)" }}>
          <div className="grid" style={{ gridTemplateColumns: "72px repeat(7, 1fr)", background: "#fff" }}>

            {/* Time column */}
            <div style={{ background: "#FAF7F4", borderRight: "1px solid #EDE3DC" }}>
              <div className="h-14 border-b" style={{ borderColor: "#EDE3DC", background: "#FAF3EF" }} />
              {slots.map((time, i) => {
                if (i === 0) return <div key={i} className="h-4 border-b" style={{ borderColor: "#EDE3DC" }} />;
                const isBottomFullHour = (i - 1) % 2 !== 0;
                const isTopFullHour = (i - 1) % 2 === 0;
                return (
                  <div
                    key={i}
                    className="h-8 relative flex items-start justify-end pr-2"
                    style={{ borderBottom: `1px solid ${isBottomFullHour ? "#EDE3DC" : "#FAF3EF"}` }}
                  >
                    {isTopFullHour && (
                      <span className="absolute right-2 text-[10px] -top-[7px] px-0.5 font-medium"
                        style={{ color: "#C4A898", background: "#FAF7F4" }}>
                        {time}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="h-12 border-t" style={{ borderColor: "#EDE3DC" }} />
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => (
              <div
                key={day}
                style={{ borderRight: dayIndex !== days.length - 1 ? "1px solid #EDE3DC" : "none" }}
              >
                {/* Day header */}
                <div className="h-14 flex flex-col items-center justify-center border-b"
                  style={{ borderColor: "#EDE3DC", background: "#FAF3EF" }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7A5C52" }}>
                    {day.slice(0, 3)}
                  </span>
                  {(schedule[day] || []).length > 0 && (
                    <span className="text-[10px] font-semibold mt-0.5" style={{ color: "#C41858" }}>
                      {Math.round((schedule[day] || []).length * 0.5)}h
                    </span>
                  )}
                </div>

                {/* Slots */}
                {slots.map((_, i) => {
                  if (i === 0) return <div key={i} className="h-4 border-b" style={{ borderColor: "#EDE3DC" }} />;
                  const active = (schedule[day] || []).includes(i);
                  const isBottomFullHour = (i - 1) % 2 !== 0;
                  return (
                    <div
                      key={i}
                      onMouseDown={() => handleMouseDown(day, i)}
                      onMouseEnter={() => handleMouseEnter(day, i)}
                      className="h-8 cursor-pointer transition-colors"
                      style={{
                        borderBottom: `1px solid ${isBottomFullHour ? "#EDE3DC" : active ? "rgba(196,24,88,0.2)" : "#FAF3EF"}`,
                        background: active ? "rgba(196, 24, 88, 0.18)" : "transparent"
                      }}
                      onMouseOver={(e) => {
                        if (!active) e.currentTarget.style.background = "rgba(196, 24, 88, 0.06)";
                      }}
                      onMouseOut={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent";
                      }}
                    />
                  );
                })}

                {/* All Day button */}
                <div className="h-12 flex items-center justify-center border-t" style={{ borderColor: "#EDE3DC", background: "#FAF3EF" }}>
                  <button
                    onClick={() => toggleAllDay(day)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all"
                    style={{
                      borderColor: (schedule[day] || []).length >= 47 ? "#C41858" : "#EDE3DC",
                      color: (schedule[day] || []).length >= 47 ? "#C41858" : "#8C6B60",
                      background: (schedule[day] || []).length >= 47 ? "rgba(196,24,88,0.08)" : "#fff"
                    }}
                  >
                    All Day
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
