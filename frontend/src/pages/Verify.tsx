import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, CheckCircle, Mail } from 'lucide-react';
import { api } from '../api/services';

export default function Verify() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [code, setCode] = useState(searchParams.get('code') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Resend state
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.verify({ email, code: code.trim() });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || "Verification failed. Please check your code.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError("Email is required to resend code.");
            return;
        }
        setResendLoading(true);
        setResendMessage(null);
        setError(null);
        try {
            await api.resendVerification({ email });
            setResendMessage("Verification code sent successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to resend code.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full opacity-20 filter blur-[100px] bg-blue-600 animate-pulse"></div>
                <div className="absolute bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full opacity-20 filter blur-[100px] bg-emerald-600 animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div
                    className="rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/10"
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Verify Account</h1>
                        <p className="text-slate-400 text-sm">Enter the code sent to your email</p>
                    </div>

                    {success ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">Verification Successful!</h3>
                            <p className="text-emerald-400/80 text-sm">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Verification Code</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-center text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold tracking-[0.5em] text-xl"
                                    placeholder="XXXXXX"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Account <ArrowRight className="w-5 h-5" /></>}
                            </button>

                            <div className="pt-4 text-center">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendLoading || loading}
                                    className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {resendLoading ? "Resending..." : "Resend Verification Code"}
                                </button>
                                {resendMessage && (
                                    <p className="mt-2 text-emerald-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                                        {resendMessage}
                                    </p>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
