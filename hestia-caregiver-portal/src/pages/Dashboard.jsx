import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const visitsData = [
  { id: 1, name: "John Doe", time: "9:00 AM" },
  { id: 2, name: "Mary Smith", time: "11:30 AM" },
  { id: 3, name: "Robert Johnson", time: "2:00 PM" },
];

const notesData = [
  { id: 1, title: "Update care plan", description: "For Mary Smith - Due Today" },
];

const messagesData = [
  { id: 1, sender: "Dr. Adams", preview: "Please review the updated medication..." },
  { id: 2, sender: "Admin Team", preview: "Your schedule for next week is ready." },
];

function StatCard({ title, count, badge, badgeColor, items, isExpanded, onToggle, icon, accentColor }) {
  return (
    <div
      onClick={onToggle}
      className="bg-white rounded-2xl border cursor-pointer group hover:-translate-y-0.5 transition-all duration-300"
      style={{
        borderColor: "#EDE3DC",
        boxShadow: "0 2px 12px rgba(44, 24, 16, 0.06)"
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}18` }}>
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: `${accentColor}15`, color: accentColor }}>
              {badge}
            </span>
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#B59890" }}>
          {title}
        </p>
        <p className="text-4xl font-bold" style={{ color: accentColor }}>{count}</p>
      </div>

      {isExpanded && items && items.length > 0 && (
        <div className="px-6 pb-5 border-t" style={{ borderColor: "#F5EDE8" }}>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={(e) => e.stopPropagation()}
                className="flex justify-between items-center px-3 py-2.5 rounded-xl transition-colors"
                style={{ background: "#FAF7F4" }}
              >
                <div>
                  <p className="text-sm font-medium text-[#2C1810]">{item.name || item.title}</p>
                  {item.description && (
                    <p className="text-xs mt-0.5" style={{ color: "#B59890" }}>{item.description}</p>
                  )}
                  {item.sender && (
                    <p className="text-xs mt-0.5" style={{ color: "#B59890" }}>{item.preview}</p>
                  )}
                </div>
                {item.time && (
                  <span className="text-xs font-semibold ml-3 shrink-0" style={{ color: accentColor }}>
                    {item.time}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [profileName, setProfileName] = useState(null);
  const [nameVisible, setNameVisible] = useState(false);
  const [expandedCards, setExpandedCards] = useState({ visits: false, notes: false, messages: false });

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("caregivers")
            .select("name, email")
            .eq("auth_id", user.id)
            .single();

          let firstName = null;
          if (data?.name) firstName = data.name.split(" ")[0];
          else if (data?.email) firstName = data.email.split("@")[0];
          else if (user.email) firstName = user.email.split("@")[0];

          if (firstName) {
            setProfileName(firstName);
            setTimeout(() => setNameVisible(true), 50);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
    getProfile();
  }, []);

  const toggleCard = (card) => {
    setExpandedCards((prev) => ({ ...prev, [card]: !prev[card] }));
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#B59890" }}>
          {today}
        </p>
        <h1
          className={`text-2xl md:text-3xl font-bold text-[#2C1810] tracking-tight capitalize transition-opacity duration-500 ${
            nameVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {profileName ? `Welcome back, ${profileName}` : "Welcome back"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
          Here's a quick overview of your day.
        </p>
      </div>

      {/* Quick-action strip */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: "My Availability", to: "/schedule", icon: "📅" },
          { label: "Matches", to: "/patients", icon: "🤝" },
          { label: "Confirmed Visits", to: "/confirmed-shifts", icon: "✅" },
          { label: "Profile", to: "/profile", icon: "👤" },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "#fff",
              borderColor: "#EDE3DC",
              color: "#2C1810",
              boxShadow: "0 1px 6px rgba(44,24,16,0.06)"
            }}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Today's Visits"
          count={visitsData.length}
          badge="+1 Scheduled"
          accentColor="#C41858"
          isExpanded={expandedCards.visits}
          onToggle={() => toggleCard("visits")}
          items={visitsData}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        <StatCard
          title="Pending Notes"
          count={notesData.length}
          badge="Needs Action"
          accentColor="#E8951B"
          isExpanded={expandedCards.notes}
          onToggle={() => toggleCard("notes")}
          items={notesData}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />

        <StatCard
          title="Messages"
          count={messagesData.length}
          badge="Unread"
          accentColor="#6B5B9A"
          isExpanded={expandedCards.messages}
          onToggle={() => toggleCard("messages")}
          items={messagesData}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Warm footer message */}
      <div className="mt-8 px-5 py-4 rounded-2xl border" style={{ background: "#FFF5F0", borderColor: "#F5DDD4" }}>
        <p className="text-sm" style={{ color: "#8C6B60" }}>
          <span className="font-semibold" style={{ color: "#C41858" }}>Thank you</span> for the compassionate care you provide every day.
          Your work makes a real difference in the lives of our patients and their families.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
