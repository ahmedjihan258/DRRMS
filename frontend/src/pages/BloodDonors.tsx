import { useEffect, useState } from "react";
import { Heart, Activity, Calendar, Droplet, Loader2, AlertCircle, Search, Phone, Mail } from "lucide-react";
import { api } from "../api/services";
import { auth } from "../api/auth";

interface Donor {
    id: number;
    user_name: string;
    email?: string;
    phone_number?: string;
    blood_group: string;
    last_donation_date: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    eligibility_status: 'ELIGIBLE' | 'NOT_ELIGIBLE';
    next_eligible_date: string | null;
}

export default function BloodDonors() {
    const [donors, setDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDonor, setIsDonor] = useState(false);
    const [myDonorProfile, setMyDonorProfile] = useState<any>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Registration Form
    const [bloodGroup, setBloodGroup] = useState("A+");
    const [lastDonation, setLastDonation] = useState("");
    const [regLoading, setRegLoading] = useState(false);

    // Filter
    const [filterGroup, setFilterGroup] = useState("ALL");

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const data = await api.getBloodDonors();
            setDonors(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const init = async () => {
        try {
            const me = await auth.getMe();
            setCurrentUserRoles(me.roles || []);

            const myProfile = await api.getMyDonorProfile();
            setIsDonor(myProfile.is_donor);
            setMyDonorProfile(myProfile.donor);
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        fetchDonors();
        init();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);
        try {
            await api.registerDonor({
                blood_group: bloodGroup,
                last_donation_date: lastDonation || null
            });
            setShowRegisterModal(false);
            fetchDonors();
            init();
        } catch (err: any) {
            alert(err.message || "Failed");
        } finally {
            setRegLoading(false);
        }
    };

    const toggleStatus = async () => {
        if (!myDonorProfile) return;
        const newStatus = myDonorProfile.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.updateDonorProfile({ status: newStatus });
            init();
            fetchDonors();
        } catch (e) {
            console.error(e);
        }
    };

    const updateLastDonation = async (date: string) => {
        try {
            await api.updateDonorProfile({ last_donation_date: date });
            init();
            fetchDonors();
        } catch (e) {
            console.error(e);
        }
    };

    const isPrivileged = currentUserRoles.some(r => ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(r));

    const filteredDonors = donors.filter(d => {
        const matchesGroup = filterGroup === 'ALL' || d.blood_group === filterGroup;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = d.user_name.toLowerCase().includes(searchLower) ||
            (d.email && d.email.toLowerCase().includes(searchLower)) ||
            (d.phone_number && d.phone_number.includes(searchLower));
        return matchesGroup && matchesSearch;
    });

    if (loading && donors.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
                        Blood Donors
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium">Coordinate emergency blood supply and connect with active donors.</p>
                </div>

                {!isDonor ? (
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-rose-900/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Droplet className="w-5 h-5" />
                        Become a Donor
                    </button>
                ) : (
                    <div
                        className="flex items-center gap-4 p-2 pr-6 rounded-2xl border transition-all"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center font-bold text-sm">
                            {myDonorProfile?.blood_group}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">My Visibility</span>
                            <button
                                onClick={toggleStatus}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all uppercase tracking-tighter ${myDonorProfile?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                            >
                                {myDonorProfile?.status}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* My Status Card if Donor */}
            {isDonor && myDonorProfile && (
                <div
                    className="p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(255, 255, 255, 0.03) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(244, 63, 94, 0.1)'
                    }}
                >
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-rose-500/10 rounded-2xl shadow-lg border border-rose-500/20 text-rose-400 animate-pulse">
                            <Activity className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white tracking-tight text-lg">Donation Eligibility Tracker</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-rose-500/40" />
                                    Last Donation: <span className="text-white font-bold">{myDonorProfile.last_donation_date || 'Never Recorded'}</span>
                                </p>
                                <span className="text-[10px] bg-white/5 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-white/5 italic">90 days cycle enforced</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 w-full md:w-auto overflow-hidden group hover:border-white/20 transition-all">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                className="bg-transparent pl-5 pr-10 py-3 text-white text-sm font-bold focus:outline-none outline-none appearance-none w-full cursor-pointer custom-calendar-icon"
                                onChange={(e) => {
                                    if (confirm("Update last donation date? This will affect your eligibility status.")) {
                                        updateLastDonation(e.target.value);
                                    }
                                }}
                            />
                        </div>
                        <div className="px-6 py-3 bg-white/5 border-l border-white/10 flex items-center justify-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Update Log</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Donor List Controls */}
            <div
                className="rounded-3xl shadow-2xl overflow-hidden transition-all duration-300"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto custom-scrollbar">
                        {['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <button
                                key={bg}
                                onClick={() => setFilterGroup(bg)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterGroup === bg
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20'
                                    : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                    }`}
                            >
                                {bg}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Find life savers..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 select-none">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Donor Identity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Group</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Coordinate Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredDonors.map(donor => (
                                <tr key={donor.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                                                {donor.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white tracking-tight">{donor.user_name}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Verified Donor</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-4 py-1.5 rounded-xl border border-rose-500/10 shadow-sm">
                                            {donor.blood_group}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 w-fit ${donor.eligibility_status === 'ELIGIBLE'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-emerald-500/10'
                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${donor.eligibility_status === 'ELIGIBLE' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
                                            {donor.eligibility_status === 'ELIGIBLE' ? 'Ready to Assist' : donor.next_eligible_date}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col items-end gap-1.5">
                                            {isPrivileged ? (
                                                <>
                                                    <div className="flex items-center gap-2.5 text-white text-sm font-bold tracking-tight">
                                                        <Phone className="w-3.5 h-3.5 text-rose-500/40" />
                                                        {donor.phone_number || <span className="text-slate-600 italic">N/A</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                                                        <Mail className="w-3 h-3 text-slate-700" />
                                                        {donor.email || "No Email"}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">
                                                    Restricted Access
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredDonors.length === 0 && (
                        <div className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <Heart className="w-16 h-16 text-slate-700/50" />
                                <div>
                                    <p className="text-white font-bold uppercase tracking-widest text-sm mb-1">No matches in our network</p>
                                    <p className="text-slate-500 text-sm">Try widening your search or blood group requirements.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 transition-all">
                    <div
                        className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <div className="p-10">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Droplet className="w-8 h-8 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                Donor Enrollment
                            </h3>
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Blood Registry Group</label>
                                    <select
                                        value={bloodGroup}
                                        onChange={e => setBloodGroup(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Legacy Log (Optional)</label>
                                    <input
                                        type="date"
                                        value={lastDonation}
                                        onChange={e => setLastDonation(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 custom-calendar-icon"
                                    />
                                    <p className="text-[10px] text-slate-500 font-medium italic px-1">Entry of your most recent contribution cycle.</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterModal(false)}
                                        className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={regLoading}
                                        className="flex-1 px-4 py-4 bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-500 shadow-xl shadow-rose-900/20 transition-all flex items-center justify-center disabled:opacity-50 active:scale-95"
                                    >
                                        {regLoading ? 'Processing...' : 'Complete Registry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
