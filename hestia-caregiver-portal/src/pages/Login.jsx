import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/HHC.png";

function Login() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      // 2️⃣ Check if caregiver row already exists
      const { data: caregiver, error: caregiverError } = await supabase
        .from("caregivers")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (caregiverError) throw caregiverError;

      // 3️⃣ If not, create caregiver profile
      if (!caregiver) {
        const { error: insertError } = 
        await supabase.from("caregivers").upsert(
          {
            auth_id: user.id,
            name: user.email,
            available_hours: {},
            total_assigned_hours: 0,
            max_hours_per_week: 40,
            active: true,
          },
          { onConflict: "auth_id" }
        );

        if (insertError) throw insertError;
      }

      // 4️⃣ Go to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] overflow-hidden">
      <div
        className={`bg-[#171717] shadow-2xl rounded-3xl p-10 w-full max-w-md border border-[#2a2a2a]
        transform transition-all duration-700 ease-out
        ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Hestia Homecare"
            className={`h-20 object-contain transition-all duration-1000 ease-out
            ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          />
        </div>

        <p className="text-center text-gray-400 text-xs tracking-[0.3em] uppercase mb-8 font-['Inter']">
          Caregiver Portal
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl text-gray-200 placeholder-gray-500 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#a73737] transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-[#1f1f1f] border border-[#2f2f2f] rounded-xl text-gray-200 placeholder-gray-500 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#a73737] transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#a73737] hover:bg-[#8f2e2e] text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg tracking-wide disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-8">
          © {new Date().getFullYear()} Hestia Homecare
        </p>
      </div>
    </div>
  );
}

export default Login;