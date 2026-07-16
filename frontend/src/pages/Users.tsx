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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                    <p className="text-slate-600">Manage system users and their roles</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                {user.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-slate-900">{user.user_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3 text-slate-400" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.roles[0] || 'CITIZEN'}
                                            onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                                            disabled={updating === user.user_id}
                                            className={`text-sm rounded-full px-3 py-1 font-medium border-none ring-1 ring-inset ${updating === user.user_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
                                                } ${user.roles.includes('ADMIN') ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                    user.roles.includes('AUTHORITY') ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        user.roles.includes('DISPATCHER') ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                                                            user.roles.includes('VOLUNTEER') ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                'bg-slate-50 text-slate-600 ring-slate-500/20'
                                                }`}
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {new Date(user.created_at || '').toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 bg-slate-50/50">
                                        No users found matching your search.
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
