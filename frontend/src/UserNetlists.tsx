import React, { useEffect, useState } from "react";

type UserNetlistsProps = {
  email: string;
};

const UserNetlists: React.FC<UserNetlistsProps> = ({ email }) => {
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

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-2">Saved Netlists for {email}</h2>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {netlists.length > 0 ? (
        <ul className="list-disc list-inside space-y-1">
          {netlists.map((item) => (
            <li key={item._id} className="text-sm font-mono">
              {item._id}
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