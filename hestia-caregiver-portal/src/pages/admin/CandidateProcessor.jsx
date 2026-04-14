import { useState } from "react";
import { Link } from "react-router-dom";

export default function CandidateProcessor() {
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleRunProcessor = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      setStatusMessage("warning:Please upload a CSV file before continuing.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("loading:Processing your CSV and updating the Master Roster. This may take a moment...");

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const apiKey = import.meta.env.VITE_PROCESSOR_API_KEY;

      const response = await fetch(`${apiUrl}/api/run-processor`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        throw new Error(data.detail || data.message || "Failed to process CSV");
      }

      setStatusMessage(`success:${data.message} View them in the Ranked Leads tab.`);
      setCsvFile(null);
      document.getElementById('csv-upload').value = '';

    } catch (error) {
      console.error("Processor Error:", error);
      setStatusMessage(`error:${error.message || "Failed to connect to processor. Is your Python server running?"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusStyle = (msg) => {
    if (msg.startsWith("success:")) return { bg: "rgba(34,166,118,0.08)", border: "rgba(34,166,118,0.25)", color: "#22A676", icon: "✓", text: msg.replace("success:", "") };
    if (msg.startsWith("error:")) return { bg: "rgba(196,24,88,0.07)", border: "rgba(196,24,88,0.2)", color: "#C41858", icon: "✕", text: msg.replace("error:", "") };
    if (msg.startsWith("warning:")) return { bg: "rgba(232,149,27,0.08)", border: "rgba(232,149,27,0.2)", color: "#C47B10", icon: "!", text: msg.replace("warning:", "") };
    return { bg: "rgba(107,91,154,0.08)", border: "rgba(107,91,154,0.2)", color: "#6B5B9A", icon: "…", text: msg.replace("loading:", "") };
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:opacity-70" style={{ color: "#8C6B60" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#2C1810]">Update Master Roster</h1>
        <p className="text-sm mt-1" style={{ color: "#8C6B60" }}>
          Upload an Indeed export to identify new candidates and add them to your database.
        </p>
      </div>

      <form onSubmit={handleRunProcessor} className="space-y-5">

        {/* Upload Card */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#EDE3DC", boxShadow: "0 1px 8px rgba(44,24,16,0.05)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: "#C41858" }}>
            Upload Candidates CSV
          </h2>

          {/* Drop zone */}
          <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
            style={{ borderColor: csvFile ? "#C41858" : "#EDE3DC", background: csvFile ? "rgba(196,24,88,0.04)" : "#FAF7F4" }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: csvFile ? "rgba(196,24,88,0.1)" : "#F0E8E4" }}>
                <svg className="w-5 h-5" fill="none" stroke={csvFile ? "#C41858" : "#B59890"} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              {csvFile ? (
                <>
                  <p className="text-sm font-semibold" style={{ color: "#C41858" }}>{csvFile.name}</p>
                  <p className="text-xs" style={{ color: "#8C6B60" }}>Click to replace</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#2C1810]">Click to upload CSV</p>
                  <p className="text-xs" style={{ color: "#8C6B60" }}>Indeed export file (.csv)</p>
                </>
              )}
            </div>
            <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>

          <p className="text-xs mt-4 leading-relaxed" style={{ color: "#B59890" }}>
            The AI will process new candidate names to determine their language profile.
            Existing candidates in your database will be skipped automatically to save processing time.
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (() => {
          const s = getStatusStyle(statusMessage);
          return (
            <div className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ background: s.bg, borderColor: s.border }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: s.border, color: s.color }}>
                {s.icon}
              </span>
              <p className="text-sm" style={{ color: s.color }}>{s.text}</p>
            </div>
          );
        })()}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #C41858, #8B1035)",
              boxShadow: isProcessing ? "none" : "0 4px 16px rgba(196, 24, 88, 0.3)"
            }}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload to Roster
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
