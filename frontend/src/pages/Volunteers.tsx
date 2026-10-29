import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, Mail, Edit2, X, Map, Search } from "lucide-react";
import { api } from "../api/services";
import { auth } from "../api/auth";
import { Volunteer, Skill } from "../types";

const formatCoord = (value: unknown, digits = 4): string => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Skill Editing State
  const [skillOptions, setSkillOptions] = useState<Skill[]>([]);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [editSkillIds, setEditSkillIds] = useState<number[]>([]);

  const isAdmin = userRoles.includes('ADMIN');
  const canViewSensitive = userRoles.some(r => ['ADMIN', 'AUTHORITY', 'DISPATCHER'].includes(r));

  useEffect(() => {
    const init = async () => {
      try {
        const [vols, me] = await Promise.all([
          api.getVolunteers(),
          auth.getMe().catch(() => ({ roles: ['CITIZEN'] }))
        ]);
        setVolunteers(vols);
        setUserRoles(me.roles || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Could not load volunteers.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api.getSkills().then(setSkillOptions).catch(() => { });
    }
  }, [isAdmin]);

  const filteredVolunteers = volunteers.filter(v =>
    (v.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleStatus = async (vol: Volunteer) => {
    if (!isAdmin) return;
    const newStatus = vol.availability === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    try {
      await api.updateVolunteerStatus(vol.id, newStatus);
      setVolunteers(prev => prev.map(v => v.id === vol.id ? { ...v, availability: newStatus } : v));
    } catch (e) {
      console.error("Failed to update status");
    }
  };

  const handleEditSkillsClick = (vol: Volunteer) => {
    setEditingVolunteer(vol);
    const ids = vol.skill_ids ? vol.skill_ids.split(',').map(Number) : [];
    setEditSkillIds(ids);
  };

  const toggleEditSkill = (skillId: number) => {
    setEditSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const saveSkills = async () => {
    if (!editingVolunteer) return;
    try {
      await api.updateVolunteerSkills(editingVolunteer.id, editSkillIds);
      setEditingVolunteer(null);
      // Refresh list to update displayed skills string
      const vols = await api.getVolunteers();
      setVolunteers(vols);
    } catch (e) {
      console.error("Failed to update skills", e);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Volunteers</h2>
          <p className="text-slate-300 mt-1">
            Manage registered volunteers and their availability
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search volunteers..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/map?type=volunteers" className="flex items-center px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium">
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Map</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="divide-y divide-white/5">
          {filteredVolunteers?.map((vol) => (
            <div key={vol.id} className="p-5 hover:bg-white/5 transition-colors group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {vol.user_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Location: {formatCoord(vol.latitude)},{" "}
                    {formatCoord(vol.longitude)}
                  </p>

                  {canViewSensitive && vol.email && (
                    <p className="text-xs text-blue-400/60 flex items-center mt-2 font-medium">
                      <Mail className="w-3 h-3 mr-2" />
                      {vol.email}
                    </p>
                  )}

                  {canViewSensitive && vol.skills && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {vol.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="bg-white/5 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase tracking-tight">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                      <button
                        onClick={() => toggleStatus(vol)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase border transition-all hover:scale-105 active:scale-95 ${vol.availability === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        title="Click to toggle status (Admin)"
                      >
                        {vol.availability}
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase border ${vol.availability === "AVAILABLE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                      >
                        {vol.availability}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleEditSkillsClick(vol)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 tracking-tight transition-all uppercase opacity-0 group-hover:opacity-100"
                    >
                      Edit Skills
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredVolunteers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No volunteers found.
            </div>
          )}
        </div>
      </div>

      {/* Edit Skills Modal */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Edit Skills
              </h3>
              <button onClick={() => setEditingVolunteer(null)} className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-400 mb-5 font-medium">
                Updating skills for <span className="text-white font-bold">{editingVolunteer.user_name}</span>
              </p>

              <div className="max-h-60 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-2 space-y-1 mb-6 custom-scrollbar">
                {skillOptions.map(skill => (
                  <label key={skill.id} className="flex items-center p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      checked={editSkillIds.includes(skill.id)}
                      onChange={() => toggleEditSkill(skill.id)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-700 text-blue-500 focus:ring-blue-500/50 mr-3 transition-all"
                    />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{skill.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingVolunteer(null)}
                  className="px-6 py-2.5 text-sm font-bold uppercase tracking-tight text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSkills}
                  className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
