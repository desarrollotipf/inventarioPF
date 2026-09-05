import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Video, Search, Eye, ShieldCheck, Wifi, Tv, Store } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export const CctvViewer: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pdvs, isLoading } = useQuery({
    queryKey: ['cctvGlobalList'],
    queryFn: async () => {
      const res = await api.get('/pdv');
      return res.data;
    },
  });

  const filteredPdvs = Array.isArray(pdvs)
    ? pdvs.filter((p: any) => {
        const name = p.pdv_nombre || p.nombre || '';
        const dvr = p.dvr || '';
        const ciudad = p.ciudad || '';
        const term = searchTerm.toLowerCase();
        return (
          name.toLowerCase().includes(term) ||
          dvr.toLowerCase().includes(term) ||
          ciudad.toLowerCase().includes(term)
        );
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5 text-white" />
            <span>Videovigilancia Corporativa</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Topología & Circuitos CCTV por Punto de Venta
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Lista de supervisión centralizada de grabadores DVR Dahua, canales de cámaras y enlace en las 22 tiendas.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar circuito CCTV por PDV o DVR..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Enterprise Excel-like List Table for CCTV */}
      <div className="glass-card rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 shadow-sm">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 divide-x divide-neutral-800">
                <th className="py-3 px-3.5 sticky left-0 z-30 bg-neutral-900 shadow-md">N°</th>
                <th className="py-3 px-3.5 sticky left-14 z-30 bg-neutral-900 shadow-md">Punto de Venta</th>
                <th className="py-3 px-3.5">Ciudad</th>
                <th className="py-3 px-3.5">Grabador DVR / NVR</th>
                <th className="py-3 px-3.5 text-center">Cámaras Activas</th>
                <th className="py-3 px-3.5">Módem de Conexión</th>
                <th className="py-3 px-3.5">Pantalla / Menú Board</th>
                <th className="py-3 px-3.5 text-center">Estado Circuito</th>
                <th className="py-3 px-3.5 sticky right-0 z-30 bg-neutral-900 text-center shadow-md">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Cargando topología de videovigilancia...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPdvs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No se encontraron circuitos CCTV que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPdvs.map((pdv: any) => {
                  const hasDvr = pdv.dvr && pdv.dvr !== 'N/A';
                  const pdvName = pdv.pdv_nombre || pdv.nombre || 'PDV';

                  return (
                    <tr
                      key={pdv.id}
                      onClick={() => navigate(`/pdv/${pdv.id}`)}
                      className="hover:bg-neutral-900/60 transition-colors divide-x divide-neutral-800 cursor-pointer group"
                    >
                      <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-mono text-neutral-400 font-bold shadow-md">
                        {pdv.numero || pdv.id}
                      </td>
                      <td className="py-2.5 px-3.5 sticky left-14 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-bold text-white shadow-md">
                        {pdvName}
                      </td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{pdv.ciudad || 'Bogotá'}</td>
                      <td className="py-2.5 px-3.5 text-white font-medium max-w-[220px] truncate" title={pdv.dvr}>
                        {hasDvr ? pdv.dvr : <span className="text-neutral-600 font-mono">Sin DVR</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-white">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
                          {pdv.camaras ? `${pdv.camaras} Canales` : '3 Canales'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-neutral-400 font-mono">
                        {pdv.modem || <span className="text-neutral-600">N/A</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-neutral-300">
                        {pdv.televisor || <span className="text-neutral-600">N/A</span>}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <Badge variant={hasDvr ? 'success' : 'warning'}>
                          {hasDvr ? 'ONLINE' : 'SIN DVR'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 sticky right-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 text-center shadow-md" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/pdv/${pdv.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CctvViewer;
