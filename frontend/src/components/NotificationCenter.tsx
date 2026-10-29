import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Plus, Send, X, Mail, ArrowRight, Search, User as UserIcon } from "lucide-react";
import { api, User } from "../api/services";
import type { Notification } from "../types";

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen,
    onClose,
    isAdmin,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [targetType, setTargetType] = useState<"GLOBAL" | "ROLE" | "USER">("GLOBAL");
    const [targetRole, setTargetRole] = useState("VOLUNTEER");
    const [targetUserId, setTargetUserId] = useState("");
    const [msgType, setMsgType] = useState<"INFO" | "ALERT" | "WARNING">("INFO");

    // User Search State
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            if (isAdmin) {
                // Fetch users for the dropdown
                api.getUsers().then(setUsers).catch(console.error);
            }
        }
    }, [isOpen, isAdmin]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredUsers = users.filter(u =>
        u.user_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleSelectUser = (user: User) => {
        setTargetUserId(user.user_id.toString());
        setUserSearch(user.user_name);
        setShowUserDropdown(false);
    };

    const handleMarkRead = async (id: number) => {
        try {
            await api.markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createNotification({
                title: newTitle,
                message: newMessage,
                type: msgType,
                target_type: targetType,
                role_name: targetType === "ROLE" ? targetRole : undefined,
                user_id: targetType === "USER" ? parseInt(targetUserId) : undefined,
            });
            setShowCreate(false);
            setNewTitle("");
            setNewMessage("");
            setTargetUserId("");
            setUserSearch("");
            alert("Notification Sent!");
            fetchNotifications();
        } catch (err) {
            alert("Failed to send");
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute right-0 top-16 mt-4 w-[420px] h-[580px] flex flex-col overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-4 duration-300 border border-white/10"
            style={{
                background: 'rgba(30, 41, 59, 0.98)',
                backdropFilter: 'blur(50px)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5">
                <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-[0.2em]">Notifications</h3>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className={`p-2.5 rounded-xl transition-all ${showCreate ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                            title="Send Notification"
                        >
                            {showCreate ? <X className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Create Mode */}
            {showCreate ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Title</label>
                            <input
                                type="text"
                                placeholder="Emergency Alert..."
                                className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold text-sm"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Message Body</label>
                            <textarea
                                placeholder="Describe the situation..."
                                className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium text-sm h-32 resize-none"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Priority</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/20 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all"
                                    value={msgType}
                                    onChange={(e) => setMsgType(e.target.value as any)}
                                >
                                    <option value="INFO">Information</option>
                                    <option value="ALERT">Critical Alert</option>
                                    <option value="WARNING">Warning Log</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Distribution</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/20 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all"
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value as any)}
                                >
                                    <option value="GLOBAL">Global Cast</option>
                                    <option value="ROLE">Role Base</option>
                                    <option value="USER">Specific Unit</option>
                                </select>
                            </div>
                        </div>

                        {targetType === "ROLE" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Target Sector</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/20 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                >
                                    <option value="ADMIN">System Admin</option>
                                    <option value="AUTHORITY">Authorities</option>
                                    <option value="DISPATCHER">Dispatchers</option>
                                    <option value="VOLUNTEER">Active Volunteers</option>
                                    <option value="CITIZEN">All Citizens</option>
                                </select>
                            </div>
                        )}

                        {targetType === "USER" && (
                            <div className="space-y-1.5 relative" ref={dropdownRef}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Target User Search</label>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-semibold text-sm"
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setShowUserDropdown(true);
                                        }}
                                        onFocus={() => setShowUserDropdown(true)}
                                    />
                                    {targetUserId && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>

                                {showUserDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {filteredUsers.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">No users found</div>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <button
                                                    key={user.user_id}
                                                    type="button"
                                                    onClick={() => handleSelectUser(user)}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white text-sm font-bold">{user.user_name}</div>
                                                        <div className="text-slate-400 text-xs">{user.email}</div>
                                                    </div>
                                                    {targetUserId === user.user_id.toString() && (
                                                        <Check className="w-4 h-4 text-green-400 ml-auto" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/40 transition-all active:scale-95 mt-4"
                        >
                            <Send className="w-5 h-5 mr-3" />
                            Send
                        </button>
                    </form>
                </div>
            ) : (
                /* List Mode */
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-24 text-center">
                            <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Dispatches...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-24 text-center bg-white/2">
                            <Bell className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-30" />
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Zero Active Logs</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-6 transition-all relative group ${!n.is_read ? "bg-blue-500/[0.08] ring-1 ring-inset ring-blue-500/20" : "hover:bg-white/[0.04]"}`}
                                >
                                    <div className="flex justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                {n.type === "ALERT" && (
                                                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 text-[9px] font-black rounded-lg border border-rose-500/30 uppercase tracking-tighter">
                                                        Critical
                                                    </span>
                                                )}
                                                {n.type === "WARNING" && (
                                                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-500 text-[9px] font-black rounded-lg border border-amber-500/30 uppercase tracking-tighter">
                                                        Warning
                                                    </span>
                                                )}
                                                <h4 className={`text-sm font-black tracking-tight leading-snug ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                                                    {n.title}
                                                </h4>
                                                {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />}
                                            </div>
                                            <p className={`text-sm leading-relaxed mb-3 ${!n.is_read ? 'text-slate-200' : 'text-slate-400'}`}>{n.message}</p>
                                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span>{new Date(n.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <button
                                                onClick={() => handleMarkRead(n.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:bg-blue-500 active:scale-90 shrink-0"
                                                title="Mark as Read"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};
