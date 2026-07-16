import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import { api } from "../api/services";
import { auth } from "../api/auth";
import { Incident } from "../types";
import ReportIncidentModal from "../components/ReportIncidentModal";
import ManageIncidentModal from "../components/ManageIncidentModal";

// ✅ SAFE helper (same pattern as Dashboard)
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
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // User Role
  const [userRole, setUserRole] = useState<string>('CITIZEN');

  // Define fetchIncidents outside useEffect for reuse
  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
      setError("Could not load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    auth.getMe().then(me => {
      const role = me.roles && me.roles.length > 0 ? me.roles[0] : 'CITIZEN';
      setUserRole(role);
    }).catch(() => { });
  }, []);

  const canManage = ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Incidents</h2>
          <p className="text-slate-500">Manage reported disasters and emergencies</p>
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </button>
      </div>

      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={fetchIncidents}
      />

      {selectedIncident && (
        <ManageIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSuccess={fetchIncidents}
        />
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {incidents.map((incident) => (
            <div key={incident.id} className="p-4 hover:bg-slate-50 relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div
                    className={`mt-1 p-2 rounded-full ${incident.severity === "CRITICAL"
                      ? "bg-red-100 text-red-600"
                      : incident.severity === "HIGH"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-yellow-100 text-yellow-600"
                      }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {incident.title}
                    </h3>

                    {/* ✅ FIXED */}
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCoord(incident.latitude)},{" "}
                      {formatCoord(incident.longitude)}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Reported:{" "}
                      {incident.created_at
                        ? new Date(incident.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : incident.status === "REPORTED"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                      }`}
                  >
                    {incident.status.replace("_", " ")}
                  </span>

                  {canManage && (
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Manage Incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {incidents.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No incidents found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

