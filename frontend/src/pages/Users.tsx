import { useState, useEffect } from "react";
import { User, api } from "../api/services";
import { Users as UsersIcon, Shield, Mail, Calendar, Search } from "lucide-react";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [updating, setUpdating] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        setUpdating(userId);
        try {
            await api.updateUserRole(userId, newRole);
            // Update local state
            setUsers(prev => prev.map(u =>
                u.user_id === userId ? { ...u, roles: [newRole.toUpperCase()] } : u
            ));
        } catch (err: any) {
            alert(err.message || "Failed to update role");
        } finally {
            setUpdating(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = ['CITIZEN', 'VOLUNTEER', 'DISPATCHER', 'AUTHORITY', 'ADMIN'];

    if (loading) return <div className="p-8 text-center text-slate-500">Loading users...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-blue-400" />
                        User Management
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium">Coordinate access levels and monitor system participants.</p>
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-auto min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div
                className="overflow-hidden rounded-3xl shadow-2xl transition-all duration-300"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Role</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.user_id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-lg shadow-sm">
                                                {user.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white tracking-tight">{user.user_name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">ID: {user.user_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2.5 text-slate-300 text-sm font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                {user.phone_number || "No contact"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <select
                                            value={user.roles[0] || 'CITIZEN'}
                                            onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                                            disabled={updating === user.user_id}
                                            className={`text-[10px] rounded-xl px-4 py-2 font-bold uppercase tracking-widest border-none transition-all outline-none focus:ring-2 focus:ring-white/10 ${updating === user.user_id ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                                                } ${user.roles.includes('ADMIN') ? 'bg-purple-500/10 text-purple-400' :
                                                    user.roles.includes('AUTHORITY') ? 'bg-rose-500/10 text-rose-400' :
                                                        user.roles.includes('DISPATCHER') ? 'bg-amber-500/10 text-amber-400' :
                                                            user.roles.includes('VOLUNTEER') ? 'bg-emerald-500/10 text-emerald-400' :
                                                                'bg-blue-500/10 text-blue-400'
                                                }`}
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role} value={role} className="bg-slate-900 text-white">{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold">
                                            <Calendar className="w-4 h-4 text-blue-500/40" />
                                            {new Date(user.created_at || '').toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <UsersIcon className="w-12 h-12 text-slate-700" />
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-xs">No personnel discovered</p>
                                                <p className="text-slate-500 text-sm mt-1">Try adjusting your search parameters.</p>
                                            </div>
                                        </div>
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
