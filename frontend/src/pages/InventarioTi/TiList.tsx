import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  LayoutList,
  Columns3,
  RotateCcw,
  User,
  MapPin,
  Cpu,
  HardDrive,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Tag,
  Briefcase,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { HojaDeVidaModal } from './HojaDeVidaModal';
import { EquipoModal } from './EquipoModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export const TiList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearch(s);
    }
    const idParam = searchParams.get('id');
    if (idParam) {
      const parsed = parseInt(idParam, 10);
      if (!isNaN(parsed)) {
        setSelectedEquipoId(parsed);
      }
    }
  }, [searchParams]);
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [sede, setSede] = useState('');
  const [proceso, setProceso] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'excel' | 'practica'>('excel');
  const [selectedEquipoId, setSelectedEquipoId] = useState<number | null>(null);
  const [copiedAnydesk, setCopiedAnydesk] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<any | null>(null);
  const [deletingEquipo, setDeletingEquipo] = useState<any | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inventario-ti/equipos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setDeletingEquipo(null);
    },
  });

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedAnydesk(text);
    setTimeout(() => setCopiedAnydesk(null), 2000);
  };

  const clearFilters = () => {
    setSearch('');
    setTipoEquipo('');
    setSede('');
    setProceso('');
    setEstado('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || tipoEquipo || sede || proceso || estado);

  const { data: response, isLoading } = useQuery({
    queryKey: ['tiEquipos', search, tipoEquipo, sede, proceso, estado, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/inventario-ti/equipos', {
        params: {
          search: search || undefined,
          tipo_equipo: tipoEquipo || undefined,
          sede: sede || undefined,
          proceso: proceso || undefined,
          estado: estado || undefined,
          page,
          limit: pageSize,
        },
      });
      return res.data;
    },
  });

  const equipos = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta || { total: equipos.length, page: 1, limit: 25, totalPages: 1 };

  const { data: tipos } = useQuery({
    queryKey: ['catalogosTipos'],
    queryFn: async () => (await api.get('/catalogos/tipos-equipo')).data,
  });

  const { data: sedes } = useQuery({
    queryKey: ['catalogosSedes'],
    queryFn: async () => (await api.get('/catalogos/sedes')).data,
  });

  const { data: procesos } = useQuery({
    queryKey: ['catalogosProcesos'],
    queryFn: async () => (await api.get('/catalogos/procesos')).data,
  });

  const { data: estados } = useQuery({
    queryKey: ['catalogosEstados'],
    queryFn: async () => (await api.get('/catalogos/estados')).data,
  });

  const renderCell = (val: any) => {
    if (val === undefined || val === null || val === '' || String(val).trim() === '') {
      return <span className="text-slate-600">N/A</span>;
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Monitor className="w-3.5 h-3.5" />
            <span>Inventario de Cómputo & Sedes</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Estaciones de Trabajo & Sedes TI
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Gestión de las 163 estaciones registradas en la planilla oficial de Pollo Fiesta S.A.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode('practica')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'practica'
                  ? 'bg-white text-black shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista resumida y práctica para gestión diaria"
            >
              <LayoutList className="w-4 h-4" />
              <span>Vista Práctica</span>
            </button>
            <button
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'excel'
                  ? 'bg-white text-black shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista completa con las 33 columnas exactas de Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Hoja Excel Completa (33 Cols)</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Activo TI</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-neutral-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por placa, serial, usuario, host o AnyDesk..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* Tipo Filter */}
          <select
            value={tipoEquipo}
            onChange={(e) => {
              setTipoEquipo(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="">Todos los Tipos</option>
            {tipos?.map((t: any) => (
              <option key={t.id || t.nombre} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </select>

          {/* Proceso / Área Filter */}
          <select
            value={proceso}
            onChange={(e) => {
              setProceso(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="">Todas las Áreas / Procesos</option>
            {procesos?.map((p: any) => (
              <option key={p.id || p.nombre} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </select>

          {/* Estado Filter */}
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="">Todos los Estados</option>
            {estados?.map((est: any) => (
              <option key={est.id || est.nombre} value={est.nombre}>
                {est.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Reset and Result stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Resultados: <strong className="text-white">{meta.total}</strong> estaciones</span>
            {hasActiveFilters && (
              <span className="text-neutral-300 font-semibold">• Filtros activos</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[70vh]">
          {viewMode === 'practica' ? (
            /* VISTA PRÁCTICA (Intuitiva, rápida y limpia) */
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 shadow-sm">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  <th className="py-3.5 px-4">Estación & Modelo</th>
                  <th className="py-3.5 px-4">Placas & Serial</th>
                  <th className="py-3.5 px-4">Hardware Rápido</th>
                  <th className="py-3.5 px-4">Usuario Asignado</th>
                  <th className="py-3.5 px-4">Área & Sede</th>
                  <th className="py-3.5 px-4">AnyDesk</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500 font-medium">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Cargando inventario...</span>
                      </div>
                    </td>
                  </tr>
                ) : equipos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500 font-medium">
                      No se encontraron activos con los filtros indicados.
                    </td>
                  </tr>
                ) : (
                  equipos.map((eq: any) => {
                    const isGood = eq.estado_equipo?.toLowerCase().includes('buen');
                    const hasAnydesk = eq.id_anydesk && eq.id_anydesk !== 'N/A';

                    return (
                      <tr
                        key={eq.id}
                        className="hover:bg-neutral-900/60 transition-colors cursor-pointer group"
                        onClick={() => setSelectedEquipoId(eq.id)}
                      >
                        {/* Hostname & Modelo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white group-hover:scale-105 transition-transform">
                              {eq.tipo_equipo?.toLowerCase().includes('portatil') ? (
                                <Laptop className="w-4 h-4" />
                              ) : (
                                <Monitor className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{eq.nombre_computo || 'Estación TI'}</span>
                                {eq.tipo_equipo && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-medium">
                                    {eq.tipo_equipo}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400 font-medium">
                                {eq.modelo_computo || 'Modelo N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Placas & Serial */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-500">Sistemas:</span>
                              <span className="font-bold text-white">{eq.placa_sistemas || 'N/A'}</span>
                            </div>
                            {eq.placa_inventario && eq.placa_inventario !== 'N/A' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-neutral-500">Inv:</span>
                                <span className="text-neutral-200 font-semibold">{eq.placa_inventario}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-neutral-500 truncate max-w-[130px]">
                              S/N: {eq.serial_computo || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* Hardware */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                                <Cpu className="w-3 h-3 text-neutral-400" />
                                <span>{eq.ram_capacidad || '8GB'} {eq.ram_tipo || ''}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                                <HardDrive className="w-3 h-3 text-neutral-400" />
                                <span>{eq.disco_tipo || 'SSD'} {eq.disco_capacidad || ''}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                              {eq.procesador || 'Intel / AMD'}
                            </div>
                          </div>
                        </td>

                        {/* Usuario Asignado */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{eq.usuario_asignado || 'Sin Asignar'}</span>
                          </div>
                        </td>

                        {/* Área & Sede */}
                        <td className="py-3 px-4 text-xs">
                          <div className="space-y-0.5">
                            <div className="text-neutral-200 font-bold truncate max-w-[150px]">
                              {eq.proceso_oficina || 'Área General'}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              <span>{eq.ubicacion_fisica || 'Sede Administrativa'}</span>
                            </div>
                          </div>
                        </td>

                        {/* AnyDesk */}
                        <td className="py-3 px-4 font-mono" onClick={(e) => e.stopPropagation()}>
                          {hasAnydesk ? (
                            <button
                              onClick={(e) => copyToClipboard(e, String(eq.id_anydesk))}
                              className="inline-flex items-center gap-1 text-xs text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2 py-1 rounded-lg transition-colors cursor-pointer font-bold"
                              title="Copiar ID de AnyDesk"
                            >
                              <span>{eq.id_anydesk}</span>
                              {copiedAnydesk === String(eq.id_anydesk) ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          ) : (
                            <span className="text-neutral-600 text-xs">N/A</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">
                          <Badge variant={isGood ? 'success' : 'warning'}>
                            {eq.estado_equipo || 'Buen estado'}
                          </Badge>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedEquipoId(eq.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                              title="Ver Ficha 360°"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ficha</span>
                            </button>
                            <button
                              onClick={() => setEditingEquipo(eq)}
                              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                              title="Editar todas las columnas"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingEquipo(eq)}
                              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                              title="Eliminar activo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* VISTA EXCEL COMPLETA (33 Columnas Oficiales) */
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 shadow-sm">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 divide-x divide-neutral-800">
                  <th className="py-3 px-3.5 bg-neutral-900 sticky left-0 z-30 shadow-md">Id</th>
                  <th className="py-3 px-3.5 bg-neutral-900 sticky left-14 z-30 shadow-md">NOMBRE DE COMPUTO</th>
                  <th className="py-3 px-3.5">Tipo de equipo</th>
                  <th className="py-3 px-3.5">TELEVISOR</th>
                  <th className="py-3 px-3.5">IMPRESORA (PLACA)</th>
                  <th className="py-3 px-3.5">CAMARAS (PDV)</th>
                  <th className="py-3 px-3.5">CAJON MONEDERO (PDV)</th>
                  <th className="py-3 px-3.5">BASCULA (PDV)</th>
                  <th className="py-3 px-3.5">DVR</th>
                  <th className="py-3 px-3.5">Placa (Monitor)</th>
                  <th className="py-3 px-3.5">Marca (Monitor)</th>
                  <th className="py-3 px-3.5">Serial (Monitor)</th>
                  <th className="py-3 px-3.5">MODEM</th>
                  <th className="py-3 px-3.5">MODELO (COMPUTO)</th>
                  <th className="py-3 px-3.5 text-neutral-300">PLACA SISTEMAS (COMPUTO)</th>
                  <th className="py-3 px-3.5 text-neutral-300">PLACA INVENTARIO (COMPUTO)</th>
                  <th className="py-3 px-3.5">SERIAL (COMPUTO)</th>
                  <th className="py-3 px-3.5">Procesador</th>
                  <th className="py-3 px-3.5">TIPO (RAM)</th>
                  <th className="py-3 px-3.5">CAPACIDAD (RAM)</th>
                  <th className="py-3 px-3.5">Tipo de disco</th>
                  <th className="py-3 px-3.5">CAPACIDAD (DISCO)</th>
                  <th className="py-3 px-3.5 text-neutral-300">ID ANYDESK</th>
                  <th className="py-3 px-3.5">Sistema Operativo</th>
                  <th className="py-3 px-3.5">Software Base</th>
                  <th className="py-3 px-3.5 text-white">Usuario Asignado</th>
                  <th className="py-3 px-3.5">PROCESO O OFICINA</th>
                  <th className="py-3 px-3.5">Ubicacion Fisica</th>
                  <th className="py-3 px-3.5">TECLADO (PLACA)</th>
                  <th className="py-3 px-3.5">MOUSE (PLACA)</th>
                  <th className="py-3 px-3.5">Accesorios</th>
                  <th className="py-3 px-3.5">Estado de Equipo (Computo)</th>
                  <th className="py-3 px-3.5">Foto de equipo (Computo)</th>
                  <th className="py-3 px-3.5 sticky right-0 z-30 bg-neutral-900 text-center shadow-md">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                {equipos.map((eq: any) => {
                  const isGood = eq.estado_equipo?.toLowerCase().includes('buen');
                  const hasPhoto = eq.foto_url && eq.foto_url.trim() !== '' && eq.foto_url !== 'N/A';

                  return (
                    <tr
                      key={eq.id}
                      className="hover:bg-neutral-900/60 transition-colors divide-x divide-neutral-800 cursor-pointer group"
                      onClick={() => setSelectedEquipoId(eq.id)}
                    >
                      <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-mono text-neutral-400 font-bold shadow-md">
                        {eq.excel_id || eq.id}
                      </td>
                      <td className="py-2.5 px-3.5 sticky left-14 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-bold text-white shadow-md">
                        <span className="text-white">{eq.nombre_computo || 'N/A'}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.tipo_equipo)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.televisor)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.impresora_placa)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.camaras)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.cajon_monedero)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.bascula)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.dvr)}</td>
                      <td className="py-2.5 px-3.5 font-mono text-neutral-300">{renderCell(eq.monitor_placa)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.monitor_marca)}</td>
                      <td className="py-2.5 px-3.5 font-mono text-neutral-400">{renderCell(eq.monitor_serial)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(eq.modem)}</td>
                      <td className="py-2.5 px-3.5 font-medium text-neutral-200">{renderCell(eq.modelo_computo)}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-300">{renderCell(eq.placa_sistemas)}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-300">{renderCell(eq.placa_inventario)}</td>
                      <td className="py-2.5 px-3.5 font-mono text-neutral-300">{renderCell(eq.serial_computo)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.procesador)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.ram_tipo)}</td>
                      <td className="py-2.5 px-3.5 font-bold text-neutral-300">{renderCell(eq.ram_capacidad)}</td>
                      <td className="py-2.5 px-3.5">{renderCell(eq.disco_tipo)}</td>
                      <td className="py-2.5 px-3.5 font-bold text-neutral-300">{renderCell(eq.disco_capacidad)}</td>
                      <td className="py-2.5 px-3.5 font-mono text-white font-bold" onClick={(e) => e.stopPropagation()}>
                        {eq.id_anydesk && eq.id_anydesk !== 'N/A' ? (
                          <button
                            onClick={(e) => copyToClipboard(e, String(eq.id_anydesk))}
                            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded"
                            title="Copiar ID"
                          >
                            <span>{eq.id_anydesk}</span>
                            {copiedAnydesk === String(eq.id_anydesk) ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        ) : renderCell(null)}
                      </td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.sistema_operativo)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400 max-w-[200px] truncate" title={eq.software_base}>
                        {renderCell(eq.software_base)}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-white">{renderCell(eq.usuario_asignado)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300 font-medium">{renderCell(eq.proceso_oficina)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300 font-medium">{renderCell(eq.ubicacion_fisica)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.teclado_placa)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(eq.mouse_placa)}</td>
                      <td className="py-2.5 px-3.5 text-neutral-400 max-w-[150px] truncate" title={eq.accesorios}>
                        {renderCell(eq.accesorios)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge variant={isGood ? 'success' : 'warning'}>
                          {eq.estado_equipo || 'Buen estado'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                        {hasPhoto ? (
                          <a
                            href={eq.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-neutral-200 hover:text-white font-bold bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded transition-colors"
                          >
                            <span>Ver Foto</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-neutral-600">Sin foto</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 sticky right-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 text-center shadow-md" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedEquipoId(eq.id)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            title="Ver Ficha 360°"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ficha</span>
                          </button>
                          <button
                            onClick={() => setEditingEquipo(eq)}
                            className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                            title="Editar todas las columnas"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingEquipo(eq)}
                            className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <div>
              Mostrando <span className="font-bold text-white">{equipos.length}</span> de <span className="font-bold text-white">{meta.total}</span> estaciones (Página <span className="font-bold text-white">{meta.page}</span> de <span className="font-bold text-white">{meta.totalPages}</span>)
            </div>
            <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-800">
              <span>Filas:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>Todos (163)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <span className="px-2 font-mono text-neutral-300">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hoja de Vida 360 Modal */}
      {selectedEquipoId && (
        <HojaDeVidaModal
          equipoId={selectedEquipoId}
          onClose={() => setSelectedEquipoId(null)}
        />
      )}

      {/* Crear Nuevo Equipo Modal */}
      {isCreateModalOpen && (
        <EquipoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          equipo={null}
        />
      )}

      {/* Editar Equipo Modal */}
      {editingEquipo && (
        <EquipoModal
          isOpen={Boolean(editingEquipo)}
          onClose={() => setEditingEquipo(null)}
          equipo={editingEquipo}
        />
      )}

      {/* Confirmar Eliminación */}
      {deletingEquipo && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingEquipo)}
          onClose={() => setDeletingEquipo(null)}
          onConfirm={() => deleteMutation.mutate(deletingEquipo.id)}
          title="Eliminar Activo TI"
          description="¿Estás seguro de que deseas eliminar este equipo del inventario de Sedes TI? Se eliminarán también sus notas y registros de bitácora asociados."
          itemName={`${deletingEquipo.nombre_computo || 'Estación TI'} (${deletingEquipo.placa_sistemas || deletingEquipo.serial_computo || 'ID: ' + deletingEquipo.id})`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
