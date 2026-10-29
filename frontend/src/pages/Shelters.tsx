import { useEffect, useState } from 'react';
import { Home, Loader2, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { api } from '../api/services';
import { auth } from '../api/auth';
import { Shelter } from '../types';
import ShelterDetailsModal from '../components/ShelterDetailsModal';
import ManageShelterModal from '../components/ManageShelterModal';

type ShelterStatus = 'OPEN' | 'NEARLY_FULL' | 'FULL';

function getShelterStatus(current: number, capacity: number): ShelterStatus {
  if (capacity <= 0) return 'FULL';
  const rate = current / capacity;
  if (rate >= 1) return 'FULL';
  if (rate >= 0.9) return 'NEARLY_FULL';
  return 'OPEN';
}

export default function Shelters() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [userRole, setUserRole] = useState<string>('CITIZEN');
  const [searchTerm, setSearchTerm] = useState("");

  const fetchShelters = async () => {
    try {
      const data = await api.getShelters();
      setShelters(data);
    } catch (err) {
      console.error("Failed to fetch shelters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
    auth.getMe().then(me => {
      const role = me.roles && me.roles.length > 0 ? me.roles[0] : 'CITIZEN';
      setUserRole(role);
    }).catch(() => { });
  }, []);

  const filteredShelters = shelters.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isAdmin = userRole === 'ADMIN';

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shelter? This action cannot be undone.")) return;
    try {
      // Assuming api has deleteShelter, if not I might need to check services.ts
      // I'll check services.ts first or just try to implement it based on standard pattern
      await api.deleteShelter(id);
      fetchShelters();
    } catch (err: any) {
      alert(err.message || "Failed to delete shelter");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedShelter && (
        <ShelterDetailsModal
          shelter={selectedShelter}
          onClose={() => setSelectedShelter(null)}
          onSuccess={fetchShelters}
          userRole={userRole}
        />
      )}

      {(isAddModalOpen || editingShelter) && (
        <ManageShelterModal
          shelter={editingShelter || undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingShelter(null);
          }}
          onSuccess={fetchShelters}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Shelter Management</h2>
          <p className="text-slate-300 mt-1">Monitor shelter capacity and occupancy status.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Shelter
            </button>
          )}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search shelters..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShelters.map((shelter) => {
          const occupancyRate = shelter.capacity > 0
            ? (shelter.current_occupancy / shelter.capacity) * 100
            : 100;

          const isFull = occupancyRate >= 90;

          const status = getShelterStatus(shelter.current_occupancy, shelter.capacity);

          return (
            <div
              key={shelter.id}
              className="rounded-2xl shadow-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
                    <Home className="w-6 h-6" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingShelter(shelter);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(shelter.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase border ${status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  status === 'FULL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-slate-500/10 text-slate-300 border-white/10'
                  }`}>
                  {status}
                </span>

                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{shelter.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{shelter.location}</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300 font-medium">Occupancy</span>
                      <span className={`font-bold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {shelter.current_occupancy} / {shelter.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          }`}
                        style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-white/10 mt-2">
                    <button
                      onClick={() => setSelectedShelter(shelter)}
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

        {filteredShelters.length === 0 && (
          <div
            className="col-span-full text-center py-20 text-slate-400 rounded-2xl border border-white/10"
            style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          >
            No shelters found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
