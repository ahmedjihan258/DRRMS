import { useEffect, useState } from "react";
import { Warehouse as WarehouseIcon, Trash2, Edit2, Loader2, Map, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/services";
import { ResourceStock } from "../types";
import WarehouseDetailsModal from "../components/WarehouseDetailsModal";
import ManageWarehouseModal from "../components/ManageWarehouseModal";

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState<{ id: number; name: string; latitude?: number; longitude?: number }[]>([]);
    const [stocks, setStocks] = useState<ResourceStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string; latitude?: number; longitude?: number } | null>(null);
    const [managingWarehouse, setManagingWarehouse] = useState<{ id: number; name: string; latitude?: number; longitude?: number } | undefined>(undefined);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

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

    const handleCreateClick = () => {
        setManagingWarehouse(undefined);
        setIsManageModalOpen(true);
    };

    const handleEditClick = (w: typeof warehouses[0]) => {
        setManagingWarehouse(w);
        setIsManageModalOpen(true);
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

    const isAdmin = currentUser?.roles?.includes('ADMIN');

    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Warehouses</h2>
                    <p className="text-slate-300 mt-1">Manage storage locations and view inventory distribution.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <Link to="/map?type=warehouses" className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-medium">
                            <Map className="w-4 h-4" />
                            Map
                        </Link>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleCreateClick}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <WarehouseIcon className="w-4 h-4" />
                            Add
                        </button>
                    )}
                </div>
            </div>

            {isManageModalOpen && (
                <ManageWarehouseModal
                    warehouse={managingWarehouse}
                    onClose={() => setIsManageModalOpen(false)}
                    onSuccess={fetchData}
                />
            )}

            {selectedWarehouse && (
                <WarehouseDetailsModal
                    warehouse={selectedWarehouse}
                    stocks={stocks.filter(s => s.warehouse_id === selectedWarehouse.id || s.location === selectedWarehouse.name)}
                    onClose={() => setSelectedWarehouse(null)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map(w => {
                    const warehouseStocks = stocks.filter(s => s.warehouse_id === w.id || s.location === w.name);

                    return (
                        <div
                            key={w.id}
                            className="rounded-2xl shadow-xl overflow-hidden flex flex-col hover:scale-[1.02] transition-all duration-300 group"
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                            }}
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                        <WarehouseIcon className="w-6 h-6" />
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditClick(w)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(w.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{w.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">Storage Facility</p>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-300 font-medium">Stock Variety</span>
                                            <span className="font-bold text-blue-400">{warehouseStocks.length} Types</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end pt-4 border-t border-white/10 mt-2">
                                        <button
                                            onClick={() => setSelectedWarehouse(w)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-bold tracking-tight transition-colors uppercase"
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
