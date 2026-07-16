import { useState, useEffect, useRef } from "react";
import { X, Home, Users, CheckCircle2, History, AlertTriangle, LogIn, LogOut } from "lucide-react";
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
        capacity: shelter.capacity,
        current_occupancy: shelter.current_occupancy
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
                current_occupancy: Math.max(0, prev.current_occupancy + delta)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Home className="w-5 h-5 text-blue-600" />
                            {shelter.name}
                        </h3>
                        <p className="text-xs text-slate-500">{shelter.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Details
                    </button>
                    {canManageOccupancy && (
                        <button
                            onClick={() => setActiveTab('occupancy')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'occupancy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Occupancy Log
                        </button>
                    )}
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <form onSubmit={handleSubmitInfo} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Shelter Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                                    placeholder="e.g. City Hall Shelter"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    disabled={!canEdit}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                                    placeholder="Address or coordinates"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                        disabled={!canEdit}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Occupancy</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={formData.current_occupancy}
                                                readOnly
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 border-orange-200 bg-orange-50/30"
                                            />
                                            {canManageOccupancy && (
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdjustOccupancy(-1)}
                                                        disabled={loading || formData.current_occupancy <= 0}
                                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdjustOccupancy(1)}
                                                        disabled={loading || formData.current_occupancy >= formData.capacity}
                                                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {canManageOccupancy ? "Manually update occupancy count." : "Occupancy level."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 mt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                                >
                                    Close
                                </button>
                                {canEdit && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2"
                                    >
                                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {activeTab === 'occupancy' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Check In / Out</h4>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Person Name"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                        value={logForm.person_name}
                                        onChange={(e) => setLogForm({ ...logForm, person_name: e.target.value })}
                                    />
                                    <div className="flex gap-3">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => handleLogOccupancy(e, 'IN')}
                                                disabled={loading || !logForm.person_name.trim() || isFull}
                                                className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                Check In
                                            </button>
                                            {isFull && <div className="text-[10px] text-red-500 text-center font-bold">Shelter Full</div>}
                                        </div>
                                        {canCheckOut && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleLogOccupancy(e, 'OUT')}
                                                disabled={loading || !logForm.person_name.trim()}
                                                className="flex-1 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Check Out
                                            </button>
                                        )}
                                    </div>
                                    {!canCheckOut && (
                                        <p className="text-[10px] text-slate-500 text-center">Only Admins can process check-outs.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Current Residents ({residents.length})
                                </h4>
                                {residents.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded text-xs">No active residents found.</p>
                                ) : (
                                    <div className="space-y-1 max-h-32 overflow-y-auto mb-6 bg-slate-50 p-2 rounded border border-slate-100">
                                        {residents.map((r, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs p-1.5 hover:bg-white rounded transition-colors">
                                                <span className="font-medium text-slate-700">{r.person_name}</span>
                                                <span className="text-slate-400">{new Date(r.logged_at).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Recent Activity
                                </h4>
                                {logs.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No recent activity.</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {logs.map(log => (
                                            <div key={log.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${log.action === 'IN' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className="font-medium text-slate-700">{log.person_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.action === 'IN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {log.action}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(log.logged_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
