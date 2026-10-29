import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/services";
import { auth } from "../api/auth";
import { Map as MapIcon, Loader2, Navigation } from "lucide-react";
import LeafletMap from "../components/common/LeafletMap";

export default function MapPage() {
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type');

    // Data States
    const [incidents, setIncidents] = useState<any[]>([]);
    const [shelters, setShelters] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [volunteers, setVolunteers] = useState<any[]>([]);

    // Dynamic Infrastructure States
    const [dynamicHospitals, setDynamicHospitals] = useState<any[]>([]);
    const [dynamicPolice, setDynamicPolice] = useState<any[]>([]);
    const [dynamicFire, setDynamicFire] = useState<any[]>([]);
    const [loadingInfra, setLoadingInfra] = useState<string | null>(null);

    // Filter States
    const [showIncidents, setShowIncidents] = useState(typeParam === 'incidents' || !typeParam);
    const [showShelters, setShowShelters] = useState(typeParam === 'shelters');
    const [showWarehouses, setShowWarehouses] = useState(typeParam === 'warehouses');
    const [showVolunteers, setShowVolunteers] = useState(typeParam === 'volunteers');

    const [showHospitals, setShowHospitals] = useState(false);
    const [showPolice, setShowPolice] = useState(false);
    const [showFire, setShowFire] = useState(false);

    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);

    // Initial Data Load
    useEffect(() => {
        const load = async () => {
            try {
                const [i, s, w] = await Promise.all([
                    api.getIncidents().catch(() => []),
                    api.getShelters().catch(() => []),
                    api.getWarehouses().catch(() => [])
                ]);

                const me = await auth.getMe().catch(() => null);
                const isAdmin = me?.roles?.some((r: string) => ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(r));

                let v: any[] = [];
                if (isAdmin) {
                    v = await api.getVolunteers().catch(() => []);
                }

                setIncidents(i);
                setShelters(s);
                setWarehouses(w);
                setVolunteers(v);
            } catch (e) {
                console.error("Error loading map data", e);
            }
        };
        load();
    }, []);

    const fetchNearbyInfra = useCallback(async (type: 'hospital' | 'police' | 'fire_station') => {
        setLoadingInfra(type);
        try {
            // Priority 1: User Location
            // Priority 2: Default Dhaka Center (if user loc fails)
            let lat = userLoc?.lat;
            let lng = userLoc?.lng;

            if (!lat || !lng) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) => {
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                    setUserLoc({ lat, lng });
                } catch (e) {
                    // Fallback to Dhaka center if geolocation fails
                    lat = 23.8103;
                    lng = 90.4125;
                }
            }

            const radius = 30000; // 30km

            let overpassQuery = "";
            if (type === 'hospital') {
                overpassQuery = `(node["amenity"="hospital"](around:${radius},${lat},${lng});node["healthcare"="hospital"](around:${radius},${lat},${lng});way["amenity"="hospital"](around:${radius},${lat},${lng});)`;
            } else if (type === 'police') {
                overpassQuery = `(node["amenity"="police"](around:${radius},${lat},${lng});way["amenity"="police"](around:${radius},${lat},${lng});)`;
            } else if (type === 'fire_station') {
                overpassQuery = `(node["amenity"="fire_station"](around:${radius},${lat},${lng});way["amenity"="fire_station"](around:${radius},${lat},${lng});)`;
            }

            const query = `[out:json][timeout:25];${overpassQuery};out center;`;
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            const items = data.elements.map((el: any) => ({
                lat: el.lat || (el.center && el.center.lat),
                lng: el.lon || (el.center && el.center.lon),
                label: `<strong>${el.tags.name || type.replace('_', ' ').toUpperCase()}</strong><br/>${el.tags["addr:street"] || "Facility Info"}`,
                color: type === 'hospital' ? 'violet' : type === 'police' ? 'blue' : 'orange'
            })).filter((item: any) => item.lat && item.lng);

            if (type === 'hospital') setDynamicHospitals(items);
            if (type === 'police') setDynamicPolice(items);
            if (type === 'fire_station') setDynamicFire(items);

        } catch (err) {
            console.error("Failed to fetch infra:", err);
        } finally {
            setLoadingInfra(null);
        }
    }, [userLoc]);

    // Construct Markers based on filters
    const markers = [
        ...(showIncidents ? incidents.filter(i => i.latitude && i.longitude).map(i => ({
            lat: Number(i.latitude),
            lng: Number(i.longitude),
            label: `<strong>${i.title}</strong><br/>Status: ${i.status}`,
            color: 'red' as const
        })) : []),
        ...(showShelters ? shelters.filter(s => s.latitude && s.longitude).map(s => ({
            lat: Number(s.latitude),
            lng: Number(s.longitude),
            label: `<strong>${s.name}</strong><br/>Shelter`,
            color: 'orange' as const
        })) : []),
        ...(showWarehouses ? warehouses.filter(w => w.latitude && w.longitude).map(w => ({
            lat: Number(w.latitude),
            lng: Number(w.longitude),
            label: `<strong>${w.name}</strong><br/>Warehouse`,
            color: 'blue' as const
        })) : []),
        ...(showVolunteers ? volunteers.filter(v => v.latitude && v.longitude).map(v => ({
            lat: Number(v.latitude),
            lng: Number(v.longitude),
            label: `<strong>${v.user_name}</strong><br/>${v.availability}`,
            color: 'green' as const
        })) : []),
        ...(showHospitals ? dynamicHospitals : []),
        ...(showPolice ? dynamicPolice : []),
        ...(showFire ? dynamicFire : [])
    ];

    const toggleInfra = (type: 'hospital' | 'police' | 'fire_station', show: boolean, setShow: (v: boolean) => void) => {
        const newVal = !show;
        setShow(newVal);
        if (newVal) fetchNearbyInfra(type);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
            {/* Sidebar Filters */}
            <div
                className="w-80 p-8 overflow-y-auto hidden lg:block shrink-0 transition-all border-r border-white/5"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(30px)',
                }}
            >
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <MapIcon className="w-6 h-6 text-blue-400" />
                        Live Map
                    </h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Tactical Data</p>

                        <button
                            onClick={() => setShowIncidents(!showIncidents)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all active:scale-[0.98] ${showIncidents ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Incidents</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        </button>

                        <button
                            onClick={() => setShowShelters(!showShelters)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all active:scale-[0.98] ${showShelters ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Shelters</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                        </button>

                        <button
                            onClick={() => setShowWarehouses(!showWarehouses)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all active:scale-[0.98] ${showWarehouses ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Warehouses</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        </button>

                        <button
                            onClick={() => setShowVolunteers(!showVolunteers)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all active:scale-[0.98] ${showVolunteers ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Volunteers</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        </button>
                    </div>

                    <div className="pt-8 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Infrastructure</p>

                        <button
                            onClick={() => toggleInfra('hospital', showHospitals, setShowHospitals)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all ${showHospitals ? 'bg-violet-600/20 border-violet-500/40' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest">
                                <span>Hospitals</span>
                                {loadingInfra === 'hospital' && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                        </button>

                        <button
                            onClick={() => toggleInfra('police', showPolice, setShowPolice)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all ${showPolice ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest">
                                <span>Police</span>
                                {loadingInfra === 'police' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        </button>

                        <button
                            onClick={() => toggleInfra('fire_station', showFire, setShowFire)}
                            className={`flex items-center justify-between w-full p-4 border rounded-2xl transition-all ${showFire ? 'bg-orange-600/20 border-orange-500/40' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest">
                                <span>Fire Services</span>
                                {loadingInfra === 'fire_station' && <Loader2 className="w-3 h-3 animate-spin text-orange-400" />}
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                        </button>

                        <div className="mt-8 p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                            <button
                                onClick={() => {
                                    if (showHospitals) fetchNearbyInfra('hospital');
                                    if (showPolice) fetchNearbyInfra('police');
                                    if (showFire) fetchNearbyInfra('fire_station');
                                }}
                                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest transition-all"
                            >
                                <Navigation className="w-3 h-3" />
                                Refresh Scan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0 bg-slate-900 h-full">
                <LeafletMap
                    mode="read-only"
                    markers={markers}
                    height="100%"
                />
            </div>
        </div>
    );
}
