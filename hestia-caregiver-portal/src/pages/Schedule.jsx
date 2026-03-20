import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const month = monday.getMonth() + 1;
  const date = monday.getDate();

  return `${month}/${date}`;
}

// Reverse parser: Turns DB times ("09:00" -> "17:00") back into grid indices (19, 20, 21...)
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

      for (let i = startIdx; i < endIdx; i++) {
        indices.push(i);
      }
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
          .from("caregivers")
          .select("available_hours")
          .eq("auth_id", user.id)
          .single();

        if (error) throw error;

        if (data && data.available_hours) {
          setSchedule(parseScheduleFromDB(data.available_hours));
        }
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

      if (mode === "add" && !exists) {
        return { ...prev, [day]: [...daySlots, index] };
      }

      if (mode === "remove" && exists) {
        return { ...prev, [day]: daySlots.filter((s) => s !== index) };
      }

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

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const toggleAllDay = (day) => {
    setSchedule((prev) => {
      const currentSlots = prev[day] || [];
      const isAllDay = currentSlots.length >= 47;

      if (isAllDay) {
        return { ...prev, [day]: [] };
      }

      const fullDay = Array.from({ length: 47 }, (_, i) => i + 1);
      return { ...prev, [day]: fullDay };
    });
  };

  const copyMondayToAll = () => {
    const mondaySlots = schedule["Monday"] || [];

    setSchedule((prev) => {
      const updated = { ...prev };

      days.forEach((day) => {
        if (day !== "Monday") updated[day] = [...mondaySlots];
      });

      return updated;
    });
  };

  const clearAll = () => setSchedule({});

  const formatScheduleForDB = (scheduleObj) => {
    const indexToTime = (i) => {
      const minutes = (i - 1) * 30;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;

      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");

      return `${hh}:${mm}`;
    };

    const result = {};

    Object.entries(scheduleObj).forEach(([day, currentSlots]) => {
      const sorted = [...currentSlots].sort((a, b) => a - b);
      const ranges = [];

      let start = null;
      let prev = null;

      sorted.forEach((slot) => {
        if (start === null) {
          start = slot;
          prev = slot;
          return;
        }

        if (slot === prev + 1) {
          prev = slot;
          return;
        }

        ranges.push({
          start: indexToTime(start),
          end: indexToTime(prev + 1),
        });

        start = slot;
        prev = slot;
      });

      if (start !== null) {
        ranges.push({
          start: indexToTime(start),
          end: indexToTime(prev + 1),
        });
      }

      result[day] = ranges;
    });

    return result;
  };

  const handleConfirm = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const formattedSchedule = formatScheduleForDB(schedule);

      const { error } = await supabase
        .from("caregivers")
        .update({
          available_hours: formattedSchedule,
        })
        .eq("auth_id", user.id);

      if (error) throw error;

      navigate("/confirmSchedule", {
        state: { schedule: formattedSchedule, weekStart },
      });
    } catch (err) {
      console.error("Failed saving availability:", err);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center gap-3 mb-8 w-full">
        <h1 className="text-2xl font-semibold tracking-tight">
          Availability for Week {weekStart}
        </h1>

        <div className="relative flex items-center">
          <button
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            className="w-5 h-5 flex items-center justify-center text-xs rounded-full border border-gray-500 text-gray-400 hover:text-white transition-colors"
          >
            ?
          </button>

          {showInfo && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 text-xs bg-[#1f1f1f] border border-[#333] rounded-lg p-3 shadow-xl text-gray-300 z-50">
              Your availability stays the same week to week unless you manually
              change it. Click and drag to quickly select time slots.
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium rounded-lg hover:bg-[#2a2a2a]"
          >
            Clear All
          </button>

          <button
            onClick={copyMondayToAll}
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm font-medium rounded-lg border border-[#3a3a3a]"
          >
            Copy Monday to All
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[600px] border border-[#2a2a2a] rounded-xl bg-[#141414] shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414] shadow-2xl">
          <div className="bg-[#141414] border-r border-[#2a2a2a] flex flex-col">
            <div className="h-14 border-b border-[#2a2a2a] bg-[#1a1a1a]" />

            {slots.map((time, i) => {
              if (i === 0)
                return (
                  <div key={i} className="h-4 border-b border-[#2a2a2a]" />
                );

              const isBottomFullHour = (i - 1) % 2 !== 0;
              const isTopFullHour = (i - 1) % 2 === 0;

              return (
                <div
                  key={i}
                  className={`h-8 relative flex items-start justify-end pr-3 ${
                    isBottomFullHour
                      ? "border-b border-[#2a2a2a]"
                      : "border-b border-[#1a1a1a]"
                  }`}
                >
                  {isTopFullHour && (
                    <span className="absolute right-2 text-[11px] text-gray-400 -top-[7px] bg-[#141414] px-1">
                      {time}
                    </span>
                  )}
                </div>
              );
            })}

            <div className="h-14 border-t border-[#2a2a2a]" />
          </div>

          {days.map((day, dayIndex) => (
            <div
              key={day}
              className={`flex flex-col ${
                dayIndex !== days.length - 1
                  ? "border-r border-[#2a2a2a]"
                  : ""
              }`}
            >
              <div className="h-14 flex items-center justify-center border-b border-[#2a2a2a] bg-[#1a1a1a] text-sm">
                {day}
              </div>

              {slots.map((_, i) => {
                if (i === 0)
                  return (
                    <div key={i} className="h-4 border-b border-[#2a2a2a]" />
                  );

                const active = (schedule[day] || []).includes(i);
                const isBottomFullHour = (i - 1) % 2 !== 0;

                return (
                  <div
                    key={i}
                    onMouseDown={() => handleMouseDown(day, i)}
                    onMouseEnter={() => handleMouseEnter(day, i)}
                    className={`h-8 cursor-pointer ${
                      isBottomFullHour
                        ? "border-b border-[#2a2a2a]"
                        : "border-b border-[#1a1a1a]"
                    } ${
                      active
                        ? "bg-indigo-600 hover:bg-indigo-500"
                        : "hover:bg-[#222222]"
                    }`}
                  />
                );
              })}

              <div className="h-14 flex items-center justify-center border-t border-[#2a2a2a] bg-[#1a1a1a]">
                <button
                  onClick={() => toggleAllDay(day)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-[#3a3a3a] bg-[#2a2a2a] hover:bg-indigo-600"
                >
                  All Day
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Schedule;