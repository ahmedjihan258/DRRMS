import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Package,
  Home,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  Warehouse,
} from "lucide-react";
import { auth, type MeResponse } from "../api/auth";
import { api } from "../api/services";
import { NotificationCenter } from "./NotificationCenter";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRoles: string[];
}

const Sidebar = ({ isOpen, setIsOpen, userRoles }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to check if user has ANY of the required roles
  const hasRole = (requiredOptions: string[]) => {
    if (!userRoles.length) return false;
    return userRoles.some((r) => requiredOptions.includes(r));
  };

  const allRoles = ["ADMIN", "AUTHORITY", "DISPATCHER", "VOLUNTEER", "CITIZEN"];
  const adminOnly = ["ADMIN", "AUTHORITY", "DISPATCHER"];

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: allRoles },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle, roles: allRoles },
    { name: "Resources", href: "/resources", icon: Package, roles: adminOnly },
    { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: ["ADMIN", "AUTHORITY", "DISPATCHER", "VOLUNTEER"] },
    { name: "Shelters", href: "/shelters", icon: Home, roles: allRoles },
    { name: "Volunteers", href: "/volunteers", icon: Users, roles: adminOnly },
    { name: "Manage Users", href: "/users", icon: Shield, roles: ["ADMIN"] },
  ].filter((item) => hasRole(item.roles));

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    auth.clearToken();
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">DRRMS</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 ${active ? "text-white" : "text-slate-400"
                    }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Load user profile from /api/me (this contains user_name)
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await auth.getMe();
        setMe(data);
      } catch {
        // If token missing/expired, keep defaults
        setMe(null);
      }
    })();
  }, []);

  const displayName = me?.user?.user_name || me?.user?.email || "User";
  const roles = me?.roles || [];
  const roleLabel = roles[0] || "USER";

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
    return letters || "U";
  }, [displayName]);

  const [showNotifications, setShowNotifications] = useState(false);
  const isAdmin = roles.includes("ADMIN");
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await api.getNotifications();
        // Check if is_read is 0 or false (it might come as number or boolean depending on backend driver)
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      } catch (e) {
        console.error("Failed to fetch notification count");
      }
    };
    if (me) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // 30 sec poll
      return () => clearInterval(interval);
    }
  }, [me]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} userRoles={roles} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
              Disaster Risk & Resource Management System
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 relative">
              <button
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                isAdmin={isAdmin}
              />
            </div>

            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
