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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Manage Stock
                        </h3>
                        <p className="text-xs text-slate-500">{stock.resource_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                        <p className="text-sm text-blue-800 mb-1 font-medium">Current Location</p>
                        <p className="text-xs text-blue-600">{stock.location}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Quantity ({stock.unit})
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            Update the available quantity for this location.
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
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
