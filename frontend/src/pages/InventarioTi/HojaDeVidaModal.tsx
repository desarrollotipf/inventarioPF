import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Laptop,
  HardDrive,
  Cpu,
  Monitor,
  Calendar,
  User,
  MapPin,
  Clock,
  Wrench,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Tag,
  Share2,
  ExternalLink,
  Camera,
  Layers,
  Copy,
  Check,
  Edit,
  Keyboard,
  Mouse,
  Printer,
  Wifi,
  Tv,
  Video,
  Scale,
  DollarSign,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { EquipoModal } from './EquipoModal';
import { MantenimientoModal } from '../Mantenimiento/MantenimientoModal';

interface HojaDeVidaModalProps {
  equipoId: number;
  onClose: () => void;
}

export const HojaDeVidaModal: React.FC<HojaDeVidaModalProps> = ({ equipoId, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'perifericos' | 'mantenimientos' | 'notas'>('info');
  const [nuevaNota, setNuevaNota] = useState('');
  const [copiedAnydesk, setCopiedAnydesk] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['hojaDeVida', equipoId],
    queryFn: async () => {
      const res = await api.get(`/inventario-ti/equipos/${equipoId}/hoja-de-vida`);
      return res.data;
    },
  });

  const equipo = rawData?.equipo || {};
  const perifericos: any[] = Array.isArray(rawData?.perifericos) ? rawData.perifericos : [];
  const mantenimientos: any[] = Array.isArray(rawData?.mantenimientos) ? rawData.mantenimientos : [];
  const notas: any[] = Array.isArray(rawData?.notas) ? rawData.notas : [];

  const addNotaMutation = useMutation({
    mutationFn: async (nota: string) => {
      await api.post(`/inventario-ti/equipos/${equipoId}/notas`, {
        nota,
        autor: 'Técnico Soporte TI',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hojaDeVida', equipoId] });
      setNuevaNota('');
    },
  });

  const handleAddNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;
    addNotaMutation.mutate(nuevaNota);
  };

  const copyAnydesk = (idStr: string) => {
    navigator.clipboard.writeText(idStr);
    setCopiedAnydesk(true);
    setTimeout(() => setCopiedAnydesk(false), 2000);
  };

  const isGood = equipo?.estado_equipo?.toLowerCase().includes('buen');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold text-xl">
              {equipo?.tipo_equipo?.toLowerCase().includes('portatil') ? (
                <Laptop className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  {equipo?.nombre_computo || 'Estación TI'}
                </h2>
                {equipo?.tipo_equipo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-semibold border border-neutral-700">
                    {equipo.tipo_equipo}
                  </span>
                )}
                <Badge variant={isGood ? 'success' : 'warning'}>
                  {equipo?.estado_equipo || 'Buen estado'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-400 font-semibold mt-0.5">
                {equipo?.modelo_computo && equipo.modelo_computo !== 'N/A' && (
                  <span>Modelo: <span className="text-neutral-200 font-medium">{equipo.modelo_computo}</span></span>
                )}
                {equipo?.placa_sistemas && equipo.placa_sistemas !== 'N/A' && (
                  <span>
                    {equipo?.modelo_computo && equipo.modelo_computo !== 'N/A' && '• '}
                    Placa Sistemas: <span className="font-mono text-white font-bold">{equipo.placa_sistemas}</span>
                  </span>
                )}
                {equipo?.placa_inventario && equipo.placa_inventario !== 'N/A' && (
                  <span>• Placa Inv: <span className="font-mono text-white font-bold">{equipo.placa_inventario}</span></span>
                )}
                {equipo?.serial_computo && equipo.serial_computo !== 'N/A' && (
                  <span>• S/N: <span className="font-mono text-neutral-300">{equipo.serial_computo}</span></span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Activo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-800 bg-neutral-950 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'info', label: 'Hardware & Software', icon: Cpu },
            { id: 'perifericos', label: `Periféricos & Conexiones (${perifericos.length})`, icon: Monitor },
            { id: 'mantenimientos', label: `Mantenimientos (${mantenimientos.length})`, icon: Wrench },
            { id: 'notas', label: `Bitácora de Soporte (${notas.length})`, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-white text-white font-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-neutral-900 rounded-2xl" />
              <div className="h-40 bg-neutral-900 rounded-2xl" />
            </div>
          ) : (
            <>
              {/* TAB: INFO & HARDWARE */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Responsible & Location Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-white" />
                        <span>Usuario Asignado</span>
                      </p>
                      <p className="text-sm font-bold text-white">{equipo?.usuario_asignado || 'Sin Asignar'}</p>
                      <p className="text-xs text-neutral-300 font-medium">{equipo?.proceso_oficina || 'Área General'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                        <span>Sede / Ubicación Física</span>
                      </p>
                      <p className="text-sm font-bold text-white">{equipo?.ubicacion_fisica || 'Sede Administrativa'}</p>
                      <p className="text-xs text-neutral-400">{equipo?.sede_ciudad || 'Bogotá'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-white" />
                        <span>Anydesk ID Remoto</span>
                      </p>
                      {equipo?.id_anydesk && equipo?.id_anydesk !== 'N/A' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black font-mono text-white">
                            {equipo.id_anydesk}
                          </span>
                          <button
                            onClick={() => copyAnydesk(String(equipo.id_anydesk))}
                            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedAnydesk ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedAnydesk ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-mono text-neutral-500">N/A</p>
                      )}
                      <p className="text-[11px] text-neutral-400">Soporte técnico remoto</p>
                    </div>
                  </div>

                  {/* Foto de SharePoint si existe */}
                  {equipo?.foto_url && equipo.foto_url.trim() !== '' && equipo.foto_url !== 'N/A' && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-1 flex-1 text-center sm:text-left">
                        <p className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-white" />
                          <span>Registro Fotográfico Físico en Cloud</span>
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Este equipo cuenta con fotografía de auditoría física vinculada en SharePoint.
                        </p>
                        <a
                          href={equipo.foto_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-colors cursor-pointer mt-1"
                        >
                          <span>Abrir Fotografía en SharePoint</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Hardware Spec Cards */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                      Especificaciones de Hardware
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <p className="text-[10px] text-neutral-400 uppercase">Procesador</p>
                        <p className="text-xs font-bold text-neutral-200">{equipo?.procesador || 'N/A'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <p className="text-[10px] text-neutral-400 uppercase">Memoria RAM</p>
                        <p className="text-xs font-bold text-white">
                          {equipo?.ram_capacidad || 'N/A'} {equipo?.ram_tipo ? `(${equipo.ram_tipo})` : ''}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <p className="text-[10px] text-neutral-400 uppercase">Disco Duro</p>
                        <p className="text-xs font-bold text-white">
                          {equipo?.disco_capacidad || 'N/A'} {equipo?.disco_tipo ? `(${equipo.disco_tipo})` : ''}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <p className="text-[10px] text-neutral-400 uppercase">Sistema Operativo</p>
                        <p className="text-xs font-bold text-slate-200">{equipo?.sistema_operativo || 'Windows 11 / 10'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Software Base */}
                  {equipo?.software_base && (
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Software Base & Licenciamiento</p>
                      <p className="text-xs text-slate-300 font-medium">{equipo.software_base}</p>
                    </div>
                  )}

                  {/* Accesorios */}
                  {equipo?.accesorios && (
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Accesorios & Cables</p>
                      <p className="text-xs text-slate-300 font-medium">{equipo.accesorios}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PERIFÉRICOS */}
              {activeTab === 'perifericos' && (() => {
                const getPerifericoIcon = (tipo: string = '') => {
                  const t = tipo.toLowerCase();
                  if (t.includes('teclado')) return Keyboard;
                  if (t.includes('mouse')) return Mouse;
                  if (t.includes('impresora')) return Printer;
                  if (t.includes('modem') || t.includes('router')) return Wifi;
                  if (t.includes('televisor') || t.includes('tv')) return Tv;
                  if (t.includes('cámara') || t.includes('camara') || t.includes('dvr')) return Video;
                  if (t.includes('báscula') || t.includes('bascula')) return Scale;
                  if (t.includes('cajón') || t.includes('cajon')) return DollarSign;
                  return Monitor;
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {perifericos.map((p: any, idx: number) => {
                        const tipoLabel = p.tipo_nombre || p.tipo || 'Periférico';
                        const marcaLabel = p.marca_nombre || p.marca;
                        const hasMarca = marcaLabel && marcaLabel !== 'Genérico' && marcaLabel !== 'N/A' && marcaLabel !== 'null';
                        const hasPlaca = p.placa_inventario && p.placa_inventario !== 'N/A' && p.placa_inventario !== 'null';
                        const hasSerial = p.serial_fabricante && p.serial_fabricante !== 'N/A' && p.serial_fabricante !== 'null';
                        const hasModelo = p.modelo && p.modelo !== tipoLabel && p.modelo !== 'N/A';
                        const DeviceIcon = getPerifericoIcon(tipoLabel);

                        return (
                          <div key={p.id || idx} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <DeviceIcon className="w-3.5 h-3.5 text-white" />
                                {tipoLabel}
                              </span>
                              {hasMarca && <Badge variant="info">{marcaLabel}</Badge>}
                            </div>
                            {hasModelo && (
                              <p className="text-xs text-neutral-300 font-medium">{p.modelo}</p>
                            )}
                            {(hasPlaca || hasSerial) && (
                              <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-800 flex justify-between">
                                {hasPlaca ? (
                                  <span>Placa: <strong className="text-neutral-200">{p.placa_inventario}</strong></span>
                                ) : <span />}
                                {hasSerial ? (
                                  <span>Serial: <strong className="text-neutral-200">{p.serial_fabricante}</strong></span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {perifericos.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-neutral-500 text-xs font-medium">
                          No hay periféricos adicionales registrados en este puesto de cómputo.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB: MANTENIMIENTOS */}
              {activeTab === 'mantenimientos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <span className="text-xs text-neutral-400 font-medium">
                      Historial y programación de intervenciones técnicas
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMantenimientoModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Programar Mantenimiento</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mantenimientos.map((m: any) => (
                      <div key={m.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{m.tipo}</span>
                            <Badge variant={m.estado === 'FINALIZADO' ? 'success' : 'warning'}>
                              {m.estado}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-300">{m.descripcion}</p>
                          <p className="text-[10px] text-neutral-500">Técnico: {m.tecnico_responsable || 'Mantenimiento TI'}</p>
                        </div>
                        <span className="text-xs font-mono text-neutral-400">
                          {new Date(m.fecha_programada || m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {mantenimientos.length === 0 && (
                      <div className="text-center py-8 text-neutral-500 text-xs font-medium">
                        No registra intervenciones técnicas pendientes ni correctivos.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: NOTAS / BITÁCORA */}
              {activeTab === 'notas' && (
                <div className="space-y-4">
                  {/* Form to add note */}
                  <form onSubmit={handleAddNota} className="flex gap-2">
                    <input
                      type="text"
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      placeholder="Escribir nota de soporte técnico o auditoría..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addNotaMutation.isPending || !nuevaNota.trim()}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </form>

                  {/* Notes list */}
                  <div className="space-y-2.5">
                    {notas.map((n: any) => (
                      <div key={n.id} className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{n.autor}</span>
                          <span className="font-mono text-neutral-500">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">{n.nota}</p>
                      </div>
                    ))}
                    {notas.length === 0 && (
                      <div className="text-center py-8 text-neutral-500 text-xs font-medium">
                        Aún no se han agregado notas a la bitácora de este equipo.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EquipoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          equipo={equipo}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['hojaDeVida', equipoId] });
          }}
        />
      )}

      {isMantenimientoModalOpen && (
        <MantenimientoModal
          isOpen={isMantenimientoModalOpen}
          onClose={() => setIsMantenimientoModalOpen(false)}
          initialEquipo={{
            origen: 'SEDE',
            id: equipoId,
            nombre: equipo.nombre_computo || `Equipo #${equipoId}`,
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['hojaDeVida', equipoId] });
            queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
          }}
        />
      )}
    </div>
  );
};
