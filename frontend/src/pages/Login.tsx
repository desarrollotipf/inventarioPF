import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { BorderGlow } from '../components/BorderGlow';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [correo, setCorreo] = useState('admin@pollofiesta.com');
  const [password, setPassword] = useState('Admin2026*');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { correo, password });
      const token = res.data.token || res.data.accessToken;
      login(token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setCorreo(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Card wrapped with BorderGlow */}
        <BorderGlow
          borderRadius={24}
          edgeSensitivity={35}
          glowIntensity={1.2}
          animated={true}
          backgroundColor="#0a0a0a"
          colors={['#ffffff', '#a3a3a3', '#525252']}
          className="shadow-2xl"
        >
          <div className="p-8">
          {/* Brand Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg ring-1 ring-white/40">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Pollo Fiesta S.A.</h1>
            <p className="text-xs text-neutral-400 font-semibold mt-1 uppercase tracking-wider">
              Sistema de Gestión de Inventarios TI & PDV
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  placeholder="usuario@pollofiesta.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white hover:bg-neutral-200 text-black font-black py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Profiles for Testing */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center mb-3">
              Perfiles de Acceso Rápido
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@pollofiesta.com', 'Admin2026*')}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold text-neutral-200 hover:text-white transition-all text-center cursor-pointer"
              >
                👑 Admin TI
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('soporte@pollofiesta.com', 'Tecnico2026*')}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold text-neutral-200 hover:text-white transition-all text-center cursor-pointer"
              >
                🔧 Técnico
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('auditoria@pollofiesta.com', 'Auditor2026*')}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold text-neutral-200 hover:text-white transition-all text-center cursor-pointer"
              >
                📋 Auditor
              </button>
            </div>
          </div>
        </div>
        </BorderGlow>
      </div>
    </div>
  );
};
