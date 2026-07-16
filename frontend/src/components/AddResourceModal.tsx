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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-blue-600" />
                            Manage Inventory
                        </h3>
                        <p className="text-xs text-slate-500">Add stock or create new items</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('add_stock')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'add_stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Add Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('create_resource')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'create_resource' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Create New Item
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {activeTab === 'add_stock' ? (
                        <form onSubmit={handleAddStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Resource</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={stockForm.resource_id}
                                    onChange={e => setStockForm({ ...stockForm, resource_id: parseInt(e.target.value) })}
                                >
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.resource_name} ({r.unit})</option>
                                    ))}
                                    {resources.length === 0 && <option value="0">No resources found</option>}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Location</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={stockForm.warehouse_id}
                                    onChange={e => setStockForm({ ...stockForm, warehouse_id: parseInt(e.target.value) })}
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                    {warehouses.length === 0 && <option value="0">No warehouses available</option>}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    min="1"
                                    value={stockForm.quantity}
                                    onChange={e => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Stock
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Resource Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g. Bottled Water"
                                    value={resourceForm.resource_name}
                                    onChange={e => setResourceForm({ ...resourceForm, resource_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type / Category</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={resourceForm.type}
                                    onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                                >
                                    <option value="Supplies">Supplies</option>
                                    <option value="Food">Food</option>
                                    <option value="Water">Water</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Equipment">Equipment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={resourceForm.unit}
                                    onChange={e => setResourceForm({ ...resourceForm, unit: e.target.value })}
                                >
                                    <option value="piece">Piece / Item</option>
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="liters">Liters</option>
                                    <option value="box">Box</option>
                                    <option value="kits">Kits</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Note: 'kg' has a 1000 limit, others 2000.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center gap-2"
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

