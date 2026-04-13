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
      setStatusMessage("⚠️ Please upload a CSV file.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("🚀 Ingesting CSV and updating Master Roster... This may take a minute.");

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('http://127.0.0.1:8000/api/run-processor', {
        method: 'POST',
        body: formData 
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        throw new Error(data.message);
      }
      
      setStatusMessage(`✅ ${data.message} View them in the Ranked Leads tab.`);
      setCsvFile(null);
      document.getElementById('csv-upload').value = '';

    } catch (error) {
      console.error("Processor Error:", error);
      setStatusMessage(`❌ Error: ${error.message || "Failed to connect to processor. Is your Python server running?"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <div className="max-w-3xl mx-auto pb-12 pt-12">
        
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Dashboard
          </Link>
          
          <h1 className="text-2xl font-semibold text-white">Update Master Roster</h1>
          <p className="text-gray-400 text-sm mt-1">Upload an Indeed export to identify new candidates and lock them into your database.</p>
        </div>

        <form onSubmit={handleRunProcessor} className="space-y-6">
          
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Upload Candidates</h2>
            
            <div className="flex flex-col w-full mb-2">
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-[#2a2a2a] file:text-white
                  hover:file:bg-[#3a3a3a] file:transition-colors file:cursor-pointer
                  bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg cursor-pointer focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              *The AI will process new names to determine their language profile. Existing candidates in your database will be skipped automatically to save time.
            </p>
          </div>

          {statusMessage && (
            <div className={`p-4 rounded-lg border ${statusMessage.includes('✅') ? 'bg-green-900/20 border-green-900/50 text-green-400' : statusMessage.includes('❌') || statusMessage.includes('⚠️') ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-blue-900/20 border-blue-900/50 text-blue-400'}`}>
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className={`bg-white text-black font-medium px-8 py-3 rounded-lg hover:bg-gray-200 transition-all shadow-lg focus:outline-none flex items-center ${
                isProcessing ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Upload to Roster"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}