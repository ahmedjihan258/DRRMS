import { useEffect, useState } from "react";
import { Users, Loader2, Mail, Edit2, X } from "lucide-react";
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Volunteers</h2>
        <p className="text-slate-500">
          Manage registered volunteers and their availability
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {volunteers?.map((vol) => (
            <div key={vol.id} className="p-4 hover:bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {vol.user_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Location: {formatCoord(vol.latitude)},{" "}
                    {formatCoord(vol.longitude)}
                  </p>

                  {canViewSensitive && vol.email && (
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <Mail className="w-3 h-3 mr-1.5" />
                      {vol.email}
                    </p>
                  )}

                  {canViewSensitive && vol.skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {vol.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <button
                        onClick={() => toggleStatus(vol)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${vol.availability === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        title="Click to toggle status (Admin)"
                      >
                        {vol.availability}
                      </button>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${vol.availability === "AVAILABLE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {vol.availability}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleEditSkillsClick(vol)}
                      className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit Skills
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {volunteers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No volunteers found.
            </div>
          )}
        </div>
      </div>

      {/* Edit Skills Modal */}
      {editingVolunteer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Edit Skills</h3>
              <button onClick={() => setEditingVolunteer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Updating skills for <span className="font-medium text-slate-900">{editingVolunteer.user_name}</span>
            </p>

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg p-2 space-y-1 mb-6">
              {skillOptions.map(skill => (
                <label key={skill.id} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSkillIds.includes(skill.id)}
                    onChange={() => toggleEditSkill(skill.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm text-slate-700">{skill.name}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveSkills}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

