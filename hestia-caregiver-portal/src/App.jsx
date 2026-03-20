import { BrowserRouter, Routes, Route } from "react-router-dom";

// IMPORT YOUR LAYOUT HERE
import DashboardLayout from "./layouts/DashboardLayout.jsx"; 

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Schedule from "./pages/Schedule.jsx";
import ConfirmSchedule from "./pages/confirmSchedule.jsx";
import ConfirmedShifts from "./pages/ConfirmedShifts.jsx";
import NewPatient from "./pages/admin/new-patient.jsx";
import Profile from "./pages/Profile.jsx";
import Patients from "./pages/Patients.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<DashboardLayout><Dashboard /></DashboardLayout>}
        />

        {/* Caregiver availability */}
        <Route
          path="/schedule"
          element={<DashboardLayout><Schedule /></DashboardLayout>}
        />

        {/* Confirm availability */}
        <Route
          path="/confirmSchedule"
          element={<DashboardLayout><ConfirmSchedule /></DashboardLayout>}
        />

        {/* Scheduler matches */}
        <Route
          path="/patients"
          element={<DashboardLayout><Patients /></DashboardLayout>}
        />

        {/* NEW: Confirmed shifts */}
        <Route
          path="/confirmed-shifts"
          element={<DashboardLayout><ConfirmedShifts /></DashboardLayout>}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={<DashboardLayout><Profile /></DashboardLayout>}
        />

        {/* Admin routes */}
        <Route
          path="/admin/new-patient"
          element={<DashboardLayout><NewPatient /></DashboardLayout>}
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