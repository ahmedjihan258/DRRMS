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
  Map,
  Heart,
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
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: allRoles },
    { name: "Live Map", href: "/map", icon: Map, roles: allRoles },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle, roles: allRoles },
    { name: "Resources", href: "/resources", icon: Package, roles: adminOnly },
    { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: ["ADMIN", "AUTHORITY", "DISPATCHER", "VOLUNTEER"] },
    { name: "Shelters", href: "/shelters", icon: Home, roles: allRoles },
    { name: "Volunteers", href: "/volunteers", icon: Users, roles: adminOnly },
    { name: "Blood Donors", href: "/donors", icon: Heart, roles: allRoles },
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
        className={`fixed inset-y-0 left-0 z-30 w-72 flex flex-col transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } glass-panel`}
      >
        <div className="flex items-center justify-between h-24 px-8 border-b border-white/5 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">DRRMS</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3.5 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${active
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-900/20"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 transition-colors ${active ? "text-white" : "text-slate-500"
                    }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500 rounded-2xl hover:bg-white/5 hover:text-rose-400 transition-all group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
            Logout
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#020617' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] rotate-45 -right-[15%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} userRoles={roles} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-20 bg-white/5 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-6 lg:px-10 z-10 transition-all">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/70 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block drop-shadow-sm">
              Disaster Rescue & Resource Management System
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 relative">
              <button
                className="relative p-2 text-white/60 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                )}
              </button>
              <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                isAdmin={isAdmin}
              />
            </div>

            <Link to="/profile" className="flex items-center space-x-3 pl-4 border-l border-white/10 hover:bg-white/5 transition-all rounded-xl py-1 px-3 -mr-2 group">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold group-hover:bg-white/20 transition-colors">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">{displayName}</p>
                <p className="text-xs text-white/50">{roleLabel}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
