import { useState } from "react";
import { X, Save, Home, MapPin, Loader2, Locate, Users, AlertTriangle } from "lucide-react";
import LeafletMap from "./common/LeafletMap";
import { api } from "../api/services";
import { Shelter } from "../types";

interface ManageShelterModalProps {
    shelter?: Shelter; // If provided, Edit mode. Else Create mode.
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManageShelterModal({ shelter, onClose, onSuccess }: ManageShelterModalProps) {
    const isEdit = !!shelter;
    const [name, setName] = useState(shelter?.name || "");
    const [address, setAddress] = useState(shelter?.location || "");
    const [capacity, setCapacity] = useState(Number(shelter?.capacity) || 0);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(
        shelter?.latitude && shelter?.longitude ? { lat: Number(shelter.latitude), lng: Number(shelter.longitude) } : null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (!address.trim()) {
            setError("Address/Location is required");
            return;
        }
        if (capacity <= 0) {
            setError("Capacity must be greater than 0");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEdit && shelter) {
                await api.updateShelter(shelter.id, {
                    name,
                    location: address,
                    capacity,
                    latitude: location?.lat,
                    longitude: location?.lng
                });
            } else {
                await api.createShelter({
                    name,
                    location: address,
                    capacity,
                    latitude: location?.lat,
                    longitude: location?.lng
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save shelter");
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
                        <Home className="w-5 h-5 text-blue-400" />
                        {isEdit ? "Edit Shelter" : "Add Shelter"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300 ml-1">Shelter Name</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Mirpur School"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300 ml-1">Address / Area</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="e.g. Mirpur-10, Dhaka"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300 ml-1 flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-blue-400/60" />
                                Capacity (Max People)
                            </label>
                            <input
                                type="number"
                                className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                value={capacity}
                                onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                Interactive Map
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
                            Click on the map to mark the exact location. {location ? `Coordinates: (${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)})` : 'No coordinates selected.'}
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
                            {isEdit ? "Save Changes" : "Create Shelter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
