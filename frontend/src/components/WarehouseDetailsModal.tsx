import { useRef } from "react";
import { X, Package, Warehouse } from "lucide-react";
import { ResourceStock } from "../types";

// Since we are reusing the Warehouse type locally defined in Warehouses.tsx or we can define it here.
// But wait, the `Warehouse` type is not exported from types/index.ts.
// I will check types again, but usually it is better to define props clearly.

interface WarehouseDetailsModalProps {
    warehouse: { id: number; name: string };
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                            {warehouse.name}
                        </h3>
                        <p className="text-xs text-slate-500">Inventory Details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {stocks.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No inventory available</p>
                            <p className="text-xs text-slate-400 mt-1">This warehouse is currently empty.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stocks.map(stock => {
                                const isLow = stock.resource_name.toLowerCase().includes('water') ? stock.quantity < 500 : stock.quantity < 100; // Rough heuristic or use status logic

                                // Let's reuse the logic from Resources.tsx if possible, or simple "Available"
                                // Simple listing for now.
                                return (
                                    <div key={stock.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isLow ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{stock.resource_name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{stock.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-bold ${isLow ? 'text-orange-600' : 'text-slate-700'}`}>
                                                {stock.quantity}
                                            </span>
                                            <p className="text-[10px] text-slate-400">Quantity</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-slate-50/50 p-4 border-t border-slate-100 text-right">
                    <span className="text-xs text-slate-400 mr-2">Total Unique Items: {stocks.length}</span>
                </div>
            </div>
        </div>
    );
}
