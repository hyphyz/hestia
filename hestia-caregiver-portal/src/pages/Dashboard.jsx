import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Dummy Data Arrays - Easy to replace with API data later
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

function Dashboard() {
  const [profileName, setProfileName] = useState(null);
  const [nameVisible, setNameVisible] = useState(false);

  const [expandedCards, setExpandedCards] = useState({
    visits: false,
    notes: false,
    messages: false,
  });

  // Fetch the user's name/email on load
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

          if (data?.name) {
            firstName = data.name.split(" ")[0];
          } else if (data?.email) {
            firstName = data.email.split("@")[0];
          } else if (user.email) {
            firstName = user.email.split("@")[0];
          }

          if (firstName) {
            setProfileName(firstName);

            // trigger fade-in slightly after mount
            setTimeout(() => {
              setNameVisible(true);
            }, 50);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    getProfile();
  }, []);

  const toggleCard = (card) => {
    setExpandedCards((prev) => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto py-6 font-['Inter']">
      
      {/* Header */}
      <div className="mb-10">
        {/* Back Navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back
        </Link>

        <h1
          className={`text-2xl md:text-3xl font-bold text-gray-100 mb-2 tracking-tight capitalize transition-opacity duration-500 ${
            nameVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {profileName && `Welcome back, ${profileName}`}
        </h1>

        <p className="text-gray-400 text-xs md:text-sm tracking-wide">
          Here’s an overview of your schedule and tasks for today.
        </p>
      </div>

      {/* Cards Wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Card 1: Visits */}
        <div 
          onClick={() => toggleCard('visits')}
          className="group relative bg-gradient-to-b from-[#171717] to-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg hover:shadow-[0_8px_30px_rgba(167,55,55,0.12)] hover:border-[#a73737]/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#a73737]/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Today’s Visits
              </h2>

              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-4xl font-bold text-[#a73737]">{visitsData.length}</p>
                <span className="text-xs font-medium text-[#a73737]/80 bg-[#a73737]/10 px-2 py-1 rounded-md">
                  +1 Scheduled
                </span>
              </div>
            </div>
          </div>

          {expandedCards.visits && (
            <div className="relative z-10 mt-6 pt-4 border-t border-[#2a2a2a]">
              <ul className="space-y-3">
                {visitsData.map((visit) => (
                  <li 
                    key={visit.id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex justify-between items-center text-sm p-2 bg-[#2a2a2a]/30 rounded-lg hover:bg-[#2a2a2a]/50 transition-colors"
                  >
                    <span className="text-gray-300 font-medium">{visit.name}</span>
                    <span className="text-[#a73737] text-xs font-medium">{visit.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => toggleCard('notes')}
          className="group relative bg-gradient-to-b from-[#171717] to-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg hover:shadow-[0_8px_30px_rgba(167,55,55,0.12)] hover:border-[#a73737]/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <div className="relative z-10">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Pending Notes
            </h2>

            <div className="flex items-baseline gap-3 mt-2">
              <p className="text-4xl font-bold text-[#a73737]">{notesData.length}</p>
              <span className="text-xs font-medium text-gray-400 bg-[#2a2a2a] px-2 py-1 rounded-md">
                Needs Action
              </span>
            </div>
          </div>

          {expandedCards.notes && (
            <div className="relative z-10 mt-6 pt-4 border-t border-[#2a2a2a]">
              <ul className="space-y-3">
                {notesData.map((note) => (
                  <li 
                    key={note.id}
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col gap-1 text-sm p-2 bg-[#2a2a2a]/30 rounded-lg hover:bg-[#2a2a2a]/50 transition-colors"
                  >
                    <span className="text-gray-300 font-medium">{note.title}</span>
                    <span className="text-gray-500 text-xs">{note.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => toggleCard('messages')}
          className="group relative bg-gradient-to-b from-[#171717] to-[#111111] p-6 rounded-2xl border border-[#2a2a2a] shadow-lg hover:shadow-[0_8px_30px_rgba(167,55,55,0.12)] hover:border-[#a73737]/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
        >
          <div className="relative z-10">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Messages
            </h2>

            <div className="flex items-baseline gap-3 mt-2">
              <p className="text-4xl font-bold text-[#a73737]">{messagesData.length}</p>
              <span className="flex items-center gap-1 text-xs font-medium text-[#a73737]/80 bg-[#a73737]/10 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a73737] animate-pulse"></span>
                Unread
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;