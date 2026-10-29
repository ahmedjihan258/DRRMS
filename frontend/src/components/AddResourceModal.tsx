import { useState, useEffect } from "react";
import { X, Package, Plus, Loader2, Warehouse } from "lucide-react";
import { Resource } from "../types";
import { api } from "../api/services";

interface AddResourceModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddResourceModal({ onClose, onSuccess }: AddResourceModalProps) {
    const [activeTab, setActiveTab] = useState<'add_stock' | 'create_resource'>('add_stock');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);

    // Form States
    const [stockForm, setStockForm] = useState({
        resource_id: 0,
        warehouse_id: 0,
        quantity: 0
    });

    const [resourceForm, setResourceForm] = useState({
        resource_name: '',
        type: 'Supplies',
        unit: 'piece'
    });

    useEffect(() => {
        fetchResources();
        fetchWarehouses();
    }, []);

    const fetchResources = async () => {
        try {
            const [rData, wData] = await Promise.all([api.getResources(), api.getWarehouses()]);
            setResources(rData);
            setWarehouses(wData);
            if (rData.length > 0 && stockForm.resource_id === 0) {
                setStockForm(prev => ({ ...prev, resource_id: rData[0].id }));
            }
            if (wData.length > 0 && stockForm.warehouse_id === 0) {
                setStockForm(prev => ({ ...prev, warehouse_id: wData[0].id }));
            }
        } catch (err) { console.error(err); }
    };
    const fetchWarehouses = async () => {/* handled above */ };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (stockForm.quantity <= 0) throw new Error("Quantity must be positive");
            if (stockForm.warehouse_id === 0) throw new Error("Please select a warehouse");
            if (stockForm.resource_id === 0) throw new Error("Please select a resource");

            await api.addStock({
                resource_id: stockForm.resource_id,
                quantity: stockForm.quantity,
                warehouse_id: stockForm.warehouse_id
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to add stock");
        } finally { setLoading(false); }
    };

    const handleCreateResource = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!resourceForm.resource_name.trim()) throw new Error("Name required");

            await api.createResource(resourceForm);
            await fetchResources();
            setActiveTab('add_stock');
            // Optional: find the new resource and select it (requires sorting or knowing logic, but refreshing is safe)
        } catch (err: any) {
            setError(err.message || "Failed to create resource");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
                            Manage Inventory
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Add stock or create new items</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('add_stock')}
                        className={`flex-1 py-4 text-sm font-bold tracking-tight uppercase border-b-2 transition-all ${activeTab === 'add_stock' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        Add Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('create_resource')}
                        className={`flex-1 py-4 text-sm font-bold tracking-tight uppercase border-b-2 transition-all ${activeTab === 'create_resource' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        Create New Item
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl border border-rose-500/20 flex items-center gap-3 animate-shake">
                            <Package className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {activeTab === 'add_stock' ? (
                        <form onSubmit={handleAddStock} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Select Resource</label>
                                <select
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    value={stockForm.resource_id}
                                    onChange={e => setStockForm({ ...stockForm, resource_id: parseInt(e.target.value) })}
                                >
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id} className="bg-slate-900">{r.resource_name} ({r.unit})</option>
                                    ))}
                                    {resources.length === 0 && <option value="0" className="bg-slate-900">No resources found</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Warehouse Location</label>
                                <select
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    value={stockForm.warehouse_id}
                                    onChange={e => setStockForm({ ...stockForm, warehouse_id: parseInt(e.target.value) })}
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                                    ))}
                                    {warehouses.length === 0 && <option value="0" className="bg-slate-900">No warehouses available</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Quantity</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    min="1"
                                    value={stockForm.quantity}
                                    onChange={e => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
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
                                    className="px-8 py-2.5 text-sm font-bold uppercase tracking-tight text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Stock
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateResource} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Resource Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="e.g. Bottled Water"
                                    value={resourceForm.resource_name}
                                    onChange={e => setResourceForm({ ...resourceForm, resource_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Type / Category</label>
                                <select
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    value={resourceForm.type}
                                    onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                                >
                                    <option value="Supplies" className="bg-slate-900">Supplies</option>
                                    <option value="Food" className="bg-slate-900">Food</option>
                                    <option value="Water" className="bg-slate-900">Water</option>
                                    <option value="Medical" className="bg-slate-900">Medical</option>
                                    <option value="Equipment" className="bg-slate-900">Equipment</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300 ml-1">Unit</label>
                                <select
                                    className="w-full bg-white/5 px-4 py-3 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                    value={resourceForm.unit}
                                    onChange={e => setResourceForm({ ...resourceForm, unit: e.target.value })}
                                >
                                    <option value="piece" className="bg-slate-900">Piece / Item</option>
                                    <option value="kg" className="bg-slate-900">Kilogram (kg)</option>
                                    <option value="liters" className="bg-slate-900">Liters</option>
                                    <option value="box" className="bg-slate-900">Box</option>
                                    <option value="kits" className="bg-slate-900">Kits</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Note: 'kg' has a 1000 limit, others 2000.</p>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
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
                                    className="px-8 py-2.5 text-sm font-bold uppercase tracking-tight text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Item
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

