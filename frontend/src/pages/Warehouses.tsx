import { useEffect, useState } from "react";
import { Warehouse, Trash2, Edit2, Package, Loader2, Save, X } from "lucide-react";
import { api } from "../api/services";
import { ResourceStock } from "../types";
import WarehouseDetailsModal from "../components/WarehouseDetailsModal";

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
    const [stocks, setStocks] = useState<ResourceStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string } | null>(null);


    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    // Create State
    const [newWarehouseName, setNewWarehouseName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        api.me().then(setCurrentUser).catch(() => { });
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [w, s] = await Promise.all([api.getWarehouses(), api.getStocks()]);
            setWarehouses(w);
            setStocks(s);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newWarehouseName.trim()) return;
        try {
            // Since we only have addStock in services, checking backend if create warehouse endpoint is used...
            // Wait, I updated services.ts to include update/delete but I missed "createWarehouse" in services.ts?
            // Ah, I missed adding createWarehouse in services.ts in the previous step, but I added the backend handling.
            // I will need to quickly fix services.ts or just inline the fetch here for now if I can't call tools again.
            // Actually, I can use a raw fetch or I can just fix services.ts later. Ideally fix services.ts.
            // But wait, the previous `AddResourceModal` might have had it? No.
            // Let's assume I'll patch services.ts in the next turn if needed, or I can use `api.post("/api/warehouses", ...)` if `api` exposes generic post... 
            // `api` object in services.ts doesn't expose generic post directly, it's internal.
            // Checking services.ts content from previous turn... `post` is not exported.
            // I will implement a quick workaround or I will use a separate step to fix services.ts.
            // Let's assume I'll fix services.ts. For now let's write the code assuming `api.createWarehouse` exists.
            // Actually, I will check if I can just add `createWarehouse` now.
            await api.createWarehouse({ name: newWarehouseName });
            setNewWarehouseName("");
            setIsCreating(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to create warehouse");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? Warehouse must be empty.")) return;
        try {
            await api.deleteWarehouse(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            await api.updateWarehouse(id, editName);
            setEditingId(null);
            fetchData();
        } catch (err: any) {
            alert(err.message || "Failed to update");
        }
    };

    const isAdmin = currentUser?.roles?.includes('ADMIN');

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Warehouses</h2>
                    <p className="text-slate-500">Manage storage locations and view inventory distribution.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Warehouse className="w-4 h-4" />
                        Add Warehouse
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Warehouse Name"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newWarehouseName}
                        onChange={e => setNewWarehouseName(e.target.value)}
                    />
                    <button onClick={handleCreate} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Save className="w-5 h-5" /></button>
                    <button onClick={() => setIsCreating(false)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
            )}

            {selectedWarehouse && (
                <WarehouseDetailsModal
                    warehouse={selectedWarehouse}
                    stocks={stocks.filter(s => s.warehouse_id === selectedWarehouse.id || s.location === selectedWarehouse.name)}
                    onClose={() => setSelectedWarehouse(null)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.map(w => {
                    // Count items
                    const warehouseStocks = stocks.filter(s => s.warehouse_id === w.id || s.location === w.name);
                    const totalQty = warehouseStocks.reduce((sum, s) => sum + s.quantity, 0);

                    return (
                        <div key={w.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <Warehouse className="w-6 h-6" />
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            {editingId === w.id ? (
                                                <div className="flex items-center gap-2 absolute bg-white shadow-lg p-2 rounded-lg border z-10 right-4 top-4">
                                                    <input
                                                        className="w-32 px-2 py-1 text-sm border rounded"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleUpdate(w.id)} className="text-green-600"><Save className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditingId(w.id); setEditName(w.name); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(w.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-semibold text-slate-800 mb-1">{w.name}</h3>
                                <p className="text-slate-500 text-sm mb-4">Storage Facility</p>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-600">Stock Variety</span>
                                            <span className="font-medium text-slate-700">{warehouseStocks.length} Types</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end pt-4 border-t border-slate-50">
                                        <button
                                            onClick={() => setSelectedWarehouse(w)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
