import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus, Loader2, Map, ShieldAlert, ChevronRight, Clock } from "lucide-react";
import { api } from "../api/services";
import { auth } from "../api/auth";
import { Incident } from "../types";
import ReportIncidentModal from "../components/ReportIncidentModal";
import ManageIncidentModal from "../components/ManageIncidentModal";
import ViewIncidentModal from "../components/ViewIncidentModal";

const formatCoord = (value: unknown, digits = 4): string => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
};

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIncidentManage, setSelectedIncidentManage] = useState<Incident | null>(null);
  const [selectedIncidentView, setSelectedIncidentView] = useState<Incident | null>(null);

  // User Auth
  const [userRole, setUserRole] = useState<string>('CITIZEN');

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
      setError("Could not load operational logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    auth.getMe().then(me => {
      setUserRole(me.roles && me.roles.length > 0 ? me.roles[0] : 'CITIZEN');
    }).catch(() => { });
  }, []);

  const canManage = ['ADMIN', 'AUTHORITY', 'DISPATCHER', 'VOLUNTEER'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Incidents</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live situational analysis and field reports
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/map?type=incidents" className="flex items-center px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl">
            <Map className="w-4 h-4 mr-2.5 text-blue-400" />
            View on Map
          </Link>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2.5" />
            Report Event
          </button>
        </div>
      </div>

      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={fetchIncidents}
      />

      {selectedIncidentManage && (
        <ManageIncidentModal
          incident={selectedIncidentManage}
          onClose={() => setSelectedIncidentManage(null)}
          onSuccess={fetchIncidents}
          userRole={userRole}
        />
      )}

      {selectedIncidentView && (
        <ViewIncidentModal
          incident={selectedIncidentView}
          onClose={() => setSelectedIncidentView(null)}
        />
      )}

      {error && (
        <div className="p-5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center font-bold text-sm animate-shake">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => setSelectedIncidentView(incident)}
            className="bg-white/5 border border-white/5 p-6 rounded-[32px] hover:bg-white/[0.08] hover:border-white/10 transition-all group flex flex-col sm:flex-row justify-between items-center gap-6 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div
                className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${incident.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30" :
                  incident.severity === "HIGH" ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30" :
                    "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                  }`}
              >
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{incident.disaster_type}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight truncate pr-8">{incident.title}</h3>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  <span>GPS: {formatCoord(incident.latitude)}, {formatCoord(incident.longitude)}</span>
                  <span className="opacity-40">/</span>
                  <span>Reported By: <span className="text-blue-400/80">{incident.reporter_name || 'System'}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
              <span
                className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all ${incident.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                  incident.status === "REPORTED" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}
              >
                {incident.status.replace("_", " ")}
              </span>

              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIncidentManage(incident);
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all shadow-lg active:scale-95"
                >
                  {userRole === 'VOLUNTEER' ? 'Update Situations' : 'Tactical Center'}
                </button>
              )}
            </div>
          </div>
        ))}

        {incidents.length === 0 && (
          <div className="py-24 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/5">
            <ShieldAlert className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h4 className="text-xl font-bold text-slate-600 tracking-tight">No Active Incidents Detected</h4>
            <p className="text-slate-700 text-sm mt-2 font-medium">System is currently in monitoring mode.</p>
          </div>
        )}
      </div>
    </div>
  );
}
