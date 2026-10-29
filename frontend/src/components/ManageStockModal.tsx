import { useState } from "react";
import { X, Package, Loader2 } from "lucide-react";
import { ResourceStock } from "../types";
import { api } from "../api/services";

interface ManageStockModalProps {
    stock: ResourceStock | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManageStockModal({ stock, onClose, onSuccess }: ManageStockModalProps) {
    const [quantity, setQuantity] = useState(stock?.quantity.toString() || "0");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!stock) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 0) {
            setError("Please enter a valid positive number.");
            setLoading(false);
            return;
        }

        try {
            await api.updateStock(stock.id, qty);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update stock.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-400" />
                            Manage Stock
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{stock.resource_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <Package className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="bg-white/5 p-5 rounded-2xl mb-6 border border-white/10">
                        <p className="text-[10px] text-blue-400 mb-1 font-bold uppercase tracking-widest">Current Location</p>
                        <p className="text-sm text-slate-300 font-medium">{stock.location}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">
                            Quantity ({stock.unit})
                        </label>
                        <input
                            type="number"
                            className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xl font-bold tracking-tight"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                        />
                        <p className="text-[10px] text-slate-500 mt-2 font-medium italic">
                            Update the available quantity for this location.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
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
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Stock"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
