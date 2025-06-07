import React, { useEffect, useState } from "react";
import type { Netlist } from "./Netlist";

type UserNetlistsProps = {
  email: string;
  onLoad: (filename: string, content: string, errors: Array<string>) => void;
};

const UserNetlists: React.FC<UserNetlistsProps> = ({ email, onLoad }) => {
  const [netlists, setNetlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNetlists = async () => {
      if (!email) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`http://localhost:8000/list?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        setNetlists(data.netlists);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchNetlists();
  }, [email]);

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/delete_by_filename/${encodeURIComponent(email)}/${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setNetlists((prev) => prev.filter((item) => item.filename !== filename));
    } catch (err: any) {
      alert(`Failed to delete "${filename}": ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-2">Saved Netlists for {email}</h2>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {netlists.length > 0 ? (
        <ul className="list-disc list-inside space-y-1">
          {netlists.map((item) => (
            <li key={item._id} className="text-sm font-mono flex justify-between items-center">
                <span className="truncate">
                {item.valid ? "✅" : "❌"}&nbsp;{item.filename}
                </span>
                <div className="flex space-x-4">
                <button
                    onClick={() => onLoad(item.filename, JSON.stringify(item.netlist), item.errors)}
                    className="text-blue-600 hover:underline text-xs"
                >
                    Load
                </button>
                <button
                    onClick={() => handleDelete(item.filename)}
                    className="text-red-600 hover:underline text-xs"
                >
                    Delete
                </button>
                </div>
            </li>
          ))}
        </ul>
      ) : !loading && (
        <p className="text-gray-500 text-sm">No netlists found.</p>
      )}
    </div>
  );
};

export default UserNetlists;