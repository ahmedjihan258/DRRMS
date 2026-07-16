import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/services";
import { auth } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    try {
      const res = await api.login({ email, password });
      auth.setToken(res.token);
      navigate("/", { replace: true });
    } catch (e: any) {
      setErr(e.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">DRRMS Login</h1>
        <p className="text-slate-500 mt-1 text-sm">Sign in to continue.</p>

        {err && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            {err}
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm text-slate-600">Email</label>
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="mt-6 w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">
          Login
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
