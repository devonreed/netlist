
import { useState, useEffect } from "react";
import Schematic from './Schematic.tsx';
import UserNetlists from './UserNetlists.tsx';
import type { Netlist } from "./Netlist";
import FileUploadButton from './FileUploadButton.tsx';

export default function Netlist() {
  const [email, setEmail] = useState<string>('');
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [netlist, setNetlist] = useState<Netlist | null>(null);
  const [errors, setErrors] = useState<Array<string>>([]);

  useEffect(() => {
    console.log("Draw/Redraw");
  }, [netlist, errors]);

  const handleUploadComplete = (jsonString: string) => {
    try {
      const jsonObj = JSON.parse(jsonString);
      setNetlist(jsonObj as Netlist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleErrors = (errors: Array<string>) => {
    setErrors(errors);
  }

  const handleSave = async () => {
    if (!netlist || !email) {
      alert("Missing email or netlist.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8000/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          netlist: netlist,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
  
      alert("Netlist saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save netlist.");
    }
  };

  const handleEmailSubmit = () => {
    if (email.trim()) {
      setEmailSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-6">
      {!emailSubmitted ? (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleEmailSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <UserNetlists email={email} />
          <FileUploadButton onUploadComplete={handleUploadComplete} onErrors={handleErrors} />

          {netlist && (
            <div className="w-full max-w-5xl">
              <Schematic netlist={netlist} />
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSave}
                  className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Error{errors.length > 1 ? 's' : ''}:</strong>
              <ul className="list-disc list-inside mt-2">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
