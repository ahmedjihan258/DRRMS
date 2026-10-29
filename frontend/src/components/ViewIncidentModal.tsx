import { useState, useEffect } from "react";
import { X, AlertTriangle, Clock, MapPin, User, MessageSquare } from "lucide-react";
import { Incident, IncidentUpdate } from "../types";
import { api } from "../api/services";
import LeafletMap from "./common/LeafletMap";

interface ViewIncidentModalProps {
    incident: Incident;
    onClose: () => void;
}

export default function ViewIncidentModal({ incident, onClose }: ViewIncidentModalProps) {
    const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await api.getIncident(incident.id);
                setUpdates(data.updates);
            } catch (err) {
                console.error("Failed to fetch incident details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [incident.id]);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <div
                className="rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-white/10"
                style={{
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(40px)',
                }}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-white tracking-tight">{incident.title}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                incident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {incident.severity}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(incident.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-blue-400" /> {incident.reporter_name || 'Anonymous'}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Map & Description */}
                    <div className="p-8 space-y-8">
                        <div className="h-56 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative ring-1 ring-white/10">
                            <LeafletMap
                                mode="read-only"
                                initialPosition={{ lat: incident.latitude, lng: incident.longitude }}
                                markers={[{ lat: incident.latitude, lng: incident.longitude, label: incident.title, color: 'red' }]}
                                height="100%"
                            />
                            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                    Coordinates: {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Situation Overview</h4>
                            <p className="text-slate-300 text-sm leading-relaxed font-medium bg-white/5 p-6 rounded-2xl border border-white/5">
                                {incident.description || 'No detailed description provided.'}
                            </p>
                        </div>

                        {/* Timeline Updates */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Timeline Updates</h4>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Synchronizing Logs...</p>
                                </div>
                            ) : updates.length === 0 ? (
                                <div className="text-center py-12 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">No updates reported yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                    {updates.map((update, idx) => (
                                        <div key={update.update_id} className="relative pl-12 group">
                                            <div className="absolute left-3 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10 group-first:bg-emerald-500 group-first:ring-emerald-500/20 transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl group-hover:bg-white/[0.08] group-hover:border-white/10 transition-all">
                                                <p className="text-sm text-white font-medium mb-2.5 leading-relaxed">{update.update_message}</p>
                                                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                    <span className="text-blue-400/80">{new Date(update.updated_at).toLocaleString()}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span>{update.updater_name || 'Verified Unit'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
}
