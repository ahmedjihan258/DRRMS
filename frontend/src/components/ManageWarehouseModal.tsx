import { useState, useEffect } from "react";
import { X, Save, Warehouse, MapPin, Loader2, Locate } from "lucide-react";
import LeafletMap from "./common/LeafletMap";
import { api } from "../api/services";

interface ManageWarehouseModalProps {
    warehouse?: { id: number; name: string; latitude?: number; longitude?: number }; // If provided, Edit mode. Else Create mode.
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManageWarehouseModal({ warehouse, onClose, onSuccess }: ManageWarehouseModalProps) {
    const isEdit = !!warehouse;
    const [name, setName] = useState(warehouse?.name || "");
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(
        warehouse?.latitude && warehouse?.longitude ? { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) } : null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            if (isEdit && warehouse) {
                await api.updateWarehouse(warehouse.id, {
                    name,
                    latitude: location?.lat,
                    longitude: location?.lng
                });
            } else {
                await api.createWarehouse({
                    name,
                    latitude: location?.lat,
                    longitude: location?.lng
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save warehouse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-blue-400" />
                        {isEdit ? "Edit Warehouse" : "Add Warehouse"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <Warehouse className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">Warehouse Name</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Central Storage"
                            autoFocus
                        />
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                Location
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!navigator.geolocation) return alert("Geolocation not supported");
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                        () => alert("Unable to retrieve location")
                                    );
                                }}
                                className="flex items-center text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-tight"
                            >
                                <Locate className="w-3 h-3 mr-1" />
                                Use My Location
                            </button>
                        </div>
                        <div className="h-40 border border-white/10 rounded-xl overflow-hidden mb-3 opacity-90 transition-opacity hover:opacity-100">
                            <LeafletMap
                                mode="pick"
                                initialPosition={location || undefined}
                                onPositionChange={setLocation}
                                height="100%"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                            Click on map for exact location. {location ? `Coordinates: (${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)})` : 'No coordinates selected.'}
                        </p>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
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
                            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {!loading && <Save className="w-4 h-4" />}
                            {isEdit ? "Save Changes" : "Create Warehouse"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
