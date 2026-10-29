import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/services";
import { auth } from "../api/auth";
import { Shield, Lock, Mail, ArrowRight, AlertTriangle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      auth.setToken(res.token);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: '#020617',
      }}
    >
      {/* High-End Design Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 filter blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        ></div>
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-20 filter blur-[120px] animate-pulse delay-700"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl animate-float transition-all"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <Shield className="w-8 h-8 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">DRRMS</h1>
        </div>

        <div
          className="rounded-[32px] shadow-2xl p-8 md:p-10 overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Authentication</h2>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {err && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center animate-shake">
                <AlertTriangle className="w-3 h-3 inline-block mr-2 -mt-1" />
                {err}
                {err.toLowerCase().includes("verify") && (
                  <div className="mt-2">
                    <Link
                      to={`/verify?email=${encodeURIComponent(email)}`}
                      className="text-white hover:text-blue-300 underline decoration-2 underline-offset-4 transition-all"
                    >
                      Verify Now →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  placeholder="operator@drrms.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
            >
              {loading ? "Verifying..." : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Not registered?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-all hover:underline decoration-2 underline-offset-4">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
