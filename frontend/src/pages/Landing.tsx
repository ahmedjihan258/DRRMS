import { useNavigate } from "react-router-dom";
import { Shield, Activity, Users, Map, Heart, ArrowRight, CheckCircle2, AlertTriangle, Zap, Globe, Lock } from "lucide-react";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic">DRRMS - Disaster Rescue and Resource Management System</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                        >
                            Register
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-blob"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
                        <Zap className="w-3 h-3" />
                        Next-Gen Disaster Response Matrix
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 max-w-5xl mx-auto">
                        CRITICAL COORDINATION <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">DEFINED BY PRECISION.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium mb-12">
                        Integrated platform for real-time incident tracking, resource distribution, and specialized volunteer deployment during large-scale emergencies.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white text-[#020617] text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-2xl shadow-white/5"
                        >
                            Initialize Access
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            View Live Map
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section id="features" className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Globe className="w-8 h-8" />,
                                title: "Live Geospatial Hub",
                                desc: "Visualize disaster dynamics with precision layering and real-time incident markers."
                            },
                            {
                                icon: <Zap className="w-8 h-8" />,
                                title: "Rapid Stock Flow",
                                desc: "Automated warehouse logistics and urgent resource allocation across the network."
                            },
                            {
                                icon: <Shield className="w-8 h-8" />,
                                title: "Unified Command",
                                desc: "Centralized authority control with role-based access for volunteers and dispatchers."
                            }
                        ].map((feat, i) => (
                            <div
                                key={i}
                                className="p-10 rounded-[40px] bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group duration-500"
                            >
                                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500">
                                    {feat.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feat.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/* Bottom CTA */}
            <section className="py-40 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-400 mx-auto mb-10 border border-blue-500/20">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-6 uppercase italic">Operational Excellence Starts Here.</h2>
                    <p className="text-slate-500 font-medium mb-12 text-lg">
                        Join the most resilient emergency network. Together, we mitigate risks and save lives through data-driven action.
                    </p>
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-12 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/40"
                        >
                            Join as Volunteer
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5 bg-[#010411]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-black tracking-tighter text-white uppercase italic">DRRMS - Disaster Rescue and Resource Management System</span>
                        </div>
                        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">&copy; 2026 Strategic Disaster Resilience Network.</p>
                    </div>
                    <div className="flex flex-col md:items-end gap-2 text-right">
                        <div className="flex gap-10 mb-2">
                            {['Privacy', 'Protocol', 'API'].map(item => (
                                <a key={item} href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:text-white transition-colors">{item}</a>
                            ))}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span className="text-blue-400 mr-2">Contact:</span> 01846794199, 01690140266
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span className="text-blue-400 mr-2">Email:</span> drrms2026@gmail.com
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
