import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Save,
  Wrench,
  Calendar,
  Clock,
  User,
  MapPin,
  Monitor,
  Store,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';

interface MantenimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mantenimiento?: any | null; // null for create mode, object for edit mode
  initialEquipo?: { origen: 'SEDE' | 'PDV'; id: number; nombre?: string } | null;
  onSuccess?: () => void;
}

export const MantenimientoModal: React.FC<MantenimientoModalProps> = ({
  isOpen,
  onClose,
  mantenimiento,
  initialEquipo,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(mantenimiento?.id);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [origen, setOrigen] = useState<'SEDE' | 'PDV'>('SEDE');
  const [registroId, setRegistroId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'PREVENTIVO' | 'CORRECTIVO'>('PREVENTIVO');
  const [estado, setEstado] = useState<'PROGRAMADO' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO'>('PROGRAMADO');
  const [tecnico, setTecnico] = useState('Antonio Palmera');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [fechaRealizado, setFechaRealizado] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Fetch equipamiento para selector
  const { data: equiposSedes } = useQuery({
    queryKey: ['selectorEquiposSedes'],
    queryFn: async () => {
      const res = await api.get('/inventario-ti/equipos', { params: { limit: 200 } });
      return res.data?.data || [];
    },
    enabled: isOpen && origen === 'SEDE',
  });

  const { data: pdvs } = useQuery({
    queryKey: ['selectorPdvs'],
    queryFn: async () => {
      const res = await api.get('/pdv');
      return res.data || [];
    },
    enabled: isOpen && origen === 'PDV',
  });

  useEffect(() => {
    if (mantenimiento) {
      setOrigen(mantenimiento.origen || 'SEDE');
      setRegistroId(mantenimiento.registro_id || '');
      setTipo(mantenimiento.tipo || 'PREVENTIVO');
      setEstado(mantenimiento.estado || 'PROGRAMADO');
      setTecnico(mantenimiento.tecnico_responsable || 'Antonio Palmera');
      setDescripcion(mantenimiento.descripcion || mantenimiento.descripcion_falla || '');

      if (mantenimiento.fecha_programada) {
        const d = new Date(mantenimiento.fecha_programada);
        setFechaProgramada(d.toISOString().slice(0, 16));
      } else {
        setFechaProgramada('');
      }

      if (mantenimiento.fecha_realizado) {
        const d = new Date(mantenimiento.fecha_realizado);
        setFechaRealizado(d.toISOString().slice(0, 16));
      } else {
        setFechaRealizado('');
      }
    } else if (initialEquipo) {
      setOrigen(initialEquipo.origen);
      setRegistroId(initialEquipo.id);
      setTipo('PREVENTIVO');
      setEstado('PROGRAMADO');
      setTecnico('Antonio Palmera');
      const now = new Date();
      now.setHours(now.getHours() + 24);
      setFechaProgramada(now.toISOString().slice(0, 16));
      setFechaRealizado('');
      setDescripcion('');
    } else {
      setOrigen('SEDE');
      setRegistroId('');
      setTipo('PREVENTIVO');
      setEstado('PROGRAMADO');
      setTecnico('Antonio Palmera');
      const now = new Date();
      now.setHours(now.getHours() + 24);
      setFechaProgramada(now.toISOString().slice(0, 16));
      setFechaRealizado('');
      setDescripcion('');
    }
    setErrorMsg(null);
  }, [mantenimiento, initialEquipo, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit) {
        return (await api.put(`/mantenimientos/${mantenimiento.id}`, payload)).data;
      } else {
        return (await api.post('/mantenimientos', payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientosList'] });
      queryClient.invalidateQueries({ queryKey: ['hojaDeVida'] });
      queryClient.invalidateQueries({ queryKey: ['pdvDetail'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Error al guardar la orden de mantenimiento.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registroId) {
      setErrorMsg('Debes seleccionar el activo o punto de venta a mantener.');
      return;
    }
    if (!fechaProgramada) {
      setErrorMsg('Debes especificar la fecha y hora programada.');
      return;
    }
    if (!descripcion.trim()) {
      setErrorMsg('Ingresa una descripción de los trabajos, protocolo o falla del mantenimiento.');
      return;
    }

    setErrorMsg(null);
    saveMutation.mutate({
      origen,
      registro_id: Number(registroId),
      tipo,
      estado,
      tecnico_responsable: tecnico,
      fecha_programada: fechaProgramada ? new Date(fechaProgramada).toISOString() : null,
      fecha_realizado: fechaRealizado ? new Date(fechaRealizado).toISOString() : null,
      descripcion,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl max-h-[92vh] rounded-3xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isEdit ? `Editar Mantenimiento #${mantenimiento?.id}` : 'Programar Nuevo Mantenimiento'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isEdit
                  ? 'Modifica los datos, estado o reprograma la fecha del mantenimiento'
                  : 'Agenda una orden de soporte técnico preventivo o correctivo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2 text-xs text-neutral-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tipo de Mantenimiento & Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Tipo de Mantenimiento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('PREVENTIVO')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipo === 'PREVENTIVO'
                      ? 'bg-white text-black border-white shadow-md font-extrabold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preventivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('CORRECTIVO')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipo === 'CORRECTIVO'
                      ? 'bg-white text-black border-white shadow-md font-extrabold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Correctivo</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Ubicación / Módulo del Activo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrigen('SEDE');
                    setRegistroId('');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    origen === 'SEDE'
                      ? 'bg-white text-black border-white shadow-md font-extrabold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Sedes TI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrigen('PDV');
                    setRegistroId('');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    origen === 'PDV'
                      ? 'bg-white text-black border-white shadow-md font-extrabold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Puntos de Venta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Activo */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Seleccionar {origen === 'SEDE' ? 'Estación / Activo de Cómputo' : 'Punto de Venta (Tienda)'} <span className="text-white">*</span>
            </label>
            {origen === 'SEDE' ? (
              <select
                value={registroId}
                onChange={(e) => setRegistroId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">-- Seleccionar Estación de Trabajo --</option>
                {equiposSedes?.map((eq: any) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre_computo || 'Estación TI'} • Placa: {eq.placa_sistemas || eq.placa_inventario || 'S/P'} • {eq.usuario_asignado || 'Sin Asignar'} ({eq.ubicacion_fisica || 'Sede Central'})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={registroId}
                onChange={(e) => setRegistroId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">-- Seleccionar Punto de Venta --</option>
                {pdvs?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.pdv_nombre} (PDV N° {p.numero}) • PC Placa: {p.pc_placa || 'N/A'} • AnyDesk: {p.anydesk || 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha Programada & Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Fecha y Hora Programada <span className="text-white">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Técnico Responsable
              </label>
              <input
                type="text"
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                placeholder="Ej. Antonio Palmera, Soporte TI"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Estado y Fecha de Realización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Estado del Mantenimiento
              </label>
              <select
                value={estado}
                onChange={(e) => {
                  const newEstado = e.target.value as any;
                  setEstado(newEstado);
                  if (newEstado === 'FINALIZADO' && !fechaRealizado) {
                    setFechaRealizado(new Date().toISOString().slice(0, 16));
                  }
                }}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="PROGRAMADO">PROGRAMADO</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="FINALIZADO">FINALIZADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Fecha de Ejecución (si ya se realizó)
              </label>
              <input
                type="datetime-local"
                value={fechaRealizado}
                onChange={(e) => setFechaRealizado(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Descripción / Tareas */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Protocolo, Tareas o Diagnóstico de Falla <span className="text-white">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Mantenimiento preventivo general: soplado de equipo, limpieza de ventiladores, cambio de pasta térmica Arctic MX-4, revisión de disco y actualización de parches de seguridad."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {saveMutation.isPending
                  ? 'Guardando...'
                  : isEdit
                  ? 'Guardar Cambios'
                  : 'Programar Mantenimiento'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MantenimientoModal;
