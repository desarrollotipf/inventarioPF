import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Laptop,
  Store,
  Video,
  Wrench,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2,
  MapPin,
  Cpu,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';

export const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'sedes' | 'pdv' | 'cctv' | 'mantenimientos'>('all');
  const [copiedAnydesk, setCopiedAnydesk] = useState<string | null>(null);

  const query = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: async () => {
      if (!query.trim()) return null;
      const res = await api.get('/catalogos/global-search', { params: { q: query.trim() } });
      return res.data;
    },
    enabled: Boolean(query.trim()),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const handleCopyAnydesk = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedAnydesk(id);
    setTimeout(() => setCopiedAnydesk(null), 1800);
  };

  const total = data?.total || 0;
  const sedesCount = data?.sedes_ti?.length || 0;
  const pdvCount = data?.puntos_venta?.length || 0;
  const cctvCount = data?.cctv?.length || 0;
  const mantCount = data?.mantenimientos?.length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-white" />
            <span>Motor de Búsqueda Global Unificado</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Resultados de búsqueda
          </h1>

          <p className="text-sm text-neutral-400">
            Buscando coincidencias en tiempo real en <span className="text-white font-semibold">Sedes TI</span>, <span className="text-white font-semibold">Puntos de Venta</span>, <span className="text-white font-semibold">CCTV</span> y <span className="text-white font-semibold">Mantenimientos</span>.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Escribe placa, serial, sede, AnyDesk, técnico..."
                className="w-full bg-neutral-900 border border-neutral-700 focus:border-white rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase transition-all cursor-pointer shadow-md"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-black font-extrabold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <span>Todos</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'all' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sedes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sedes'
              ? 'bg-white text-black font-extrabold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Sedes TI</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'sedes' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {sedesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pdv')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pdv'
              ? 'bg-white text-black font-extrabold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Puntos de Venta</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'pdv' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {pdvCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cctv')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'cctv'
              ? 'bg-white text-black font-extrabold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>CCTV</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'cctv' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {cctvCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mantenimientos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mantenimientos'
              ? 'bg-white text-black font-extrabold shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Mantenimientos</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'mantenimientos' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
            {mantCount}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white" />
          <p className="text-sm text-neutral-400">Consultando todas las listas del sistema...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <div className="p-12 text-center border border-neutral-800 rounded-3xl bg-neutral-950 space-y-2">
          <p className="text-lg font-bold text-white">No se encontraron resultados para "{query}"</p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Verifica la ortografía o intenta buscar por número de placa, serial de fabricante, AnyDesk o nombre de sede.
          </p>
        </div>
      )}

      {/* Results Content */}
      {!isLoading && total > 0 && (
        <div className="space-y-8">
          {/* Section 1: Sedes TI */}
          {(activeTab === 'all' || activeTab === 'sedes') && sedesCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-white" />
                  <span>Sedes TI ({sedesCount})</span>
                </h2>
                <button
                  onClick={() => navigate(`/inventario-ti?search=${encodeURIComponent(query)}`)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  <span>Abrir en Sedes TI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.sedes_ti.map((eq: any) => (
                  <div
                    key={`sede-${eq.id}`}
                    onClick={() => navigate(`/inventario-ti?search=${encodeURIComponent(eq.placa_sistemas || eq.nombre_computo || query)}&id=${eq.id}`)}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          {eq.nombre_computo || eq.modelo_computo || 'Estación TI'}
                        </span>
                        {eq.placa_sistemas && (
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 font-mono font-bold">
                            #{eq.placa_sistemas}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-neutral-400">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate">{eq.ubicacion_fisica || 'Sede no especificada'}</span>
                        </p>
                        {eq.usuario_asignado && (
                          <p className="truncate text-neutral-300 font-medium">
                            Responsable: {eq.usuario_asignado}
                          </p>
                        )}
                        {eq.modelo_computo && (
                          <p className="truncate text-neutral-400">
                            Modelo: {eq.modelo_computo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                      {eq.id_anydesk ? (
                        <button
                          onClick={(e) => handleCopyAnydesk(eq.id_anydesk, e)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-[11px]"
                        >
                          {copiedAnydesk === eq.id_anydesk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{eq.id_anydesk}</span>
                        </button>
                      ) : (
                        <span className="text-neutral-600 text-[11px]">Sin AnyDesk</span>
                      )}
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px] font-bold">
                        Ver ficha <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Puntos de Venta */}
          {(activeTab === 'all' || activeTab === 'pdv') && pdvCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-white" />
                  <span>Puntos de Venta ({pdvCount})</span>
                </h2>
                <button
                  onClick={() => navigate(`/pdv?search=${encodeURIComponent(query)}`)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  <span>Abrir en Puntos de Venta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.puntos_venta.map((pdv: any) => (
                  <div
                    key={`pdv-${pdv.id}`}
                    onClick={() => navigate(`/pdv/${pdv.id}`)}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-white">
                          {pdv.pdv_nombre}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 font-bold">
                          {pdv.ciudad || 'Colombia'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-neutral-400">
                        {pdv.pc_modelo && (
                          <p className="truncate text-neutral-300 font-medium">
                            PC: {pdv.pc_modelo} {pdv.pc_placa ? `(#${pdv.pc_placa})` : ''}
                          </p>
                        )}
                        {pdv.impresora && (
                          <p className="truncate text-neutral-400">
                            Impresora: {pdv.impresora}
                          </p>
                        )}
                        {pdv.dvr && (
                          <p className="truncate text-neutral-400">
                            DVR: {pdv.dvr} {pdv.camaras ? `(${pdv.camaras} cámaras)` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                      {pdv.anydesk ? (
                        <button
                          onClick={(e) => handleCopyAnydesk(pdv.anydesk, e)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-[11px]"
                        >
                          {copiedAnydesk === pdv.anydesk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>AnyDesk: {pdv.anydesk}</span>
                        </button>
                      ) : (
                        <span className="text-neutral-600 text-[11px]">Sin AnyDesk</span>
                      )}
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px] font-bold">
                        Ver detalle <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: CCTV */}
          {(activeTab === 'all' || activeTab === 'cctv') && cctvCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-white" />
                  <span>CCTV & Seguridad ({cctvCount})</span>
                </h2>
                <button
                  onClick={() => navigate(`/cctv`)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  <span>Abrir CCTV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.cctv.map((c: any) => (
                  <div
                    key={`cctv-${c.id}`}
                    onClick={() => navigate(`/cctv`)}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">{c.pdv_nombre}</span>
                      <p className="text-xs text-neutral-400">DVR: {c.dvr}</p>
                      <p className="text-xs text-neutral-400">Cámaras: {c.camaras || 'N/A'}</p>
                    </div>
                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">{c.ciudad || 'Colombia'}</span>
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px] font-bold">
                        Monitorear <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Mantenimientos */}
          {(activeTab === 'all' || activeTab === 'mantenimientos') && mantCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-white" />
                  <span>Mantenimientos ({mantCount})</span>
                </h2>
                <button
                  onClick={() => navigate(`/mantenimientos`)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  <span>Abrir Mantenimientos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.mantenimientos.map((m: any) => (
                  <div
                    key={`mant-${m.id}`}
                    onClick={() => navigate(`/mantenimientos`)}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{m.equipo_nombre}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-bold uppercase">
                          {m.tipo || 'Soporte'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 line-clamp-2">{m.descripcion || 'Sin descripción'}</p>
                      <p className="text-xs text-neutral-500">Técnico: {m.tecnico_responsable || 'TI'}</p>
                    </div>
                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 text-[11px]">Estado: {m.estado || 'Registrado'}</span>
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px] font-bold">
                        Ver <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
