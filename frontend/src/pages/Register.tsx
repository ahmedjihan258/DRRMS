import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/services";
import { Skill } from "../types";

export default function Register() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSkills().then(setAvailableSkills).catch(console.error);
  }, []);

  const handleSkillToggle = (id: number) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(sk => sk !== id) : [...prev, id]
    );
  };

  // Sync inputs to location state
  useEffect(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation({ lat, lng });
    } else {
      setLocation(null);
    }
  }, [latInput, lngInput]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Basic client-side validation
    if (!userName || !email || !password) {
      setErr("All fields are required.");
      return;
    }

    try {
      await api.register({
        user_name: userName,
        email,
        password,
        role,
        skills: role === 'VOLUNTEER' ? selectedSkills : undefined,
        latitude: location?.lat,
        longitude: location?.lng
      });
      // Redirect to login after successful registration
      navigate("/login");
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">DRRMS Register</h1>
        <p className="text-slate-500 mt-1 text-sm">Create an account to get started.</p>

        {err && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            {err}
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm text-slate-600">Full Name</label>
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-600">Email</label>
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-600">Role</label>
          <select
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="CITIZEN">Citizen</option>
            <option value="VOLUNTEER">Volunteer</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Volunteers can assist in disaster relief efforts.
          </p>
        </div>

        {role === 'VOLUNTEER' && availableSkills.length > 0 && (
          <div className="mt-4">
            <label className="text-sm text-slate-600 block mb-2">Select Skills</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-100 p-2 rounded-lg">
              {availableSkills.map(skill => (
                <label key={skill.id} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{skill.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {role === 'VOLUNTEER' && (
          <div className="mt-4">
            <label className="text-sm text-slate-600 block mb-2">Location Coordinates</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enter your GPS coordinates (e.g. 23.8103, 90.4125)
            </p>
          </div>
        )}

        <button className="mt-6 w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 font-medium">
          Create Account
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
