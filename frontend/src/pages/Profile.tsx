import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, Loader2, CheckCircle, AlertTriangle, Shield, BadgeCheck, XCircle } from "lucide-react";
import { api } from "../api/services";
import { auth, MeResponse } from "../api/auth";
import { Volunteer } from "../types";

export default function Profile() {
    const [me, setMe] = useState<MeResponse["user"] | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form inputs
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const fetchData = async () => {
        try {
            const userData = await auth.getMe();
            if (userData.user) {
                setMe(userData.user);
                setUserName(userData.user.user_name || "");
                setEmail(userData.user.email || "");
                setPhone(userData.user.phone_number || "");
            }
            if (userData.roles) {
                setRoles(userData.roles);
                if (userData.roles.includes('VOLUNTEER')) {
                    try {
                        const vol = await api.getVolunteerProfile();
                        setVolunteer(vol);
                    } catch (e) {
                        console.error("Failed to load volunteer profile");
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.updateProfile({
                user_name: userName,
                email,
                phone_number: phone
            });
            setMessage({ type: 'success', text: "Profile updated successfully." });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const handleAvailabilityToggle = async () => {
        if (!volunteer) return;
        const newStatus = volunteer.availability === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';

        try {
            await api.setMyAvailability(newStatus);
            setVolunteer({ ...volunteer, availability: newStatus });
            // setMessage({ type: 'success', text: `Status changed to ${newStatus}` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || "Failed to change status" });
        }
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    const roleLabel = roles[0] || "User";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ID Card / Overview */}
                <div className="md:col-span-1 space-y-6">
                    <div
                        className="p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        <div className="w-24 h-24 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{userName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 uppercase border
                                ${roleLabel === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                    roleLabel === 'VOLUNTEER' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        roleLabel === 'AUTHORITY' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                            'bg-slate-500/20 text-slate-300 border-white/10'}`}>
                                <Shield className="w-3 h-3" />
                                {roleLabel}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">Member since {new Date(me?.created_at || "").toLocaleDateString()}</p>
                    </div>

                    {roles.includes('VOLUNTEER') && volunteer && (
                        <>
                            {/* Status Card */}
                            <div
                                className="p-6 rounded-2xl shadow-2xl mb-6 relative overflow-hidden group"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)'
                                }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>

                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4 text-blue-400" />
                                    Volunteer Status
                                </h3>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 mb-6">
                                    <span className="text-sm font-medium text-slate-300">Current Status</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${volunteer.availability === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                        {volunteer.availability}
                                    </span>
                                </div>

                                <button
                                    onClick={handleAvailabilityToggle}
                                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-tight
                                    ${volunteer.availability === 'AVAILABLE'
                                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40'}`}
                                >
                                    {volunteer.availability === 'AVAILABLE' ? (
                                        <>
                                            <XCircle className="w-4 h-4" /> Go Busy
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" /> Go Available
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* GAMIFICATION: Hero Stats Card */}
                            {(() => {
                                const stats = volunteer.gamification || {
                                    rank: "ROOKIE",
                                    next_rank: "GUARDIAN",
                                    xp: 0,
                                    xp_needed: 500,
                                    missions: 0,
                                    hours: 0,
                                    badges: []
                                };

                                return (
                                    <div
                                        className="p-6 rounded-2xl shadow-2xl relative overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)'
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-yellow-400" />
                                                    {stats.rank} TEIR
                                                </h3>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                                    {stats.rank === 'LEGEND' ? 'Top 1% of Responders' : stats.rank === 'GUARDIAN' ? 'Top 10% of Responders' : 'Rookie Responder'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-white">{stats.xp.toLocaleString()}</span>
                                                <p className="text-[10px] text-slate-400 uppercase">XP Points</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
                                            {/* Calculate percentage: (current_xp / total_for_next_rank) - but wait, ranges are 0-500, 500-2000. */}
                                            {/* Easier visualization: just show raw progress to next relative to this level base? Let's just do a visual approx or based on max */}
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                                style={{ width: `${Math.min(100, (stats.xp / (stats.xp + stats.xp_needed)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-400 text-center mb-6">
                                            {stats.xp_needed > 0 ? (
                                                <>{stats.xp_needed} XP to next rank: <span className="text-white font-bold">{stats.next_rank}</span></>
                                            ) : (
                                                <span className="text-yellow-400 font-bold">MAX RANK ACHIEVED</span>
                                            )}
                                        </p>

                                        {/* Badges Grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-6">
                                            {stats.badges.includes('Aqua Guard') && (
                                                <div className="aspect-square bg-blue-500/20 rounded-xl border border-blue-500/30 flex flex-col items-center justify-center p-2 group hover:bg-white/10 transition-colors cursor-pointer" title="Participated in Flood Incidents">
                                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌊</div>
                                                    <span className="text-[9px] font-bold text-blue-200 uppercase">Aqua Guard</span>
                                                </div>
                                            )}
                                            {stats.badges.includes('Medic') && (
                                                <div className="aspect-square bg-red-500/20 rounded-xl border border-red-500/30 flex flex-col items-center justify-center p-2 group hover:bg-white/10 transition-colors cursor-pointer" title="Medical Skills Verified">
                                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🚑</div>
                                                    <span className="text-[9px] font-bold text-red-200 uppercase">Medic</span>
                                                </div>
                                            )}
                                            {stats.badges.includes('Night Owl') && (
                                                <div className="aspect-square bg-purple-500/20 rounded-xl border border-purple-500/30 flex flex-col items-center justify-center p-2 group hover:bg-white/10 transition-colors cursor-pointer" title="Night Shift Operations">
                                                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌙</div>
                                                    <span className="text-[9px] font-bold text-purple-200 uppercase">Night Owl</span>
                                                </div>
                                            )}
                                            {stats.badges.length === 0 && (
                                                <div className="col-span-3 text-center text-[10px] text-slate-500 py-4 italic border border-dashed border-slate-700/50 rounded-xl">
                                                    Help in missions to earn badges!
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                                                <span className="block text-xl font-bold text-emerald-400">{stats.missions}</span>
                                                <span className="text-[10px] uppercase text-emerald-200/70 font-bold">Missions</span>
                                            </div>
                                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-center">
                                                <span className="block text-xl font-bold text-blue-400">{stats.hours}h</span>
                                                <span className="text-[10px] uppercase text-blue-200/70 font-bold">Service</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                    <div
                        className="p-8 rounded-2xl shadow-2xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-6 tracking-tight uppercase tracking-widest text-[10px]">Edit Details</h3>

                        {message && (
                            <div className={`mb-8 p-4 rounded-xl flex items-center text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertTriangle className="w-5 h-5 mr-3" />}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 pl-10 pr-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={userName}
                                        onChange={e => setUserName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        className="w-full bg-white/5 pl-10 pr-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="tel"
                                        className="w-full bg-white/5 pl-10 pr-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+880..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
