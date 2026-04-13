import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Butter-smooth entrance animation
    const timer = setTimeout(() => setLoaded(true), 150);
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
        const { error: insertError } = await supabase.from("caregivers").upsert(
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
      setLoading(false); // only stop on error to keep the animation cohesive on success!
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden relative selection:bg-[#FFCC00] selection:text-black">
      
      {/* Dynamic Gold-to-Red ambient background glow - synchronized with flame pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0
        animate-[ambient-glow-pulse_5s_infinite_ease-in-out]"></div>

      {/* --- INJECTED CSS FOR THE FLAME & GLOW ANIMATIONS --- */}
      <style>{`
        @keyframes ambient-glow-pulse {
          0%, 100% { filter: blur(150px); opacity: 0.1; background-color: #990000; }
          50% { filter: blur(180px); opacity: 0.25; background-color: #FFCC00; }
        }

        @keyframes organic-flame-pulse {
          0%, 100% { transform: scale(1) skewX(0deg); opacity: 1; filter: drop-shadow(0 0 15px rgba(255, 204, 0, 0.4)); }
          25% { transform: scale(1.03) skewX(1deg); opacity: 0.9; filter: drop-shadow(0 0 20px rgba(153, 0, 0, 0.6)); }
          50% { transform: scale(0.97) skewX(-1deg); opacity: 0.8; filter: drop-shadow(0 0 25px rgba(255, 204, 0, 0.7)); }
          75% { transform: scale(1.05) skewX(0.5deg); opacity: 0.95; filter: drop-shadow(0 0 18px rgba(153, 0, 0, 0.5)); }
        }
        
        @keyframes flame-glimmer {
          0%, 100% { opacity: 1; brightness: 1; }
          25% { opacity: 0.9; brightness: 1.1; }
          50% { opacity: 0.85; brightness: 1; }
          75% { opacity: 0.95; brightness: 1.15; }
        }

        /* Standard flicker animation applied to individual glyphs */
        .flicker-flame {
          transform-origin: center bottom;
          animation: flame-glimmer 0.2s infinite, organic-flame-pulse 5s infinite ease-in-out;
          transition: all 0.3s ease;
        }

        .login-card:hover .flicker-flame {
          filter: drop-shadow(0 0 30px rgba(255, 204, 0, 0.9)) brightness(1.2);
          transform: scale(1.1) rotate(2deg);
        }
      `}</style>

      <div
        className={`bg-[#0a0a0a] shadow-2xl rounded-3xl p-10 w-full max-w-md border border-[#1a1a1a] z-10 login-card
        transform transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
        ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="flex justify-center mb-6 svg-container cursor-default">
          {/* THE MASTER ANIMATED LOGO SVG (viewBox standardized to 1024 683 to match flame) */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1024 683" 
            className={`h-28 w-auto transition-all duration-1000 ease-out drop-shadow-xl ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
          >
            {/* SVG Animations Defined Here */}
            <defs>
              <linearGradient id="fire-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="10%" stopColor="#FFCC00" /> {/* Gold Top */}
                <stop offset="90%" stopColor="#990000" /> {/* Deep USC Red Base */}
              </linearGradient>
            </defs>

            {/* --- GROUP 1: THE FLAME BEHIND THE LETTERS --- */}
            <g className="flicker-flame" fillRule="evenodd" stroke="none" fill="url(#fire-gradient)">
              {/* Flame Glyph 1 */}
              <path d="M 0.494 342 C 0.494 529.825, 0.609 606.662, 0.750 512.750 C 0.891 418.837, 0.891 265.162, 0.750 171.250 C 0.609 77.337, 0.494 154.175, 0.494 342"/>
              {/* Flame Glyph 2 (Top Flame Part) */}
              <path d="M 524.621 27.961 C 531.904 48.903, 528.882 72.355, 515.454 99.092 C 501.217 127.440, 483.839 148.051, 437.256 191.837 C 393.282 233.172, 375.793 253.634, 358.208 284.327 C 340.828 314.661, 330 354.265, 330 387.500 C 330 428.530, 343.619 464.770, 372.464 500.500 C 381.227 511.355, 391.863 523, 393.013 523 C 393.473 523, 392.939 520.413, 391.826 517.250 C 386.456 501.978, 383.425 479.161, 384.381 461.207 C 386.202 427.034, 397.234 397.023, 419.378 366 C 428.653 353.006, 435.833 344.406, 455.991 322.142 C 495.817 278.158, 507.270 263.382, 517.796 242.407 C 527.806 222.460, 531.653 205.093, 530.570 184.750 C 530.225 178.287, 530.212 173, 530.540 173 C 531.649 173, 540.134 192.235, 543.510 202.402 C 548.370 217.035, 550.026 226.471, 550.073 239.799 C 550.160 264.600, 542.080 286.761, 524.794 309.127 C 514.800 322.058, 505.731 331.353, 482.344 352.633 C 482.344 352.633, 482.344 352.633, 482.344 352.633 M 482.344 352.633 C 456.848 375.832, 446.897 386.498, 436.922 401.319 C 418.522 428.659, 410.013 454.831, 410.004 484.119 C 409.997 505.495, 413.840 521.549, 423.977 542.500 C 435.153 565.596, 452.715 588.801, 478.470 614.500 C 492.849 628.848, 505.769 640.592, 506.405 639.893 C 506.602 639.677, 505.670 635.900, 504.335 631.500 C 489.543 582.748, 495.516 541.144, 523.071 501 C 533.532 485.761, 542.109 475.917, 567.502 450.009 C 601.158 415.670, 613.074 402.149, 625.677 384 C 646.804 353.576, 659.614 323.730, 665.166 292 C 666.893 282.131, 666.859 248.904, 665.112 239 C 660.410 212.348, 652.397 188.790, 638.773 161.563 C 613.881 111.817, 575.246 62.747, 536.500 31.667 C 521.340 19.506, 521.722 19.626, 524.621 27.961" />
              {/* Flame Glyph 3 (Right Flame Part) */}
              <path d="M 683.407 261 C 683.710 263.475, 684.252 274.076, 684.612 284.557 C 685.754 317.773, 681.910 338.483, 669.880 363.934 C 657.377 390.383, 639.583 412.119, 599.586 449.802 C 553.094 493.605, 538.796 510.397, 525.689 536.591 C 514.624 558.703, 510.417 577.454, 511.267 600.878 C 511.929 619.143, 514.964 630.203, 524.748 650 L 531.420 663.500 532.095 656.500 C 532.985 647.265, 534.500 641.942, 538.501 633.999 C 548.492 614.158, 571.720 590.927, 624 548.485 C 650.295 527.138, 662.930 515.963, 674.344 503.959 C 703.564 473.228, 719.243 444.416, 725.116 410.658 C 728.091 393.563, 727.390 365.835, 723.571 349.519 C 720.427 336.089, 717.095 325.631, 711.777 312.500 C 707.307 301.463, 692.405 271.895, 686.578 262.500 L 682.857 256.500 683.407 261" stroke="none" fill="black" fillRule="evenodd"/>
            </g>

            {/* --- GROUP 2: THE HHC LETTERS ON TOP --- */}
            <g fillRule="evenodd" stroke="none">
              
              {/* Rightmost Glyph - The 'C' (Reverted to USC Deep Red #990000) */}
              <path d="M 813.500 63.561 C 811.850 63.785, 806.675 64.481, 802 65.107 C 746.107 72.599, 701.343 118.936, 690.884 180.129 C 689.037 190.938, 688.837 195.089, 689.305 213 C 689.752 230.117, 690.252 235.233, 692.335 244 C 697.204 264.496, 702.634 277.342, 712.942 292.752 C 731.373 320.308, 759.069 338.052, 796.435 346.244 C 805.377 348.205, 809.402 348.451, 832.500 348.454 C 857.010 348.457, 859.225 348.301, 871.146 345.744 C 890.488 341.594, 914.961 333.164, 915.031 330.627 C 915.048 330.007, 916.766 317.716, 918.848 303.313 L 922.634 277.125 920.173 276.507 C 918.819 276.167, 917.354 276.252, 916.917 276.695 C 916.481 277.138, 914.517 281.263, 912.552 285.862 C 903.551 306.934, 888.845 323.021, 871.107 331.201 C 857.108 337.657, 831.827 340.040, 814.962 336.492 C 780.851 329.317, 753.412 301.239, 740.210 260 C 729.279 225.859, 728.195 180.807, 737.525 148.470 C 747.085 115.340, 767.866 90.175, 794.016 80.062 C 806.553 75.214, 816.462 73.677, 831.419 74.262 C 851.816 75.059, 867.637 80.615, 881.534 91.859 C 892.100 100.408, 903.220 117.070, 909.738 134.120 C 913.476 143.900, 913.521 143.962, 916.904 143.981 L 920.307 144 919.654 131.843 C 919.294 125.157, 919 109.909, 919 97.960 C 919 77.752, 918.872 76.200, 917.171 75.755 C 916.165 75.492, 914.504 75.889, 913.480 76.638 C 910.206 79.032, 903.174 78.124, 885.308 73.001 C 875.720 70.251, 862.840 67.094, 856.687 65.985 C 846.139 64.084, 820.326 62.635, 813.500 63.561" fill="#990000" />
              
              {/* Leftmost Glyph - The First 'H' (White #FFFFFF) */}
              <path d="M 115 69.406 C 115 71.522, 115.579 71.892, 119.800 72.473 C 130.810 73.987, 136.894 81.276, 139.021 95.500 C 139.716 100.143, 139.969 139.039, 139.772 211 C 139.498 311.539, 139.347 319.882, 137.714 324.703 C 134.541 334.064, 127.262 339.928, 118.750 339.978 C 115.423 339.998, 115 340.282, 115 342.500 L 115 345 159.500 345 L 204 345 204 342.500 C 204 340.331, 203.557 340, 200.649 340 C 193.161 340, 186.531 335.860, 183.032 329 C 179.305 321.693, 179 316.359, 179 258.444 L 179 201.986 249.250 202.243 L 319.500 202.500 319.500 260 C 319.500 312.980, 319.355 317.972, 317.661 323.500 C 316.650 326.800, 314.677 331.011, 313.277 332.859 C 310.247 336.858, 303.943 339.948, 298.750 339.978 C 295.423 339.998, 295 340.282, 295 342.500 L 295 345 339.500 345 L 384 345 384 342.500 C 384 340.305, 383.569 340, 380.468 340 C 372.267 340, 365.291 334.805, 361.753 326.066 L 359.500 320.500 359.225 208.622 C 358.983 110.311, 359.137 96.012, 360.497 90.704 C 363.423 79.284, 367.972 74.628, 378.031 72.757 C 383.294 71.778, 384.052 71.359, 383.795 69.565 C 383.502 67.514, 383.205 67.500, 339.083 67.500 L 294.666 67.500 294.506 69.662 C 294.371 71.503, 295.029 71.923, 298.924 72.481 C 305.526 73.427, 311.144 76.444, 313.907 80.526 C 319.116 88.222, 319.347 90.714, 319.755 143.750 L 320.135 193 249.517 193 L 178.898 193 179.220 142.250 C 179.509 96.767, 179.723 91.040, 181.291 87.069 C 185.035 77.580, 189.510 73.965, 199.250 72.562 C 203.431 71.959, 204 71.585, 204 69.439 L 204 67 159.500 67 L 115 67 115 69.406" fill="#FFFFFF" />
              
              {/* Middle Glyph - The Second 'H' (White #FFFFFF) */}
              <path d="M 402.667 67.667 C 402.048 68.286, 401.692 71.993, 402.250 72.006 C 402.387 72.009, 405.137 72.443, 408.360 72.971 C 419.722 74.832, 425.085 82.198, 426.953 98.506 C 428.271 110.007, 428.332 301.189, 427.022 313 C 425.872 323.364, 424.665 327.717, 421.736 332.064 C 418.774 336.459, 414.335 338.936, 408.097 339.675 C 403.578 340.210, 403 340.546, 403 342.639 L 403 345 447.500 345 L 492 345 492 342.500 C 492 340.441, 491.515 339.999, 489.250 339.994 C 480.146 339.976, 472.448 334.155, 469.383 324.972 C 467.715 319.973, 467.529 314.462, 467.234 261.250 L 466.910 203 537.007 203 L 607.104 203 606.793 261.250 C 606.506 314.917, 606.336 319.893, 604.638 324.500 C 600.974 334.437, 596.349 338.393, 586.797 339.762 C 582.352 340.399, 581.449 340.881, 581.180 342.760 L 580.861 345 626.430 345 L 672 345 672 342.640 C 672 340.513, 671.454 340.223, 666.459 339.708 C 656.908 338.722, 651.867 334.257, 648.262 323.588 C 646.687 318.928, 646.515 309.551, 646.222 212 C 645.890 101.966, 646.149 92.999, 649.901 84.500 C 652.240 79.200, 658.007 74.252, 662.729 73.492 C 670.697 72.209, 671 72.063, 671 69.481 L 671 67 626.500 67 L 582 67 582 69.796 C 582 72.318, 582.366 72.614, 585.750 72.823 C 595.255 73.411, 601.634 78.756, 604.710 88.709 C 606.326 93.936, 606.500 99.221, 606.500 143 C 606.500 169.675, 606.163 191.613, 605.750 191.750 C 605.337 191.887, 573.950 192, 536 192 L 467 192 467.008 146.250 C 467.016 97.034, 467.506 90.525, 471.809 82.563 C 474.990 76.676, 479.075 74.017, 486.287 73.136 C 491.045 72.555, 491.528 72.260, 491.816 69.750 L 492.133 67 447.733 67 C 423.313 67, 403.033 67.300, 402.667 67.667" fill="#FFFFFF" />
            </g>
          </svg>
        </div>

        <p className="text-center text-[#FFCC00] text-xs tracking-[0.3em] uppercase mb-8 font-semibold opacity-90">
          Hestia Portal
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 text-sm tracking-wide 
            focus:outline-none focus:border-[#990000] focus:ring-1 focus:ring-[#990000] 
            transition-all duration-300"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 text-sm tracking-wide 
            focus:outline-none focus:border-[#990000] focus:ring-1 focus:ring-[#990000] 
            transition-all duration-300"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-4 rounded-xl transition-all duration-300 shadow-lg tracking-wider disabled:opacity-70 mt-4 border border-transparent 
              ${loading 
                ? "bg-[#FFCC00] text-black animate-[button-ignition_0.5s_infinite_ease-in-out]" 
                : "bg-[#990000] hover:bg-[#7a0000] hover:shadow-[0_0_20px_rgba(153,0,0,0.7)] text-white hover:border-[#FFCC00]/30"
              }`}
          >
            {loading ? "IGNITING DASHBOARD..." : "SECURE SIGN IN"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600 mt-8 font-medium">
          © {new Date().getFullYear()} Hestia Homecare
        </p>
      </div>
    </div>
  );
}

export default Login;