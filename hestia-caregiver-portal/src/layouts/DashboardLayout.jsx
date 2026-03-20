import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/HHC.png";

function DashboardLayout({ children }) {

  const [role, setRole] = useState(null);

  useEffect(() => {
    async function fetchRole() {

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
    }

    fetchRole();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f] font-['Inter'] text-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#171717] border-r border-[#2a2a2a] flex flex-col">
        
        {/* Brand */}
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-center">
          <img
            src={logo}
            alt="Hestia Homecare"
            className="h-10 object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">

          <Link
            to="/dashboard"
            className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            Dashboard
          </Link>

          <Link
            to="/schedule"
            className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            My Availability
          </Link>

          <Link
            to="/patients"
            className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            Schedule Matches
          </Link>

          <Link
            to="/confirmed-shifts"
            className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            Confirmed Visits
          </Link>

          <Link
            to="/profile"
            className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            Profile
          </Link>

          {/* Admin Section */}
          {role === "admin" && (
            <>
              <div className="pt-4 mt-4 border-t border-[#2a2a2a] text-xs text-gray-500 uppercase tracking-wide px-4">
                Admin
              </div>

              <Link
                to="/admin/new-patient"
                className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition"
              >
                New Patient
              </Link>
            </>
          )}

        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a] text-xs text-gray-500 text-center">
          Hestia Homecare
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 bg-[#0f0f0f]">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;