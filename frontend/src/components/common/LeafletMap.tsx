import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom Colored Icons
const Icons: Record<string, L.Icon> = {
    default: L.icon({
        iconUrl: icon,
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    red: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    blue: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    green: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    orange: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    violet: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
};

L.Marker.prototype.options.icon = Icons.default;

interface LeafletMapProps {
    mode: 'read-only' | 'pick';
    initialPosition?: { lat: number; lng: number };
    markers?: { lat: number; lng: number; label?: string; color?: 'red' | 'blue' | 'green' | 'orange' | 'violet' }[];
    onPositionChange?: (pos: { lat: number; lng: number }) => void;
    height?: string;
    className?: string;
}

export default function LeafletMap({ mode, initialPosition, markers, onPositionChange, height = "300px", className }: LeafletMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const pickMarkerRef = useRef<L.Marker | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const defaultCenter = { lat: 23.8103, lng: 90.4125 }; // Dhaka, Bangladesh
        const center = initialPosition || defaultCenter;

        const map = L.map(mapContainerRef.current).setView(center, 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // Force map resize check
        setTimeout(() => map.invalidateSize(), 100);

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []); // Run once on mount

    // Handle 'pick' mode click events
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e: L.LeafletMouseEvent) => {
            if (mode === 'pick' && onPositionChange) {
                onPositionChange(e.latlng);
                map.flyTo(e.latlng, map.getZoom());

                // Update pick marker locally for immediate feedback
                if (pickMarkerRef.current) {
                    pickMarkerRef.current.setLatLng(e.latlng);
                } else {
                    pickMarkerRef.current = L.marker(e.latlng).addTo(map);
                }
            }
        };

        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [mode, onPositionChange]);

    // Update View and Pick Marker when initialPosition changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !initialPosition) return;

        // Only fly if significantly different to prevent jitter? 
        // For now, always trust the prop.
        map.flyTo(initialPosition, map.getZoom());

        if (mode === 'pick') {
            if (pickMarkerRef.current) {
                pickMarkerRef.current.setLatLng(initialPosition);
            } else {
                pickMarkerRef.current = L.marker(initialPosition).addTo(map);
            }
        }
    }, [initialPosition, mode]);

    // Update Markers List (Read-only mode)
    useEffect(() => {
        const layerGroup = markersLayerRef.current;
        const map = mapRef.current;
        if (!layerGroup || !map) return;

        layerGroup.clearLayers();

        if (markers && markers.length > 0) {
            const leafletMarkers: L.Marker[] = [];

            markers.forEach(m => {
                const icon = m.color && Icons[m.color] ? Icons[m.color] : Icons.default;
                const marker = L.marker([m.lat, m.lng], { icon });
                if (m.label) {
                    marker.bindPopup(m.label);
                }
                layerGroup.addLayer(marker);
                leafletMarkers.push(marker);
            });

            // Auto fit bounds if strictly reading
            if (mode === 'read-only' && leafletMarkers.length > 0) {
                const group = L.featureGroup(leafletMarkers);
                // Pad bounds to ensure markers aren't on the edge
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }
    }, [markers, mode]);

    return (
        <div
            className={`rounded-lg overflow-hidden border border-slate-200 shadow-inner ${className}`}
            style={{ height }}
        >
            <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
        </div>
    );
}
