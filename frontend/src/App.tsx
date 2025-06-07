
import { useState, useEffect } from "react";
import Schematic from './Schematic.tsx';
import UserNetlists from './UserNetlists.tsx';
import type { Netlist } from "./Netlist";
import FileUploadButton from './FileUploadButton.tsx';

export default function Netlist() {
  const [email, setEmail] = useState<string>('');
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [emailError, setEmailError] = useState(false);
  const [netlist, setNetlist] = useState<Netlist | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [errors, setErrors] = useState<Array<string>>([]);

  useEffect(() => {
    console.log("Draw/Redraw");
  }, [netlist, errors, email]);

  const handleLoad = (filename: string, content: string, errors: Array<string>) => {
    if (errors.length == 0) {
      handleUploadComplete(filename, content);
    } else {
      handleErrors(errors)
    }
  }

  const handleUploadComplete = (file: string, jsonString: string) => {
    try {
      const jsonObj = JSON.parse(jsonString);
      setFilename(file);
      setNetlist(jsonObj as Netlist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleErrors = (errors: Array<string>) => {
    setErrors(errors);
  }

  const handleClose = async () => {
    setFilename('');
    setNetlist(null);
    setErrors([]);
  };

  const handleLogout = async () => {
    setEmail('');
    setEmailSubmitted(false);
  };

  const handleEmailSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (emailRegex.test(email.trim())) {
      setEmailSubmitted(true);
      setEmailError(false);
    } else {
      setEmailError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-6">
      {!emailSubmitted ? (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
            className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
              emailError ? "border-red-500" : "border-gray-300"
            }`}
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
          {!netlist && errors.length == 0 && <UserNetlists email={email} onLoad={handleLoad} />}
          {!netlist && errors.length == 0 && <FileUploadButton email={email} onUploadComplete={handleUploadComplete} onErrors={handleErrors} />}

          {!netlist && errors.length == 0 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLogout}
                className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          )}

          {(netlist || errors.length > 0) && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleClose}
                className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          )}

          {netlist && (
            <div className="w-full max-w-5xl">
              <h2 className="text-center text-lg font-semibold mb-2">{filename}</h2>
              <Schematic netlist={netlist} />
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
