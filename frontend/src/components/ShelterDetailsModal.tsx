import { useState, useEffect, useRef } from "react";
import { X, Home, Users, CheckCircle2, History, AlertTriangle, LogIn, LogOut, Loader2 } from "lucide-react";
import { Shelter } from "../types";
import { api } from "../api/services";

interface ShelterDetailsModalProps {
    shelter: Shelter;
    onClose: () => void;
    onSuccess: () => void;
    userRole?: string;
}

export default function ShelterDetailsModal({ shelter, onClose, onSuccess, userRole = "CITIZEN" }: ShelterDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'occupancy'>('info');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit Form State
    const [formData, setFormData] = useState({
        name: shelter.name,
        location: shelter.location,
        capacity: Number(shelter.capacity),
        current_occupancy: Number(shelter.current_occupancy)
    });

    // Occupancy Log State
    const [logs, setLogs] = useState<any[]>([]);
    const [logForm, setLogForm] = useState({
        person_name: '',
    });
    const submitLock = useRef(false);

    // Residents State
    const [residents, setResidents] = useState<any[]>([]);

    const canEdit = ['ADMIN', 'DISPATCHER'].includes(userRole);
    const canManageOccupancy = ['ADMIN', 'DISPATCHER', 'VOLUNTEER'].includes(userRole);
    const canCheckOut = ['ADMIN', 'DISPATCHER'].includes(userRole); // Only admins/dispatchers can check out
    const canViewResidents = ['ADMIN', 'DISPATCHER'].includes(userRole); // Restrict slightly or match backend

    const isFull = formData.current_occupancy >= formData.capacity;

    useEffect(() => {
        if (activeTab === 'occupancy' && canManageOccupancy) {
            fetchLogs();
            if (canViewResidents) fetchResidents();
        }
    }, [activeTab]);

    const fetchLogs = async () => {
        try {
            const data = await api.getShelterLogs(shelter.id);
            setLogs(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchResidents = async () => {
        try {
            const data = await api.getShelterResidents(shelter.id);
            setResidents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmitInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        setLoading(true);
        setError(null);
        try {
            await api.updateShelter(shelter.id, formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update shelter info.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustOccupancy = async (delta: 1 | -1) => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            await api.adjustShelterOccupancy(shelter.id, delta);
            setFormData(prev => ({
                ...prev,
                current_occupancy: Math.max(0, Number(prev.current_occupancy) + delta)
            }));
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to adjust occupancy.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogOccupancy = async (e: React.MouseEvent, action: 'IN' | 'OUT') => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling

        if (submitLock.current) return; // Sync lock
        if (!logForm.person_name.trim()) {
            setError("Please enter a person's name.");
            return;
        }

        submitLock.current = true;
        setLoading(true);
        setError(null);

        try {
            await api.logShelterOccupancy(shelter.id, logForm.person_name, action);
            setLogForm({ person_name: '' });
            await fetchLogs();
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to log occupancy.");
        } finally {
            setLoading(false);
            // Small timeout to prevent accidental double-clicks even after processing
            setTimeout(() => { submitLock.current = false; }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Home className="w-5 h-5 text-blue-400" />
                            {shelter.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{shelter.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-4 text-xs font-bold tracking-tight uppercase border-b-2 transition-all ${activeTab === 'info' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        Details
                    </button>
                    {canManageOccupancy && (
                        <button
                            onClick={() => setActiveTab('occupancy')}
                            className={`flex-1 py-4 text-xs font-bold tracking-tight uppercase border-b-2 transition-all ${activeTab === 'occupancy' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            Occupancy Log
                        </button>
                    )}
                </div>

                <div className="p-8 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <form onSubmit={handleSubmitInfo} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Shelter Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!canEdit}
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-50"
                                    placeholder="e.g. City Hall Shelter"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    disabled={!canEdit}
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-50"
                                    placeholder="Address or coordinates"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300 ml-1">Total Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                        disabled={!canEdit}
                                        className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-300 ml-1">Status</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={formData.current_occupancy}
                                                readOnly
                                                className={`w-full bg-white/5 px-4 py-3 border rounded-xl text-white font-bold transition-all ${isFull ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-white/10'}`}
                                            />
                                        </div>
                                        {canManageOccupancy && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustOccupancy(-1)}
                                                    disabled={loading || formData.current_occupancy <= 0}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl disabled:opacity-30 transition-all active:scale-95"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdjustOccupancy(1)}
                                                    disabled={loading || formData.current_occupancy >= formData.capacity}
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl disabled:opacity-30 transition-all active:scale-95"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium italic">
                                        {isFull ? "Shelter is at full capacity" : `${formData.capacity - formData.current_occupancy} spots remaining`}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-sm font-bold uppercase tracking-tight text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    Close
                                </button>
                                {canEdit && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {activeTab === 'occupancy' && (
                        <div className="space-y-8">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Check In / Out Terminal</h4>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Full Name of Resident"
                                        className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={logForm.person_name}
                                        onChange={(e) => setLogForm({ ...logForm, person_name: e.target.value })}
                                    />
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <button
                                                type="button"
                                                onClick={(e) => handleLogOccupancy(e, 'IN')}
                                                disabled={loading || !logForm.person_name.trim() || isFull}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-30 flex justify-center items-center gap-2 transition-all active:scale-95"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                Check In
                                            </button>
                                        </div>
                                        {canCheckOut && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleLogOccupancy(e, 'OUT')}
                                                disabled={loading || !logForm.person_name.trim()}
                                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-30 border border-white/5 flex justify-center items-center gap-2 transition-all active:scale-95"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Check Out
                                            </button>
                                        )}
                                    </div>
                                    {isFull && <div className="text-[10px] text-amber-400 text-center font-bold uppercase tracking-tighter">Capacity Reached</div>}
                                    {!canCheckOut && (
                                        <p className="text-[10px] text-slate-500 text-center font-medium italic">Check-out requires authority permission.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        Active Residents ({residents.length})
                                    </h4>
                                    {residents.length === 0 ? (
                                        <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">No Residents</div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {residents.map((r, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                    <span className="font-bold text-white text-xs truncate mr-2">{r.person_name}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{new Date(r.logged_at).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <History className="w-4 h-4 text-emerald-400" />
                                        Recent Logs
                                    </h4>
                                    {logs.length === 0 ? (
                                        <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">No History</div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {logs.map(log => (
                                                <div key={log.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl group">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.action === 'IN' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`} />
                                                        <span className="font-bold text-white text-xs truncate">{log.person_name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase italic">
                                                            {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
