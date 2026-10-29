import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Locate, Shield, User, Mail, Phone, Lock, UserCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { api } from "../api/services";
import LeafletMap from "../components/common/LeafletMap";

export default function Register() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        alert("Unable to retrieve your location");
      }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!userName || !email || !password || !phone) {
      setErr("All critical data fields required for registry.");
      return;
    }

    setLoading(true);
    try {
      await api.register({
        user_name: userName,
        email,
        password,
        role,
        phone_number: phone,
        latitude: location?.lat,
        longitude: location?.lng
      });
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setErr(e.message || "Registry entry failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden py-20"
      style={{
        background: '#020617',
      }}
    >
      {/* High-End Design Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-20 filter blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        ></div>
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20 filter blur-[120px] animate-pulse delay-700"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
        ></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl transition-all"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Personnel Registry</h1>
        </div>

        <div
          className="rounded-[40px] shadow-2xl p-8 md:p-12 overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <form onSubmit={submit} className="space-y-8">
            {err && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                <AlertTriangle className="w-4 h-4 inline-block mr-2 -mt-1" />
                {err}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Legal Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Registry Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                  <input
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Contact</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                  <input
                    type="tel"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-400 transition-all" />
                  <input
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Role Classification</label>
              <div className="relative">
                <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600" />
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-bold tracking-widest text-[10px] uppercase"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="CITIZEN" className="bg-slate-900">Standard Citizen</option>
                  <option value="VOLUNTEER" className="bg-slate-900">Field Volunteer</option>
                </select>
              </div>
            </div>

            {role === 'VOLUNTEER' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deployment Point Selection</label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="flex items-center text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all uppercase tracking-tight"
                    >
                      <Locate className="w-3 h-3 mr-1" />
                      Active Coordinate Target
                    </button>
                  </div>
                  <div className="h-72 rounded-[32px] overflow-hidden border border-white/10 ring-8 ring-white/5">
                    <LeafletMap
                      mode="pick"
                      initialPosition={location || undefined}
                      onPositionChange={(pos: { lat: number, lng: number }) => setLocation(pos)}
                      height="100%"
                    />
                  </div>
                  {location && (
                    <div className="flex justify-center">
                      <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5 text-[9px] font-bold text-blue-400 tracking-widest uppercase">
                        Locked: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
            >
              {loading ? "Synchronizing Data..." : (
                <>
                  Complete Registry
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Already registered?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-all hover:underline decoration-2 underline-offset-4">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
