import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Laptop,
  Video,
  Wrench,
  AlertTriangle,
  Users,
  CheckCircle2,
  HardDrive,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Printer,
  Scale,
  DollarSign,
  Cpu,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { GlowCursor } from '../components/GlowCursor';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: async () => {
      const res = await api.get('/inventario-ti/dashboard-kpis');
      return res.data;
    },
  });

  const { data: pdvs } = useQuery({
    queryKey: ['pdvListDashboard'],
    queryFn: async () => {
      const res = await api.get('/pdv');
      return res.data;
    },
  });

  const totalSedesEquipos = kpis?.modulos?.find((m: any) => m.modulo.includes('Sedes'))?.total || 138;
  const totalPdvs = pdvs?.length || kpis?.modulos?.find((m: any) => m.modulo.includes('PDV'))?.total || 22;
  const pdvStats = kpis?.pdv_stats || {};

  const monoPalette = ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252'];
  const tiposData = kpis?.tipos?.slice(0, 5).map((t: any, idx: number) => ({
    name: t.nombre,
    value: parseInt(t.total, 10),
    color: monoPalette[idx % monoPalette.length],
  })) || [
    { name: 'ALL IN ONE', value: 85, color: '#ffffff' },
    { name: 'CPU-Monitor', value: 24, color: '#d4d4d4' },
    { name: 'Portatil', value: 20, color: '#a3a3a3' },
    { name: 'AIO-Impresora', value: 10, color: '#525252' },
  ];

  const discosData = kpis?.discos?.map((d: any) => ({
    name: d.tipo,
    value: parseInt(d.total, 10),
    color: d.tipo === 'SSD' ? '#ffffff' : '#525252',
  })) || [
    { name: 'SSD', value: 150, color: '#ffffff' },
    { name: 'HDD', value: 10, color: '#525252' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner with GlowCursor */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl">
        <GlowCursor
          color="#FFFFFF"
          secondaryColor="#737373"
          trailLength={35}
          trailWidth={7}
          trailTaper={0.8}
          followSpeed={0.18}
          glowIntensity={1.8}
          glowSpread={1.2}
          hotspot={0.7}
          brightness={1.2}
          opacity={0.9}
          pulseSpeed={1.0}
          noiseStrength={0.03}
          idleFade={true}
          idleTimeout={700}
          fadeDuration={800}
          blendMode="screen"
        >
          <div className="p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Consola Unificada de TI & Puntos de Venta</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Sistema de Gestión de Inventarios TI
              </h1>
              <p className="text-sm text-neutral-400 max-w-2xl font-medium">
                Control centralizado del parque de cómputo en Sedes ({totalSedesEquipos} estaciones) y dotación completa en {totalPdvs} Puntos de Venta.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/inventario-ti')}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-black" />
                <span>Ver Sedes TI</span>
              </button>
              <button
                onClick={() => navigate('/pdv')}
                className="px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs uppercase flex items-center gap-2 border border-neutral-700 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-white" />
                <span>Ver PDVs</span>
              </button>
            </div>
          </div>
        </GlowCursor>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estaciones en Sedes TI"
          value={String(totalSedesEquipos)}
          description="Puestos de cómputo activos"
          icon={Laptop}
          trend={{ value: 100, isPositive: true }}
        />
        <StatCard
          title="Puntos de Venta (PDV)"
          value={String(totalPdvs)}
          description="Tiendas con caja POS"
          icon={Store}
          trend={{ value: 100, isPositive: true }}
        />
        <StatCard
          title="Circuito CCTV en PDV"
          value={`${pdvStats.pdvs_con_dvr || 19} / ${totalPdvs}`}
          description="Tiendas con DVR Dahua activo"
          icon={Video}
          trend={{ value: 86, isPositive: true }}
        />
        <StatCard
          title="Almacenamiento Rápido"
          value="93.7%"
          description="150 equipos con disco SSD"
          icon={HardDrive}
          trend={{ value: 94, isPositive: true }}
        />
      </div>

      {/* Secondary POS Dotación Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Impresoras POS</p>
            <p className="text-lg font-black text-white">{pdvStats.pdvs_con_impresora || 15} Tiendas</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Básculas de Pesaje</p>
            <p className="text-lg font-black text-white">{pdvStats.pdvs_con_bascula || 15} Tiendas</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">Cajones Monederos</p>
            <p className="text-lg font-black text-white">{pdvStats.pdvs_con_cajon || 15} Tiendas</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium">AnyDesk Remoto</p>
            <p className="text-lg font-black text-white">{pdvStats.pdvs_con_anydesk || 18} Tiendas</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Tipo de Computador */}
        <div className="glass-card p-6 rounded-3xl border border-neutral-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">
                Distribución por Tipo de Computador en Sedes
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Clasificación de las {totalSedesEquipos} estaciones de trabajo de oficinas y plantas
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tiposData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#404040',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {tiposData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cobertura Discos SSD vs HDD */}
        <div className="glass-card p-6 rounded-3xl border border-neutral-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white">
              Tecnología de Almacenamiento
            </h3>
            <p className="text-xs text-neutral-400 font-medium">
              Proporción de unidades SSD de alta velocidad vs HDD
            </p>
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={discosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {discosData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#404040',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-800">
            {discosData.map((d: any) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-neutral-300 font-semibold">{d.name}:</span>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
