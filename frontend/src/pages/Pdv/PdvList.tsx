import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store,
  Search,
  Video,
  Monitor,
  HardDrive,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  Check,
  Scale,
  CircleDollarSign,
  Radio,
  Tv,
  Zap,
  Eye,
  FileSpreadsheet,
  Building2,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  Keyboard,
  Mouse,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { PdvModal } from './PdvModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export const PdvList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) {
      setSearchTerm(s);
    }
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterType, setFilterType] = useState<'all' | 'cctv' | 'anydesk' | 'bascula'>('all');
  const [copiedAnydesk, setCopiedAnydesk] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPdv, setEditingPdv] = useState<any | null>(null);
  const [deletingPdv, setDeletingPdv] = useState<any | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/pdv/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdvsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setDeletingPdv(null);
    },
  });

  const { data: pdvs, isLoading } = useQuery({
    queryKey: ['pdvsList', searchTerm],
    queryFn: async () => {
      const res = await api.get('/pdv', {
        params: { search: searchTerm || undefined },
      });
      return res.data;
    },
  });

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedAnydesk(text);
    setTimeout(() => setCopiedAnydesk(null), 2000);
  };

  const rawList: any[] = Array.isArray(pdvs) ? pdvs : [];

  const filteredPdvs = rawList.filter((pdv: any) => {
    if (filterType === 'cctv') return pdv.dvr && pdv.dvr !== 'N/A';
    if (filterType === 'anydesk') return pdv.anydesk && pdv.anydesk !== 'N/A';
    if (filterType === 'bascula') return pdv.bascula_peso && pdv.bascula_peso !== 'N/A';
    return true;
  });

  const renderCell = (val: any) => {
    if (val === undefined || val === null || val === '' || String(val).trim() === '') {
      return <span className="text-neutral-600 font-mono">N/A</span>;
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>Red Nacional de Puntos de Venta</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Puntos de Venta (PDVs) & Tiendas
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-1">
            Supervisión del computador POS, periféricos de facturación, básculas comerciales y CCTV en las 22 tiendas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-black shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista de Tarjetas por Tienda"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Vista Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-black shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista de Tabla (19 Columnas Excel)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Hoja Excel (19 Cols)</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo PDV</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Chips Bar */}
      <div className="glass-card p-4 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por PDV, modelo PC, placa o ciudad..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              filterType === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Todos ({rawList.length})
          </button>
          <button
            onClick={() => setFilterType('cctv')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'cctv'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Con CCTV (19)</span>
          </button>
          <button
            onClick={() => setFilterType('anydesk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'anydesk'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Con AnyDesk (18)</span>
          </button>
          <button
            onClick={() => setFilterType('bascula')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
              filterType === 'bascula'
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Con Báscula (15)</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl h-52 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredPdvs.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-3xl border border-slate-800 font-medium">
          No se encontraron puntos de venta con el filtro seleccionado.
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA TARJETAS (Amigable, práctica y visual) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPdvs.map((pdv: any) => {
            const hasImpresora = pdv.impresora && pdv.impresora !== 'N/A';
            const hasCajon = pdv.cajon_monedero && pdv.cajon_monedero !== 'N/A';
            const hasBascula = pdv.bascula_peso && pdv.bascula_peso !== 'N/A';
            const hasDvr = pdv.dvr && pdv.dvr !== 'N/A';
            const hasAnydesk = pdv.anydesk && pdv.anydesk !== 'N/A';
            const hasTeclado = pdv.teclado && pdv.teclado !== 'N/A';
            const hasMouse = pdv.mouse && pdv.mouse !== 'N/A';

            return (
              <div
                key={pdv.id}
                onClick={() => navigate(`/pdv/${pdv.id}`)}
                className="glass-card p-5 rounded-3xl border border-neutral-800 hover:border-neutral-500 transition-all duration-200 group cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 shadow-lg"
              >
                <div className="space-y-3.5">
                  {/* Header de Tienda */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold text-lg">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-neutral-300 transition-colors">
                          {pdv.pdv_nombre}
                        </h3>
                        <p className="text-[11px] text-neutral-400 font-semibold">
                          PDV N° {pdv.numero} • {pdv.ciudad || 'Bogotá'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">ONLINE</Badge>
                  </div>

                  {/* Computador de Caja */}
                  <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-neutral-200 truncate max-w-[180px]">
                        <Monitor className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{pdv.pc_modelo || 'PC POS'}</span>
                      </div>
                      <span className="font-mono text-[10px] text-white bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded font-bold">
                        Placa: {pdv.pc_placa || 'N/A'}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-2 pt-0.5">
                      <span>{pdv.procesador || 'Intel / AMD'}</span>
                      <span>•</span>
                      <span>RAM: {pdv.ram || '4 GB'}</span>
                      <span>•</span>
                      <span>{pdv.disco || 'SSD'}</span>
                    </div>
                  </div>

                  {/* Checklist Dotación */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasTeclado ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <Keyboard className={`w-3.5 h-3.5 shrink-0 ${hasTeclado ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasTeclado ? pdv.teclado : 'Sin Teclado'}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasMouse ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <Mouse className={`w-3.5 h-3.5 shrink-0 ${hasMouse ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasMouse ? pdv.mouse : 'Sin Mouse'}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasImpresora ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <Printer className={`w-3.5 h-3.5 shrink-0 ${hasImpresora ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasImpresora ? pdv.impresora : 'Sin Impresora'}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasBascula ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <Scale className={`w-3.5 h-3.5 shrink-0 ${hasBascula ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasBascula ? pdv.bascula_peso : 'Sin Báscula'}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasCajon ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <CircleDollarSign className={`w-3.5 h-3.5 shrink-0 ${hasCajon ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasCajon ? pdv.cajon_monedero : 'Sin Cajón'}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                      hasDvr ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                    }`}>
                      <Video className={`w-3.5 h-3.5 shrink-0 ${hasDvr ? 'text-white' : 'text-neutral-600'}`} />
                      <span className="truncate">{hasDvr ? `${pdv.camaras || 3} Cámaras` : 'Sin CCTV'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: AnyDesk y Acciones */}
                <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                  {hasAnydesk ? (
                    <button
                      onClick={(e) => copyToClipboard(e, String(pdv.anydesk))}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2 py-1 rounded-lg transition-colors cursor-pointer font-bold"
                      title="Copiar ID de AnyDesk"
                    >
                      <Radio className="w-3 h-3 text-neutral-300" />
                      <span>{pdv.anydesk}</span>
                      {copiedAnydesk === String(pdv.anydesk) ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-60" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-neutral-500 font-mono">Sin AnyDesk</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingPdv(pdv)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                      title="Editar Tienda"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingPdv(pdv)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                      title="Eliminar Tienda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/pdv/${pdv.id}`)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Ficha</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA (19 Columnas exactas de Excel) */
        <div className="glass-card rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 shadow-sm">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 divide-x divide-neutral-800">
                  <th className="py-3 px-3.5 bg-neutral-900 sticky left-0 z-30 shadow-md">NUMERO</th>
                  <th className="py-3 px-3.5 bg-neutral-900 sticky left-16 z-30 text-white shadow-md">PDV</th>
                  <th className="py-3 px-3.5">PC</th>
                  <th className="py-3 px-3.5">MONITOR</th>
                  <th className="py-3 px-3.5">PROCESADOR</th>
                  <th className="py-3 px-3.5">RAM</th>
                  <th className="py-3 px-3.5">DISCO</th>
                  <th className="py-3 px-3.5 text-neutral-300">PLACA</th>
                  <th className="py-3 px-3.5">TECLADO</th>
                  <th className="py-3 px-3.5">MOUSE</th>
                  <th className="py-3 px-3.5">IMPRESORA</th>
                  <th className="py-3 px-3.5">DVR</th>
                  <th className="py-3 px-3.5">CAMARAS</th>
                  <th className="py-3 px-3.5">CAJON MONEDERO</th>
                  <th className="py-3 px-3.5">MODEM</th>
                  <th className="py-3 px-3.5">TELEVISOR</th>
                  <th className="py-3 px-3.5">BASCULA DE PESO</th>
                  <th className="py-3 px-3.5">UPS</th>
                  <th className="py-3 px-3.5 text-neutral-300">ANYDESK</th>
                  <th className="py-3 px-3.5 sticky right-0 z-30 bg-neutral-900 text-center shadow-md">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                {filteredPdvs.map((pdv: any) => (
                  <tr
                    key={pdv.id}
                    onClick={() => navigate(`/pdv/${pdv.id}`)}
                    className="hover:bg-neutral-900/70 transition-colors divide-x divide-neutral-800 cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-mono text-neutral-400 font-bold shadow-md">
                      {pdv.numero || pdv.id}
                    </td>
                    <td className="py-2.5 px-3.5 sticky left-16 z-10 bg-neutral-950 group-hover:bg-neutral-900 font-bold text-white shadow-md">
                      {pdv.pdv_nombre}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-neutral-200">{renderCell(pdv.pc_modelo)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.monitor)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.procesador)}</td>
                    <td className="py-2.5 px-3.5 font-bold text-neutral-300">{renderCell(pdv.ram)}</td>
                    <td className="py-2.5 px-3.5 font-bold text-neutral-300">{renderCell(pdv.disco)}</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-neutral-300">{renderCell(pdv.pc_placa)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.teclado)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.mouse)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-200">{renderCell(pdv.impresora)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300 max-w-[200px] truncate" title={pdv.dvr}>
                      {renderCell(pdv.dvr)}
                    </td>
                    <td className="py-2.5 px-3.5 text-neutral-300 font-bold">{renderCell(pdv.camaras)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.cajon_monedero)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.modem)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-300">{renderCell(pdv.televisor)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-200 font-medium">{renderCell(pdv.bascula_peso)}</td>
                    <td className="py-2.5 px-3.5 text-neutral-400">{renderCell(pdv.ups)}</td>
                    <td className="py-2.5 px-3.5 font-mono text-white font-bold" onClick={(e) => e.stopPropagation()}>
                      {pdv.anydesk && pdv.anydesk !== 'N/A' ? (
                        <button
                          onClick={(e) => copyToClipboard(e, String(pdv.anydesk))}
                          className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded"
                          title="Copiar ID"
                        >
                          <span>{pdv.anydesk}</span>
                          {copiedAnydesk === String(pdv.anydesk) ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      ) : (
                        renderCell(null)
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 sticky right-0 z-10 bg-neutral-950 group-hover:bg-neutral-900 text-center shadow-md" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/pdv/${pdv.id}`)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                          title="Ver Ficha Completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha</span>
                        </button>
                        <button
                          onClick={() => setEditingPdv(pdv)}
                          className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                          title="Editar Dotación"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPdv(pdv)}
                          className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 text-xs transition-colors cursor-pointer"
                          title="Eliminar PDV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crear Nuevo PDV Modal */}
      {isCreateModalOpen && (
        <PdvModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          pdv={null}
        />
      )}

      {/* Editar PDV Modal */}
      {editingPdv && (
        <PdvModal
          isOpen={Boolean(editingPdv)}
          onClose={() => setEditingPdv(null)}
          pdv={editingPdv}
        />
      )}

      {/* Confirmar Eliminación */}
      {deletingPdv && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingPdv)}
          onClose={() => setDeletingPdv(null)}
          onConfirm={() => deleteMutation.mutate(deletingPdv.id)}
          title="Eliminar Punto de Venta"
          description="¿Estás seguro de que deseas eliminar este Punto de Venta de la red de tiendas? Se eliminarán también todas sus notas de soporte y mantenimientos asociados."
          itemName={`${deletingPdv.pdv_nombre} (PDV N° ${deletingPdv.numero || deletingPdv.id})`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
