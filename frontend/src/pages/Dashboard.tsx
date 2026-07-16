import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Users,
  Home,
  Package,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { api } from '../api/services';
import { auth } from '../api/auth';
import { Incident, ResourceStock, Shelter, Volunteer } from '../types';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium flex items-center ${trend.startsWith('+') ? 'text-green-500' : trend.startsWith('0') ? 'text-slate-400' : 'text-red-500'}`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity < 10) return 'LOW_STOCK';
  return 'AVAILABLE';
}

// ✅ Safe helpers (prevents white screen crashes)
function formatCoord(value: unknown, digits = 4): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'N/A';
  return n.toFixed(digits);
}

function formatDate(value: unknown): string {
  if (!value) return 'N/A';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stocks, setStocks] = useState<ResourceStock[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Me (roles) first
        const me = await auth.getMe().catch(() => null);
        const userRoles = me?.roles || [];
        setRoles(userRoles);

        const isAdminOrAuth = userRoles.some(r => ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(r));

        // 2. Conditional Fetching
        const promises: Promise<any>[] = [
          api.getIncidents().catch(() => []),
          api.getShelters().catch(() => [])
        ];

        // Only fetch sensitive data if admin/auth
        if (isAdminOrAuth) {
          promises.push(api.getStocks().catch(() => []));
          promises.push(api.getVolunteers().catch(() => []));
        } else {
          // Push dummy promises just to keep array destructuring clean
          promises.push(Promise.resolve([]));
          promises.push(Promise.resolve([]));
        }

        const results = await Promise.all(promises);
        const incidentsRes = results[0] as Incident[];
        const sheltersRes = results[1] as Shelter[];
        const stocksRes = results[2] as ResourceStock[];
        const volunteersRes = results[3] as Volunteer[];

        setIncidents(incidentsRes);
        setShelters(sheltersRes);
        setStocks(stocksRes);
        setVolunteers(volunteersRes);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not connect to backend. Please ensure your PHP server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateTrend = (items: any[], dateField: string) => {
    if (!items.length) return null;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const currentMonthCount = items.filter(i => {
      const d = new Date(i[dateField]);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const previousMonthCount = items.filter(i => {
      const d = new Date(i[dateField]);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    if (previousMonthCount === 0) {
      return currentMonthCount > 0 ? "+100%" : "0%";
    }

    const change = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(0)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED').length;
  const totalVolunteers = volunteers.length;
  const availableResources = stocks.filter(s => s.quantity > 0).length;
  const activeShelters = shelters.filter(s => s.current_occupancy < s.capacity).length;

  const incidentTrend = calculateTrend(incidents, 'created_at');
  const volunteerTrend = calculateTrend(volunteers, 'created_at');

  const showSensitiveData = roles.some(r => ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(r));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Real-time disaster management insights and statistics.</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Grid adjusting based on role */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${showSensitiveData ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
        <StatCard
          title="Active Incidents"
          value={activeIncidents}
          icon={AlertTriangle}
          color="bg-red-500"
          trend={incidentTrend}
        />

        <StatCard
          title="Open Shelters"
          value={activeShelters}
          icon={Home}
          color="bg-orange-500"
        />

        {showSensitiveData && (
          <>
            <StatCard
              title="Active Volunteers"
              value={totalVolunteers}
              icon={Users}
              color="bg-blue-500"
              trend={volunteerTrend}
            />
            <StatCard
              title="Available Resources"
              value={availableResources}
              icon={Package}
              color="bg-emerald-500"
            />
          </>
        )}
      </div>

      <div className={`grid grid-cols-1 ${showSensitiveData ? 'lg:grid-cols-2' : ''} gap-8`}>
        {/* Recent Incidents - Visible to ALL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Recent Incidents</h3>
            <button
              onClick={() => navigate('/incidents')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {incidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 p-2 rounded-full ${incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{incident.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCoord((incident as any).latitude, 4)}, {formatCoord((incident as any).longitude, 4)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Reported: {formatDate((incident as any).created_at)}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    incident.status === 'REPORTED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {String(incident.status).replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}

            {incidents.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500">No incidents reported yet.</div>
            )}
          </div>
        </div>

        {/* Resource Status - Visible ONLY to Admin/Auth */}
        {showSensitiveData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Critical Resources</h3>
              <button
                onClick={() => navigate('/resources')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Inventory
              </button>
            </div>
            <div className="p-6 space-y-6">
              {stocks.slice(0, 4).map((stock) => {
                const status = getStockStatus(stock.quantity);

                return (
                  <div key={stock.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{stock.resource_name}</span>
                      <span className={`font-medium ${status === 'LOW_STOCK' ? 'text-red-600' : 'text-slate-500'
                        }`}>
                        {stock.quantity} {stock.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status === 'LOW_STOCK' ? 'bg-red-500' :
                          status === 'OUT_OF_STOCK' ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}
                        style={{ width: status === 'LOW_STOCK' ? '20%' : status === 'OUT_OF_STOCK' ? '5%' : '75%' }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {stocks.length === 0 && !loading && (
                <div className="text-center text-slate-500">No resources found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
