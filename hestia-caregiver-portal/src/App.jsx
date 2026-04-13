import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout
import DashboardLayout from "./layouts/DashboardLayout.jsx"; 

// General Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Schedule from "./pages/Schedule.jsx";
import ConfirmSchedule from "./pages/confirmSchedule.jsx";
import ConfirmedShifts from "./pages/ConfirmedShifts.jsx";
import Profile from "./pages/Profile.jsx";
import Patients from "./pages/Patients.jsx";

// Admin Pages
import NewPatient from "./pages/admin/new-patient.jsx";
import CandidateProcessor from "./pages/admin/CandidateProcessor.jsx"; 
import IndeedCandidates from "./pages/admin/IndeedCandidates.jsx"; // <-- NEW IMPORT

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/" element={<Login />} />

        {/* Core App Routes */}
        <Route
          path="/dashboard"
          element={<DashboardLayout><Dashboard /></DashboardLayout>}
        />

        <Route
          path="/schedule"
          element={<DashboardLayout><Schedule /></DashboardLayout>}
        />

        <Route
          path="/confirmSchedule"
          element={<DashboardLayout><ConfirmSchedule /></DashboardLayout>}
        />

        <Route
          path="/patients"
          element={<DashboardLayout><Patients /></DashboardLayout>}
        />

        <Route
          path="/confirmed-shifts"
          element={<DashboardLayout><ConfirmedShifts /></DashboardLayout>}
        />

        <Route
          path="/profile"
          element={<DashboardLayout><Profile /></DashboardLayout>}
        />

        {/* Admin Specific Routes */}
        <Route
          path="/admin/new-patient"
          element={<DashboardLayout><NewPatient /></DashboardLayout>}
        />

        <Route
          path="/admin/process-leads"
          element={<DashboardLayout><CandidateProcessor /></DashboardLayout>}
        />

        {/* NEW: Ranked Leads Route */}
        <Route
          path="/admin/ranked-leads"
          element={<DashboardLayout><IndeedCandidates /></DashboardLayout>}
        />

        <Route
          path="/admin/patients"
          element={<DashboardLayout><Patients /></DashboardLayout>}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;