import { useState, useEffect } from "react";
import { X, AlertTriangle, Users, Package, CheckCircle2, ArrowRight, MessageSquare, Send, Loader2, Clock } from "lucide-react";
import { Incident, Volunteer, ResourceStock, IncidentUpdate } from "../types";
import { api } from "../api/services";
import LeafletMap from "./common/LeafletMap";

interface ManageIncidentModalProps {
    incident: Incident;
    onClose: () => void;
    onSuccess: () => void;
    userRole: string;
}

export default function ManageIncidentModal({ incident: initialIncident, onClose, onSuccess, userRole }: ManageIncidentModalProps) {
    const [incident, setIncident] = useState(initialIncident);
    const [activeTab, setActiveTab] = useState<'status' | 'updates' | 'volunteers' | 'resources'>('updates');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data State
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [stocks, setStocks] = useState<ResourceStock[]>([]);
    const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
    const [newUpdate, setNewUpdate] = useState("");

    const isAdminOrDispatcher = ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(userRole);

    useEffect(() => {
        if (activeTab === 'volunteers' && isAdminOrDispatcher) fetchVolunteers();
        if (activeTab === 'resources' && isAdminOrDispatcher) fetchResources();
        if (activeTab === 'updates') fetchUpdates();
    }, [activeTab]);

    const fetchUpdates = async () => {
        try {
            const data = await api.getIncident(incident.id);
            setUpdates(data.updates);
        } catch (err) { console.error(err); }
    };

    const fetchVolunteers = async () => {
        try {
            const data = await api.getVolunteers();
            setVolunteers(data.filter(v => v.availability === 'AVAILABLE'));
        } catch (err) { console.error(err); }
    };

    const fetchResources = async () => {
        try {
            const data = await api.getStocks();
            setStocks(data);
        } catch (err) { console.error(err); }
    };

    const handleStatusUpdate = async (newStatus: Incident["status"]) => {
        setLoading(true);
        try {
            await api.updateIncidentStatus(incident.id, newStatus);
            setIncident({ ...incident, status: newStatus });
            setMessage({ type: 'success', text: `Status updated to ${newStatus.replace('_', ' ')}` });
            if (newStatus === 'RESOLVED') onSuccess();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to update status" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUpdate.trim()) return;
        setLoading(true);
        try {
            await api.addIncidentUpdate(incident.id, newUpdate);
            setNewUpdate("");
            setMessage({ type: 'success', text: "Operational update synchronized." });
            fetchUpdates();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to add update" });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignVolunteer = async (volunteerId: number) => {
        setLoading(true);
        try {
            await api.assignVolunteer(volunteerId, incident.id);
            setMessage({ type: 'success', text: "Volunteer assigned successfully" });
            fetchVolunteers();
            onSuccess();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to assign volunteer" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeployResource = async (e: React.FormEvent, resourceId: number, quantity: number) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.deployResource(resourceId, incident.id, quantity);
            setMessage({ type: 'success', text: "Resources deployed successfully" });
            fetchResources();
            onSuccess();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to deploy resources" });
        } finally {
            setLoading(false);
        }
    };

    const ResourceRow = ({ stock }: { stock: ResourceStock }) => {
        const [qty, setQty] = useState(1);
        return (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group">
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-white text-sm truncate tracking-tight">{stock.resource_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 opacity-60">
                        <span className="text-emerald-400">{stock.quantity} {stock.unit}</span> available at <span className="text-blue-400">{stock.location}</span>
                    </p>
                </div>
                <form className="flex items-center gap-3" onSubmit={(e) => handleDeployResource(e, stock.id, qty)}>
                    {stock.quantity > 0 ? (
                        <>
                            <input
                                type="number" min="1" max={stock.quantity} value={qty}
                                onChange={(e) => setQty(parseInt(e.target.value))}
                                className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                            <button
                                type="submit" disabled={loading}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                            >
                                Deploy
                            </button>
                        </>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/10">Stockout</span>
                    )}
                </form>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <div
                className="rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-white/10"
                style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Tactical Command
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{incident.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-4 bg-white/2">
                    <button
                        onClick={() => setActiveTab('updates')}
                        className={`flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 transition-all ${activeTab === 'updates' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Timeline
                    </button>
                    {isAdminOrDispatcher && (
                        <>
                            <button
                                onClick={() => setActiveTab('status')}
                                className={`flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 transition-all ${activeTab === 'status' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                Status
                            </button>
                            <button
                                onClick={() => setActiveTab('volunteers')}
                                className={`flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 transition-all ${activeTab === 'volunteers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                Deployment
                            </button>
                            <button
                                onClick={() => setActiveTab('resources')}
                                className={`flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 transition-all ${activeTab === 'resources' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                Logistics
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {message && (
                        <div className={`mb-8 p-4 rounded-2xl flex items-center text-xs font-bold border animate-shake shadow-lg ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-3" /> : <AlertTriangle className="w-4 h-4 mr-3" />}
                            <span className="uppercase tracking-widest">{message.text}</span>
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div className="space-y-8">
                            <form onSubmit={handleAddUpdate} className="relative group">
                                <textarea
                                    value={newUpdate}
                                    onChange={(e) => setNewUpdate(e.target.value)}
                                    placeholder="Enter operational update..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pr-14 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[100px] font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newUpdate.trim()}
                                    className="absolute right-4 bottom-4 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-30"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident History</h4>
                                </div>
                                {updates.length === 0 ? (
                                    <div className="p-10 text-center bg-white/2 rounded-2xl border border-dashed border-white/5">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Awaiting first tactical update</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {updates.map(u => (
                                            <div key={u.update_id} className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/[0.08] transition-all">
                                                <p className="text-sm text-slate-200 font-medium leading-relaxed">{u.update_message}</p>
                                                <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 text-blue-400/80"><Clock className="w-3 h-3" /> {new Date(u.updated_at).toLocaleString()}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span>Verified Dispatch</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operating Status</p>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${incident.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{incident.status.replace('_', ' ')}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {incident.status === 'REPORTED' && (
                                    <button onClick={() => handleStatusUpdate('IN_PROGRESS')} className="flex items-center justify-between p-6 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl transition-all group active:scale-[0.98]">
                                        <div className="text-left font-black uppercase tracking-widest">
                                            <span className="block text-blue-400 text-xs mb-1">Engage Force</span>
                                            <span className="text-[10px] text-slate-500">Initialize disaster response</span>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                                {incident.status !== 'RESOLVED' && (
                                    <button onClick={() => handleStatusUpdate('RESOLVED')} className="flex items-center justify-between p-6 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl transition-all group active:scale-[0.98]">
                                        <div className="text-left font-black uppercase tracking-widest">
                                            <span className="block text-emerald-400 text-xs mb-1">Signal Clear</span>
                                            <span className="text-[10px] text-slate-500">Mission success and extraction</span>
                                        </div>
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                                    </button>
                                )}
                                {incident.status === 'RESOLVED' && (
                                    <div className="p-12 text-center text-slate-400 rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <p className="font-black text-white tracking-[0.2em] uppercase text-xs">Mission Completed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'volunteers' && isAdminOrDispatcher && (
                        <div className="space-y-6">
                            {volunteers.length === 0 ? (
                                <div className="text-center py-16 text-slate-600 bg-white/2 rounded-3xl border border-white/5 font-bold uppercase tracking-widest text-[10px]">No active units available in vector</div>
                            ) : (
                                <div className="space-y-3">
                                    {volunteers.map(vol => (
                                        <div key={vol.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">{vol.user_name?.charAt(0) || 'V'}</div>
                                                <div>
                                                    <p className="font-bold text-white text-sm tracking-tight">{vol.user_name || vol.email}</p>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Specialization: {vol.skills || 'Tactical Support'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleAssignVolunteer(vol.id)} disabled={loading} className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20">Deploy</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'resources' && isAdminOrDispatcher && (
                        <div className="space-y-4">
                            {stocks.length === 0 ? (
                                <div className="text-center py-16 text-slate-600 bg-white/2 rounded-3xl border border-white/5 font-bold uppercase tracking-widest text-[10px]">Logistics chain exhausted</div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                                    {stocks.map(stock => <ResourceRow key={stock.id} stock={stock} />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
