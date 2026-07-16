import { useState } from "react";
import { X, AlertTriangle, MapPin, Loader2 } from "lucide-react";
import { api } from "../api/services";
import { Incident } from "../types";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Report Incident
                        </h3>
                        <p className="text-xs text-slate-500">Provide details about the emergency situation.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Incident Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="e.g., Flood in North District"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={disasterType}
                                onChange={(e) => setDisasterType(e.target.value as Incident["disaster_type"])}
                            >
                                <option value="FLOOD">Flood</option>
                                <option value="CYCLONE">Cyclone</option>
                                <option value="FIRE">Fire</option>
                                <option value="LANDSLIDE">Landslide</option>
                                <option value="EARTHQUAKE">Earthquake</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as Incident["severity"])}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            rows={3}
                            placeholder="Describe the situation..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Location Coordinates
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                    placeholder="Longitude"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Enter valid GPS coordinates (e.g., 23.8103, 90.4125).
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
