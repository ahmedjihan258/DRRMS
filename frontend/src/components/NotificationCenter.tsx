import React, { useEffect, useState } from "react";
import { Bell, Check, Plus, Send, X, Mail } from "lucide-react";
import { api } from "../api/services";
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
        }
    }, [isOpen]);

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
            alert("Notification Sent!");
            fetchNotifications();
        } catch (err) {
            alert("Failed to send");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-16 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700">Notifications</h3>
                <div className="flex items-center space-x-2">
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Send Notification"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Create Mode */}
            {showCreate ? (
                <div className="p-4 bg-slate-50">
                    <form onSubmit={handleCreate} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Title"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Message"
                            className="w-full px-3 py-2 border rounded-md text-sm h-20"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                className="px-3 py-2 border rounded-md text-sm"
                                value={msgType}
                                onChange={(e) => setMsgType(e.target.value as any)}
                            >
                                <option value="INFO">Info</option>
                                <option value="ALERT">Alert</option>
                                <option value="WARNING">Warning</option>
                            </select>
                            <select
                                className="px-3 py-2 border rounded-md text-sm"
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as any)}
                            >
                                <option value="GLOBAL">All Users</option>
                                <option value="ROLE">By Role</option>
                                <option value="USER">Specific User</option>
                            </select>
                        </div>

                        {targetType === "ROLE" && (
                            <select
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="AUTHORITY">Authority</option>
                                <option value="DISPATCHER">Dispatcher</option>
                                <option value="VOLUNTEER">Volunteer</option>
                                <option value="CITIZEN">Citizen</option>
                            </select>
                        )}

                        {targetType === "USER" && (
                            <input
                                type="number"
                                placeholder="User ID"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                required
                            />
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Send Notification
                        </button>
                    </form>
                </div>
            ) : (
                /* List Mode */
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-blue-50/50" : ""
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            {n.type === "ALERT" && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                    ALERT
                                                </span>
                                            )}
                                            {n.type === "WARNING" && (
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                                                    WARN
                                                </span>
                                            )}
                                            <h4 className={`text-sm font-medium ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {n.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">{n.message}</p>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <span>{new Date(n.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Mark as Read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
