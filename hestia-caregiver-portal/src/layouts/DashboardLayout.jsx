import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/HHC.png";

function NavLink({ to, children, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${isActive
          ? "bg-white/20 text-white shadow-sm"
          : "text-rose-200 hover:text-white hover:bg-white/10"
        }`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </Link>
  );
}

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

      if (data) setRole(data.role);
    }
    fetchRole();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FAF7F4] font-sans text-[#2C1810]">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: "linear-gradient(180deg, #7B1D3A 0%, #5E1229 100%)" }}>

        {/* Brand */}
        <div className="px-6 pt-7 pb-5 flex items-center justify-center border-b border-white/10">
          <img src={logo} alt="Hestia Homecare" className="h-9 object-contain brightness-0 invert" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-5 pb-4 space-y-1 overflow-y-auto">

          <NavLink
            to="/dashboard"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/schedule"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            My Availability
          </NavLink>

          <NavLink
            to="/patients"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            }
          >
            Schedule Matches
          </NavLink>

          <NavLink
            to="/confirmed-shifts"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Confirmed Visits
          </NavLink>

          <NavLink
            to="/profile"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            Profile
          </NavLink>

          {/* Admin Section */}
          {role === "admin" && (
            <>
              <div className="pt-5 mt-3 border-t border-white/10">
                <p className="text-[10px] text-rose-300/60 uppercase tracking-[0.15em] font-semibold px-4 mb-2">
                  Admin
                </p>
              </div>

              <NavLink
                to="/admin/new-patient"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                New Patient
              </NavLink>

              <NavLink
                to="/admin/process-leads"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                }
              >
                Process Leads
              </NavLink>

              <NavLink
                to="/admin/ranked-leads"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              >
                Ranked Leads
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-[11px] text-rose-300/50 text-center tracking-wide">
            Hestia Homecare &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-8 py-8">
          {children}
        </div>
      </main>

    </div>
  );
}

export default DashboardLayout;
