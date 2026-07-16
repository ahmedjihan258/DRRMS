import { useEffect, useState } from 'react';
import { Package, Search, Filter, Loader2, Plus } from 'lucide-react';
import { api } from '../api/services';
import { ResourceStock } from '../types';
import ManageStockModal from '../components/ManageStockModal';
import AddResourceModal from '../components/AddResourceModal';

type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const getStockStatus = (quantity: number, unit: string): StockStatus => {
  if (quantity <= 0) return 'OUT_OF_STOCK';

  const normalizedUnit = unit.toLowerCase().trim();
  const limit = normalizedUnit === 'kg' ? 1000 : 2000;
  const lowThreshold = limit * 0.2; // 20% threshold

  if (quantity < lowThreshold) return 'LOW_STOCK';
  return 'AVAILABLE';
};

export default function Resources() {
  const [stocks, setStocks] = useState<ResourceStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // New State for Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "ALL">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal State
  const [selectedStock, setSelectedStock] = useState<ResourceStock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchStocks = async () => {
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (err) {
      console.error("Failed to fetch resource stocks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.me().then(setCurrentUser).catch(() => { });
    fetchStocks();
  }, []);

  // Filter Logic
  const filteredStocks = stocks.filter((stock) => {
    const status = getStockStatus(stock.quantity, stock.unit);

    // Case-insensitive search on Name or Location
    const matchesSearch =
      stock.resource_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = statusFilter === "ALL" || status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isAdmin = currentUser?.roles?.includes('ADMIN');

  return (
    <div className="space-y-6">
      <ManageStockModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onSuccess={fetchStocks}
      />

      {isAddModalOpen && (
        <AddResourceModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchStocks}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Resource Management</h2>
          <p className="text-slate-500 mt-1">Track relief items, equipment, and supplies.</p>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 border rounded-lg hover:bg-slate-50 transition-colors ${statusFilter !== "ALL" ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600"
                }`}
            >
              <Filter className="w-5 h-5" />
            </button>

            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20">
                  <button
                    onClick={() => { setStatusFilter("ALL"); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'ALL' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    All Statuses
                  </button>
                  <button
                    onClick={() => { setStatusFilter("AVAILABLE"); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'AVAILABLE' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => { setStatusFilter("LOW_STOCK"); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'LOW_STOCK' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    Low Stock
                  </button>
                  <button
                    onClick={() => { setStatusFilter("OUT_OF_STOCK"); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'OUT_OF_STOCK' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    Out of Stock
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Resource Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Quantity</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Location</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocks.map((stock) => {
                const status = getStockStatus(stock.quantity, stock.unit);

                return (
                  <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-800">{stock.resource_name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {stock.quantity} {stock.unit}
                    </td>

                    <td className="px-6 py-4 text-slate-600">{stock.location}</td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'LOW_STOCK' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedStock(stock)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {stocks.length === 0 ? "No resources found in the inventory." : "No resources found matching your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
