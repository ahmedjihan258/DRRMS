import { useState, useEffect } from "react";
import { X, AlertTriangle, Users, Package, CheckCircle2, ArrowRight } from "lucide-react";
import { Incident, Volunteer, ResourceStock } from "../types";
import { api } from "../api/services";

interface ManageIncidentModalProps {
    incident: Incident;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManageIncidentModal({ incident: initialIncident, onClose, onSuccess }: ManageIncidentModalProps) {
    const [incident, setIncident] = useState(initialIncident);
    const [activeTab, setActiveTab] = useState<'status' | 'volunteers' | 'resources'>('status');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data State
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [stocks, setStocks] = useState<ResourceStock[]>([]);

    useEffect(() => {
        if (activeTab === 'volunteers') fetchVolunteers();
        if (activeTab === 'resources') fetchResources();
    }, [activeTab]);

    const fetchVolunteers = async () => {
        try {
            const data = await api.getVolunteers();
            setVolunteers(data.filter(v => v.availability === 'AVAILABLE')); // Only show available ones
        } catch (err) { console.error(err); }
    };

    const fetchResources = async () => {
        try {
            const data = await api.getStocks();
            setStocks(data);
        } catch (err) { console.error(err); }
    };

    const handleStatusUpdate = async (newStatus: Incident["status"]) => {
        setLoading(true);
        try {
            await api.updateIncidentStatus(incident.id, newStatus);
            setIncident({ ...incident, status: newStatus });
            setMessage({ type: 'success', text: `Status updated to ${newStatus.replace('_', ' ')}` });

            // If resolved, we might want to refresh volunteers list if viewing
            if (newStatus === 'RESOLVED') onSuccess();

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to update status" });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignVolunteer = async (volunteerId: number) => {
        setLoading(true);
        try {
            await api.assignVolunteer(volunteerId, incident.id);
            setMessage({ type: 'success', text: "Volunteer assigned successfully" });
            fetchVolunteers(); // Refresh list to remove assigned volunteer
            onSuccess(); // Refresh parent to show update if needed
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to assign volunteer" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeployResource = async (e: React.FormEvent, resourceId: number, quantity: number) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.deployResource(resourceId, incident.id, quantity);
            setMessage({ type: 'success', text: "Resources deployed successfully" });
            fetchResources(); // Refresh stock levels
            onSuccess();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to deploy resources" });
        } finally {
            setLoading(false);
        }
    };

    // Sub-component for Resource Row to manage its own quantity state
    const ResourceRow = ({ stock }: { stock: ResourceStock }) => {
        const [qty, setQty] = useState(1);
        return (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                    <p className="font-medium text-slate-700">{stock.resource_name}</p>
                    <p className="text-xs text-slate-500">{stock.quantity} {stock.unit} available at {stock.location}</p>
                </div>
                <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => handleDeployResource(e, stock.id, qty)}
                >
                    {stock.quantity > 0 ? (
                        <>
                            <input
                                type="number"
                                min="1"
                                max={stock.quantity}
                                value={qty}
                                onChange={(e) => setQty(parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || stock.quantity <= 0}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:bg-slate-300"
                            >
                                Deploy
                            </button>
                        </>
                    ) : (
                        <span className="text-xs text-red-500 font-medium px-2">Out of Stock</span>
                    )}
                </form>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Manage Incident
                        </h3>
                        <p className="text-xs text-slate-500">{incident.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'status' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Status
                    </button>
                    <button
                        onClick={() => setActiveTab('volunteers')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'volunteers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Assign Volunteers
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Deploy Resources
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {message && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div className="space-y-6">
                            <p className="text-slate-600 text-sm">
                                Current Status: <span className="font-bold">{incident.status.replace('_', ' ')}</span>
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                {incident.status === 'REPORTED' && (
                                    <button
                                        onClick={() => handleStatusUpdate('IN_PROGRESS')}
                                        className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                                    >
                                        <div className="text-left">
                                            <span className="block font-semibold text-blue-900">Start Operation</span>
                                            <span className="text-xs text-blue-700">Mark incident as In Progress</span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}

                                {incident.status !== 'RESOLVED' && (
                                    <button
                                        onClick={() => handleStatusUpdate('RESOLVED')}
                                        className="flex items-center justify-between p-4 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                                    >
                                        <div className="text-left">
                                            <span className="block font-semibold text-green-900">Resolve Incident</span>
                                            <span className="text-xs text-green-700">Mark as Resolved & Release Volunteers</span>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                    </button>
                                )}

                                {incident.status === 'RESOLVED' && (
                                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                                        This incident has been resolved. No further actions required.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'volunteers' && (
                        incident.status === 'RESOLVED' ? (
                            <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-lg border border-amber-100 flex flex-col items-center">
                                <AlertTriangle className="w-8 h-8 mb-2" />
                                <p className="font-medium">Incident Resolved</p>
                                <p className="text-sm">Cannot assign volunteers to a resolved incident.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Available Volunteers
                                </h4>

                                {volunteers.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                                        No available volunteers found.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {volunteers.map(vol => (
                                            <div key={vol.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {vol.user_name?.charAt(0) || 'V'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">{vol.user_name || vol.email}</p>
                                                        <p className="text-xs text-slate-500">Skills: {vol.skills || 'None listed'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignVolunteer(vol.id)}
                                                    disabled={loading}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {activeTab === 'resources' && (
                        incident.status === 'RESOLVED' ? (
                            <div className="text-center py-8 text-amber-600 bg-amber-50 rounded-lg border border-amber-100 flex flex-col items-center">
                                <AlertTriangle className="w-8 h-8 mb-2" />
                                <p className="font-medium">Incident Resolved</p>
                                <p className="text-sm">Cannot deploy resources to a resolved incident.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Deploy Resources
                                </h4>

                                {stocks.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                                        No resources available.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {stocks.map(stock => (
                                            <ResourceRow key={stock.id} stock={stock} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
