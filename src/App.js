import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

const AssemblyAIComponent = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // console.log("API Key:", process.env.REACT_APP_API_KEY);

  const API_KEY = process.env.REACT_APP_API_KEY;

  // console.log(API_KEY)

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Upload file to AssemblyAI
  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);
    setProgress(30);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Uploading file to AssemblyAI...");

      // Upload audio file
      const uploadResponse = await fetch(
        "https://api.assemblyai.com/v2/upload",
        {
          method: "POST",
          headers: {
            Authorization: process.env.REACT_APP_API_KEY, 
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.upload_url;
      console.log("File uploaded. URL:", audioUrl);

      setProgress(60);

      // Transcription request
      const transcriptResponse = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            Authorization: process.env.REACT_APP_API_KEY, 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audio_url: audioUrl }),
        }
      );

      if (!transcriptResponse.ok)
        throw new Error("Transcription request failed");

      const transcriptData = await transcriptResponse.json();
      console.log("Transcription started. ID:", transcriptData.id);

      setProgress(90);

      // Check transcription status
      let transcriptResult;
      while (true) {
        const statusResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
          {
            method: "GET",
            headers: { Authorization: API_KEY },
          }
        );

        transcriptResult = await statusResponse.json();
        console.log("Checking status:", transcriptResult.status);

        if (transcriptResult.status === "completed") break;
        if (transcriptResult.status === "failed")
          throw new Error("Transcription failed");

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setTranscription(transcriptResult.text);
      console.log("Transcription completed:", transcriptResult.text);

      setProgress(100);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-400 p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          🎙️ Audio Transcription
        </h1>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-gray-50 transition">
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <UploadCloud className="w-12 h-12 text-blue-500" />
            <p className="text-gray-600 mt-2">Click or Drag & Drop to Upload</p>
            <input
              id="file-upload"
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        {file && (
          <p className="text-center text-gray-700 mt-2">📂 {file.name}</p>
        )}

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          className={`w-full mt-4 bg-blue-500 text-white p-3 rounded-lg font-semibold transition ${
            uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          disabled={uploading}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" /> Uploading...
            </div>
          ) : (
            "Upload & Transcribe"
          )}
        </button>

        {/* Progress Bar */}
        {uploading && (
          <div className="w-full bg-gray-200 h-2 rounded-lg overflow-hidden mt-4">
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Transcription Result */}
        <h2 className="mt-6 text-lg font-semibold text-gray-800">
          📝 Transcription:
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center h-[20rem] overflow-auto border p-2 rounded">
          {transcription || "Upload a file to get the transcription."}
        </p>
      </div>
    </div>
  );
};

export default AssemblyAIComponent;
