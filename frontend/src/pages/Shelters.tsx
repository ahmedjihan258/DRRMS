import { useEffect, useState } from 'react';
import { Home, Loader2 } from 'lucide-react';
import { api } from '../api/services';
import { auth } from '../api/auth';
import { Shelter } from '../types';
import ShelterDetailsModal from '../components/ShelterDetailsModal';

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
  const [userRole, setUserRole] = useState<string>('CITIZEN');

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

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Shelter Management</h2>
        <p className="text-slate-500 mt-1">Monitor shelter capacity and occupancy status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelters.map((shelter) => {
          const occupancyRate = shelter.capacity > 0
            ? (shelter.current_occupancy / shelter.capacity) * 100
            : 100;

          const isFull = occupancyRate >= 90;

          const status = getShelterStatus(shelter.current_occupancy, shelter.capacity);

          return (
            <div key={shelter.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                    <Home className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'OPEN' ? 'bg-green-100 text-green-700' :
                      status === 'FULL' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                    {status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-1">{shelter.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{shelter.location}</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Occupancy</span>
                      <span className={`font-medium ${isFull ? 'text-red-600' : 'text-slate-700'}`}>
                        {shelter.current_occupancy} / {shelter.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-slate-50">
                    <button
                      onClick={() => setSelectedShelter(shelter)}
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

        {shelters.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100">
            No shelters found.
          </div>
        )}
      </div>
    </div>
  );
}
