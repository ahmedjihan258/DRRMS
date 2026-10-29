import { useRef } from "react";
import { X, Package, Warehouse } from "lucide-react";
import LeafletMap from "./common/LeafletMap";
import { ResourceStock } from "../types";

// Since we are reusing the Warehouse type locally defined in Warehouses.tsx or we can define it here.
// But wait, the `Warehouse` type is not exported from types/index.ts.
// I will check types again, but usually it is better to define props clearly.

interface WarehouseDetailsModalProps {
    warehouse: { id: number; name: string; latitude?: number; longitude?: number };
    stocks: ResourceStock[];
    onClose: () => void;
}

export default function WarehouseDetailsModal({ warehouse, stocks, onClose }: WarehouseDetailsModalProps) {
    // Filter stocks relevant to this warehouse.
    // The parent component should ideally pass only relevant stocks, but if it passes all, we filter here.
    // Based on previous step, `Warehouses.tsx` does the filtering.
    // So let's assume `stocks` passed here are ALREADY filtered for this warehouse.

    // Sort stocks: Low stock warning first maybe?
    // Let's just list them nicely.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-blue-400" />
                            {warehouse.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Inventory Details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6">
                    {/* Location Map */}
                    {(warehouse.latitude && warehouse.longitude) || (warehouse as any).latitude ? (
                        <div className="h-48 rounded-2xl overflow-hidden border border-white/5 opacity-80 transition-opacity hover:opacity-100">
                            <LeafletMap
                                mode="read-only"
                                initialPosition={{ lat: (warehouse as any).latitude || 0, lng: (warehouse as any).longitude || 0 }}
                                markers={[{ lat: (warehouse as any).latitude || 0, lng: (warehouse as any).longitude || 0 }]}
                                height="100%"
                            />
                        </div>
                    ) : null}

                    {stocks.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-white font-bold uppercase tracking-widest text-xs">Warehouse Empty</p>
                            <p className="text-xs text-slate-500 mt-2">No inventory available at this location.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stocks.map(stock => {
                                const isLow = stock.resource_name.toLowerCase().includes('water') ? stock.quantity < 500 : stock.quantity < 100;
                                return (
                                    <div key={stock.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-colors ${isLow ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm tracking-tight">{stock.resource_name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{stock.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-base font-bold tracking-tight ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {stock.quantity}
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Stock</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white/5 px-6 py-4 border-t border-white/10 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Asset Types: {stocks.length}</span>
                </div>
            </div>
        </div>
    );
}
