import { useState } from "react";
import { X, AlertTriangle, MapPin, Loader2, Locate } from "lucide-react";
import { api } from "../api/services";
import { Incident } from "../types";
import LeafletMap from "./common/LeafletMap";

interface ReportIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReportIncidentModal({ isOpen, onClose, onSuccess }: ReportIncidentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [disasterType, setDisasterType] = useState<Incident["disaster_type"]>("FLOOD");
    const [severity, setSeverity] = useState<Incident["severity"]>("MEDIUM");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!title || !latitude || !longitude) {
                throw new Error("Please fill in all required fields.");
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error("Invalid coordinates.");
            }

            await api.createIncident({
                title,
                description,
                disaster_type: disasterType,
                severity,
                latitude: lat,
                longitude: lng,
            });

            onSuccess();
            onClose();
            // Reset form
            setTitle("");
            setDescription("");
            setLatitude("");
            setLongitude("");
            setDisasterType("FLOOD");
            setSeverity("MEDIUM");
        } catch (err: any) {
            setError(err.message || "Failed to submit report.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Report Incident
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Provide details about the emergency situation.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">
                            Incident Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            placeholder="e.g., Flood in North District"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300 ml-1">Type</label>
                            <select
                                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                value={disasterType}
                                onChange={(e) => setDisasterType(e.target.value as Incident["disaster_type"])}
                            >
                                <option value="FLOOD" className="bg-slate-900">Flood</option>
                                <option value="CYCLONE" className="bg-slate-900">Cyclone</option>
                                <option value="FIRE" className="bg-slate-900">Fire</option>
                                <option value="LANDSLIDE" className="bg-slate-900">Landslide</option>
                                <option value="EARTHQUAKE" className="bg-slate-900">Earthquake</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300 ml-1">Severity</label>
                            <select
                                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as Incident["severity"])}
                            >
                                <option value="LOW" className="bg-slate-900">Low</option>
                                <option value="MEDIUM" className="bg-slate-900">Medium</option>
                                <option value="HIGH" className="bg-slate-900">High</option>
                                <option value="CRITICAL" className="bg-slate-900 text-rose-400">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">Description</label>
                        <textarea
                            className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            rows={3}
                            placeholder="Describe the situation..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                Location Selection
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!navigator.geolocation) return alert("Geolocation not supported");
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            setLatitude(pos.coords.latitude.toString());
                                            setLongitude(pos.coords.longitude.toString());
                                        },
                                        () => alert("Unable to retrieve location")
                                    );
                                }}
                                className="flex items-center text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-tight"
                            >
                                <Locate className="w-3 h-3 mr-1" />
                                Use My Location
                            </button>
                        </div>
                        <div className="h-40 border border-white/10 rounded-xl overflow-hidden mb-4 opacity-90 hover:opacity-100 transition-opacity">
                            <LeafletMap
                                mode="pick"
                                initialPosition={(latitude && longitude) ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : undefined}
                                onPositionChange={(pos: { lat: number, lng: number }) => {
                                    setLatitude(pos.lat.toString());
                                    setLongitude(pos.lng.toString());
                                }}
                                height="100%"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-white/5 px-4 py-2 border border-white/10 rounded-xl text-white text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="Latitude"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-white/5 px-4 py-2 border border-white/10 rounded-xl text-white text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="Longitude"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold uppercase tracking-tight text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-rose-500 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-rose-900/20 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Report"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
