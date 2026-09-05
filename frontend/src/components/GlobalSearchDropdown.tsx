import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Store,
  Video,
  Wrench,
  ArrowRight,
  ExternalLink,
  MapPin,
  Tag,
  Loader2,
  Search,
} from 'lucide-react';

export interface GlobalSearchResults {
  query: string;
  total: number;
  sedes_ti: any[];
  puntos_venta: any[];
  cctv: any[];
  mantenimientos: any[];
}

interface GlobalSearchDropdownProps {
  query: string;
  results: GlobalSearchResults | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
  query,
  results,
  isLoading,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !query.trim()) return null;

  const total = results?.total || 0;

  const handleSelectSedeEquipo = (id: number, placa?: string) => {
    navigate(`/inventario-ti?search=${encodeURIComponent(placa || query)}&id=${id}`);
    onClose();
  };

  const handleSelectPdv = (id: number) => {
    navigate(`/pdv/${id}`);
    onClose();
  };

  const handleSelectCctv = (id: number) => {
    navigate(`/cctv`);
    onClose();
  };

  const handleSelectMantenimiento = () => {
    navigate(`/mantenimientos`);
    onClose();
  };

  const handleViewAll = () => {
    navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 w-full min-w-[320px] sm:min-w-[420px] max-w-[600px]">
      {/* Header with status */}
      <div className="px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-medium">
        <span className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Search className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>
            {isLoading ? 'Buscando en todas las listas...' : `${total} resultado${total === 1 ? '' : 's'} en total`}
          </span>
        </span>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
          Sedes • PDVs • CCTV • Mantenimientos
        </span>
      </div>

      {/* Body Results Content */}
      <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
        {isLoading && !results && (
          <div className="py-8 text-center text-xs text-neutral-500">
            Consultando inventario unificado...
          </div>
        )}

        {!isLoading && total === 0 && (
          <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
            <p className="font-semibold text-neutral-300">No se encontraron coincidencias</p>
            <p className="text-[11px] text-neutral-500">
              Prueba con placa, serial, nombre de sede, AnyDesk o modelo.
            </p>
          </div>
        )}

        {/* 1. Sedes TI Matches */}
        {results?.sedes_ti && results.sedes_ti.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-white" />
                <span>Sedes TI ({results.sedes_ti.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/inventario-ti?search=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>Ver lista</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="space-y-1">
              {results.sedes_ti.slice(0, 4).map((eq) => (
                <div
                  key={`sede-${eq.id}`}
                  onClick={() => handleSelectSedeEquipo(eq.id, eq.placa_sistemas)}
                  className="p-2 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {eq.nombre_computo || eq.modelo_computo || 'Equipo TI'}
                      </span>
                      {eq.placa_sistemas && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono font-bold">
                          Placa: {eq.placa_sistemas}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {eq.usuario_asignado ? `${eq.usuario_asignado} • ` : ''}
                      {eq.ubicacion_fisica || 'Sede TI'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Puntos de Venta Matches */}
        {results?.puntos_venta && results.puntos_venta.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-white" />
                <span>Puntos de Venta ({results.puntos_venta.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/pdv?search=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>Ver lista</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="space-y-1">
              {results.puntos_venta.slice(0, 4).map((pdv) => (
                <div
                  key={`pdv-${pdv.id}`}
                  onClick={() => handleSelectPdv(pdv.id)}
                  className="p-2 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {pdv.pdv_nombre}
                      </span>
                      {pdv.anydesk && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono font-bold">
                          AnyDesk: {pdv.anydesk}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {pdv.pc_modelo ? `${pdv.pc_modelo} • ` : ''}
                      {pdv.ciudad || 'Colombia'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. CCTV Matches */}
        {results?.cctv && results.cctv.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-white" />
                <span>CCTV & Seguridad ({results.cctv.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/cctv`);
                  onClose();
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>Ver CCTV</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="space-y-1">
              {results.cctv.slice(0, 3).map((cam) => (
                <div
                  key={`cctv-${cam.id}`}
                  onClick={() => handleSelectCctv(cam.id)}
                  className="p-2 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white truncate block">
                      {cam.pdv_nombre}
                    </span>
                    <p className="text-[11px] text-neutral-400 truncate">
                      DVR: {cam.dvr} • Cámaras: {cam.camaras || 'N/A'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Mantenimientos Matches */}
        {results?.mantenimientos && results.mantenimientos.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-white" />
                <span>Mantenimientos ({results.mantenimientos.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/mantenimientos`);
                  onClose();
                }}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <span>Ver lista</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="space-y-1">
              {results.mantenimientos.slice(0, 3).map((m) => (
                <div
                  key={`mant-${m.id}`}
                  onClick={handleSelectMantenimiento}
                  className="p-2 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white truncate block">
                      {m.equipo_nombre} • {m.tipo || 'Mantenimiento'}
                    </span>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {m.descripcion || 'Sin descripción'} • Responsable: {m.tecnico_responsable || 'TI'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer view all */}
      {total > 0 && (
        <div className="p-2.5 bg-neutral-900/95 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400 font-medium">
            Pulsa <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-white">Enter</kbd> para vista unificada
          </span>
          <button
            type="button"
            onClick={handleViewAll}
            className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Ver todos los resultados</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
