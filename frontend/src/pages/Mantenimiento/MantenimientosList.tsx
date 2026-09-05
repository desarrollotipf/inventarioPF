import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  Calendar,
  Clock,
  User,
  MapPin,
  Laptop,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { MantenimientoModal } from './MantenimientoModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export const MantenimientosList: React.FC = () => {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState<any | null>(null);
  const [deletingMantenimiento, setDeletingMantenimiento] = useState<any | null>(null);

  const { data: mantenimientos, isLoading } = useQuery({
    queryKey: ['mantenimientosList', tipo, estado],
    queryFn: async () => {
      const res = await api.get('/mantenimientos', {
        params: { tipo: tipo || undefined, estado: estado || undefined },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/mantenimientos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientosList'] });
      setDeletingMantenimiento(null);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/mantenimientos/${id}`, {
        estado: 'FINALIZADO',
        fecha_realizado: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientosList'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Wrench className="w-3.5 h-3.5 text-white" />
            <span>Planificador Preventivo & Correctivo</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestión y Calendario de Mantenimientos
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Programación técnica de revisiones periódicas, soporte correctivo y control de asignaciones por técnico.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Mantenimiento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex flex-wrap gap-3">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2 text-xs text-neutral-300 focus:outline-none"
        >
          <option value="">Todos los Tipos</option>
          <option value="PREVENTIVO">Preventivos Periódicos</option>
          <option value="CORRECTIVO">Correctivos / Urgentes</option>
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2 text-xs text-neutral-300 focus:outline-none"
        >
          <option value="">Todos los Estados</option>
          <option value="PROGRAMADO">Programados</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="FINALIZADO">Finalizados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
      </div>

      {/* Enterprise Excel-like List Table */}
      <div className="glass-card rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 shadow-sm">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 divide-x divide-neutral-800">
                <th className="py-3 px-3.5 sticky left-0 z-30 bg-neutral-900 shadow-md">ID</th>
                <th className="py-3 px-3.5 sticky left-14 z-30 bg-neutral-900 shadow-md">Activo / Equipo</th>
                <th className="py-3 px-3.5">Placa / Serial</th>
                <th className="py-3 px-3.5">Sede / Ubicación</th>
                <th className="py-3 px-3.5 text-center">Tipo</th>
                <th className="py-3 px-3.5">Descripción / Observación</th>
                <th className="py-3 px-3.5">Fecha Programada</th>
                <th className="py-3 px-3.5">Técnico Responsable</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 sticky right-0 z-30 bg-neutral-900 text-center shadow-md">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500 animate-pulse">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Cargando hoja de mantenimientos...</span>
                    </div>
                  </td>
                </tr>
              ) : mantenimientos?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500">
                    No hay registros de mantenimientos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                mantenimientos?.map((m: any, idx: number) => (
                  <tr key={m.id || idx} className="hover:bg-neutral-900/60 transition-colors divide-x divide-neutral-800">
                    <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-neutral-950 font-mono text-neutral-400 font-bold shadow-md">
                      #{m.id || idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 sticky left-14 z-10 bg-neutral-950 font-bold text-white shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center shrink-0">
                          <Wrench className="w-3.5 h-3.5" />
                        </div>
                        <span>{m.equipo_nombre_estacion || m.equipo_modelo || 'Activo Tecnológico'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-neutral-300 font-bold">
                      {m.equipo_placa || m.equipo_serial || <span className="text-neutral-600">Sin Placa</span>}
                    </td>
                    <td className="py-2.5 px-3.5 text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>{m.sede_nombre || 'Sede Central'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-white font-mono font-bold">
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-neutral-300 max-w-[280px] truncate" title={m.descripcion_falla}>
                      {m.descripcion_falla || 'Mantenimiento de rutina'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{new Date(m.fecha_programada).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center font-bold text-[10px]">
                          {m.tecnico_responsable?.charAt(0) || 'T'}
                        </div>
                        <span className="text-neutral-200 font-semibold text-xs">
                          {m.tecnico_responsable || 'Antonio Palmera'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <Badge variant={m.estado === 'FINALIZADO' ? 'success' : (m.estado === 'PROGRAMADO' ? 'warning' : 'info')}>
                        {m.estado}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3.5 sticky right-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 text-center shadow-md" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {m.estado !== 'FINALIZADO' && (
                          <button
                            onClick={() => finalizeMutation.mutate(m.id)}
                            disabled={finalizeMutation.isPending}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                            title="Marcar como Finalizado / Ejecutado"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingMantenimiento(m)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                          title="Editar / Reprogramar Mantenimiento"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMantenimiento(m)}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                          title="Eliminar orden de mantenimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crear / Programar Mantenimiento Modal */}
      {isCreateModalOpen && (
        <MantenimientoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mantenimiento={null}
        />
      )}

      {/* Editar Mantenimiento Modal */}
      {editingMantenimiento && (
        <MantenimientoModal
          isOpen={Boolean(editingMantenimiento)}
          onClose={() => setEditingMantenimiento(null)}
          mantenimiento={editingMantenimiento}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMantenimiento && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingMantenimiento)}
          onClose={() => setDeletingMantenimiento(null)}
          onConfirm={() => deleteMutation.mutate(deletingMantenimiento.id)}
          title="Eliminar Mantenimiento"
          description="¿Estás seguro de que deseas eliminar este registro de mantenimiento de la base de datos?"
          itemName={`Mantenimiento #${deletingMantenimiento.id} - ${deletingMantenimiento.equipo_nombre_estacion || 'Activo TI'}`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default MantenimientosList;
