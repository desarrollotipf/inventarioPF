import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  ArrowLeft,
  Video,
  Monitor,
  HardDrive,
  Printer,
  Scale,
  DollarSign,
  Wifi,
  Tv,
  Zap,
  Plus,
  ShieldCheck,
  Radio,
  FileText,
  Send,
  Copy,
  Check,
  Cpu,
  Edit,
  Save,
  X,
  Layers,
  Wrench,
  Activity,
  Trash2,
  Keyboard,
  Mouse,
  User,
  MapPin,
  Tag,
  LayoutGrid,
  List,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { PdvModal } from './PdvModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { MantenimientoModal } from '../Mantenimiento/MantenimientoModal';

// Helper para extraer marca/modelo y placa de inventario en periféricos (ej. "HP-1105" => modelo: "HP", placa: "1105")
const parseDevicePlate = (val?: string | null) => {
  if (!val || val === 'N/A' || val.trim() === '' || val.toLowerCase() === 'null') {
    return { modelo: '', placa: '', hasDevice: false };
  }
  const clean = val.trim();
  const match = clean.match(/^(.+?)\s*[-–—]\s*([0-9A-Za-z]{3,})$/);
  if (match) {
    return {
      modelo: match[1].trim(),
      placa: match[2].trim(),
      hasDevice: true,
    };
  }
  return { modelo: clean, placa: '', hasDevice: true };
};

export const PdvDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'info' | 'perifericos' | 'mantenimientos' | 'notas'>('info');
  const [perifericosView, setPerifericosView] = useState<'cards' | 'table'>('cards');
  const [nuevaNota, setNuevaNota] = useState('');
  const [copiedAnydesk, setCopiedAnydesk] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState<any | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/pdv/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdvsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      navigate('/pdv');
    },
  });

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['pdvDetail', id],
    queryFn: async () => {
      const res = await api.get(`/pdv/${id}`);
      return res.data;
    },
  });

  const pdv = rawData?.pdv || {};
  const notas: any[] = Array.isArray(rawData?.notas) ? rawData.notas : [];
  const mantenimientos: any[] = Array.isArray(rawData?.mantenimientos) ? rawData.mantenimientos : [];

  const addNotaMutation = useMutation({
    mutationFn: async (nota: string) => {
      await api.post(`/pdv/${id}/notas`, {
        nota,
        autor: 'Técnico Soporte TI',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdvDetail', id] });
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-neutral-800 rounded-2xl w-1/3" />
        <div className="h-64 bg-neutral-900 rounded-3xl" />
      </div>
    );
  }

  const tecladoParsed = parseDevicePlate(pdv.teclado);
  const mouseParsed = parseDevicePlate(pdv.mouse);
  const impresoraParsed = parseDevicePlate(pdv.impresora);
  const monitorParsed = parseDevicePlate(pdv.monitor);

  // Lista de periféricos y dotación tecnológica real (solo lo que tiene el PDV)
  const allPossibleEquipment = [
    {
      id: 'pc',
      categoria: 'Cómputo POS',
      dispositivo: 'Computador Principal de Caja',
      modelo: pdv.pc_modelo || 'Terminal POS',
      placa: pdv.pc_placa && pdv.pc_placa !== 'N/A' ? pdv.pc_placa : '',
      detalle: `${pdv.procesador || 'Procesador POS'} • RAM: ${pdv.ram || '4 GB'} • ${pdv.disco || 'SSD'}`,
      anydesk: pdv.anydesk && pdv.anydesk !== 'N/A' ? pdv.anydesk : '',
      estado: 'Operativo',
      icon: Monitor,
      hasDevice: true,
    },
    {
      id: 'monitor',
      categoria: 'Pantalla',
      dispositivo: 'Monitor de Facturación',
      modelo: monitorParsed.hasDevice
        ? monitorParsed.modelo
        : pdv.pc_modelo?.toUpperCase().includes('AIO')
        ? 'Display Integrado AIO'
        : 'Monitor POS',
      placa: monitorParsed.placa || (pdv.monitor_placa && pdv.monitor_placa !== 'N/A' ? pdv.monitor_placa : ''),
      detalle: 'Display Mostrador de Caja para visualización de ventas',
      anydesk: '',
      estado: 'Operativo',
      icon: Monitor,
      hasDevice: true,
    },
    {
      id: 'teclado',
      categoria: 'Periférico POS',
      dispositivo: 'Teclado USB de Facturación',
      modelo: tecladoParsed.modelo || 'Teclado Estándar USB',
      placa: tecladoParsed.placa,
      detalle: 'Teclado alfanumérico para emisión y digitación de facturas',
      anydesk: '',
      estado: 'Operativo',
      icon: Keyboard,
      hasDevice: tecladoParsed.hasDevice,
    },
    {
      id: 'mouse',
      categoria: 'Periférico POS',
      dispositivo: 'Mouse Óptico de Caja',
      modelo: mouseParsed.modelo || 'Mouse Óptico USB',
      placa: mouseParsed.placa,
      detalle: 'Mouse óptico USB para punto de venta',
      anydesk: '',
      estado: 'Operativo',
      icon: Mouse,
      hasDevice: mouseParsed.hasDevice,
    },
    {
      id: 'impresora',
      categoria: 'Impresión POS',
      dispositivo: 'Impresora Térmica de Recibos',
      modelo: impresoraParsed.modelo || 'Impresora Térmica POS',
      placa: impresoraParsed.placa || (pdv.impresora_placa && pdv.impresora_placa !== 'N/A' ? pdv.impresora_placa : ''),
      detalle: 'Emisión de facturas electrónicas y vales de caja POS',
      anydesk: '',
      estado: 'Operativo',
      icon: Printer,
      hasDevice: impresoraParsed.hasDevice,
    },
    {
      id: 'bascula',
      categoria: 'Pesaje Comercial',
      dispositivo: 'Báscula Electrónica de Peso',
      modelo: pdv.bascula_peso,
      placa: pdv.bascula_placa && pdv.bascula_placa !== 'N/A' ? pdv.bascula_placa : '',
      detalle: 'Puerto Serial / Comunicación a Caja para pesaje en mostrador',
      anydesk: '',
      estado: 'Operativo',
      icon: Scale,
      hasDevice: pdv.bascula_peso && pdv.bascula_peso !== 'N/A' && pdv.bascula_peso.trim() !== '',
    },
    {
      id: 'cajon',
      categoria: 'Custodia Efectivo',
      dispositivo: 'Cajón Monedero',
      modelo: pdv.cajon_monedero,
      placa: '',
      detalle: 'Gaveta de Efectivo con apertura automática RJ11',
      anydesk: '',
      estado: 'Operativo',
      icon: DollarSign,
      hasDevice: pdv.cajon_monedero && pdv.cajon_monedero !== 'N/A' && pdv.cajon_monedero.trim() !== '',
    },
    {
      id: 'dvr',
      categoria: 'Seguridad CCTV',
      dispositivo: 'Grabador Digital de Video (DVR)',
      modelo: pdv.dvr,
      placa: pdv.dvr_placa && pdv.dvr_placa !== 'N/A' ? pdv.dvr_placa : '',
      detalle: `${pdv.camaras || 4} Cámaras HD instaladas para videovigilancia`,
      anydesk: '',
      estado: 'Operativo',
      icon: Video,
      hasDevice: pdv.dvr && pdv.dvr !== 'N/A' && pdv.dvr.trim() !== '',
    },
    {
      id: 'modem',
      categoria: 'Comunicaciones',
      dispositivo: 'Módem / Router de Conectividad',
      modelo: pdv.modem,
      placa: '',
      detalle: 'Conexión WAN para enlace a Servidores Centrales',
      anydesk: '',
      estado: 'Operativo',
      icon: Wifi,
      hasDevice: pdv.modem && pdv.modem !== 'N/A' && pdv.modem.trim() !== '',
    },
    {
      id: 'televisor',
      categoria: 'Multimedia',
      dispositivo: 'Pantalla / Televisor Menú Board',
      modelo: pdv.televisor,
      placa: '',
      detalle: 'Pantalla de Turnos y Menú Dinámico',
      anydesk: '',
      estado: 'Operativo',
      icon: Tv,
      hasDevice: pdv.televisor && pdv.televisor !== 'N/A' && pdv.televisor.trim() !== '',
    },
    {
      id: 'ups',
      categoria: 'Energía',
      dispositivo: 'Sistema de Respaldo UPS',
      modelo: pdv.ups,
      placa: '',
      detalle: 'Regulación de voltaje y batería de soporte ante cortes eléctricos',
      anydesk: '',
      estado: 'Operativo',
      icon: Zap,
      hasDevice: pdv.ups && pdv.ups !== 'N/A' && pdv.ups.trim() !== '',
    },
  ];

  // Filtramos estrictamente: "si no tiene, no lo pongas"
  const activeEquipment = allPossibleEquipment.filter((item) => item.hasDevice);

  // Periféricos específicos para la pestaña de Periféricos (excluyendo el PC central de caja)
  const perifericosPdv = activeEquipment.filter((item) => item.id !== 'pc');

  return (
    <div className="space-y-6">
      {/* Botón de regreso */}
      <div>
        <button
          onClick={() => navigate('/pdv')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Lista de Puntos de Venta</span>
        </button>
      </div>

      {/* FICHA PRINCIPAL DEL PDV (Diseño idéntico a Sedes) */}
      <div className="glass-card rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header con Icono, Nombre, Subtítulo y Acciones */}
        <div className="p-6 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold text-2xl shadow-xl shrink-0">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {pdv.pdv_nombre}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-semibold border border-neutral-700">
                  Punto de Venta POS
                </span>
                <Badge variant={pdv.estado === 'ACTIVO' ? 'success' : 'default'}>
                  {pdv.estado || 'Activo'}
                </Badge>
              </div>

              {/* Subtítulo dinámico: solo muestra lo que realmente existe */}
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-400 font-semibold mt-1">
                {pdv.numero && (
                  <span>Código: <strong className="text-neutral-200">#{pdv.numero}</strong></span>
                )}
                {pdv.pc_modelo && pdv.pc_modelo !== 'N/A' && (
                  <span>• Modelo: <strong className="text-neutral-200 font-medium">{pdv.pc_modelo}</strong></span>
                )}
                {pdv.pc_placa && pdv.pc_placa !== 'N/A' && (
                  <span>• Placa PC: <strong className="font-mono text-white font-bold">{pdv.pc_placa}</strong></span>
                )}
                {pdv.anydesk && pdv.anydesk !== 'N/A' && (
                  <span>• AnyDesk: <strong className="font-mono text-neutral-200">{pdv.anydesk}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Equipamiento</span>
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
              title="Eliminar punto de venta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Navegación por Pestañas (Igual que Sedes) */}
        <div className="px-6 border-b border-neutral-800 bg-neutral-950 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'info', label: 'Hardware & Software', icon: Cpu },
            { id: 'perifericos', label: `Periféricos & Conexiones (${activeEquipment.length})`, icon: Monitor },
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

        {/* Cuerpo de Contenido */}
        <div className="p-6 space-y-6">
          {/* TAB 1: HARDWARE & SOFTWARE */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Barra de 3 Columnas: Responsable, Ubicación, AnyDesk */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>Responsable / Operación</span>
                  </p>
                  <p className="text-sm font-bold text-white">Cajero(a) / Administrador</p>
                  <p className="text-xs text-neutral-400 font-medium">Facturación Comercial POS</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span>Ubicación / Ciudad</span>
                  </p>
                  <p className="text-sm font-bold text-white">{pdv.pdv_nombre}</p>
                  <p className="text-xs text-neutral-400">{pdv.ciudad || 'Colombia'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-white" />
                    <span>AnyDesk ID Remoto</span>
                  </p>
                  {pdv.anydesk && pdv.anydesk !== 'N/A' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black font-mono text-white">
                        {pdv.anydesk}
                      </span>
                      <button
                        onClick={() => copyAnydesk(String(pdv.anydesk))}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedAnydesk ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAnydesk ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-neutral-500">-</p>
                  )}
                  <p className="text-[11px] text-neutral-400">Acceso a soporte técnico remoto</p>
                </div>
              </div>

              {/* Tarjetas de Especificaciones de Hardware del PC */}
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                  Especificaciones del Computador Principal de Caja
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <p className="text-[10px] text-neutral-400 uppercase">Procesador</p>
                    <p className="text-xs font-bold text-neutral-200">{pdv.procesador || 'Intel / AMD Cómputo POS'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <p className="text-[10px] text-neutral-400 uppercase">Memoria RAM</p>
                    <p className="text-xs font-bold text-white">{pdv.ram || '4 GB RAM'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <p className="text-[10px] text-neutral-400 uppercase">Disco Duro</p>
                    <p className="text-xs font-bold text-white">{pdv.disco || 'SSD Almacenamiento'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <p className="text-[10px] text-neutral-400 uppercase">Terminal POS</p>
                    <p className="text-xs font-bold text-white truncate">{pdv.pc_modelo || 'All In One POS'}</p>
                  </div>
                </div>
              </div>

              {/* Software Base y Conectividad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Software Base & Facturación</p>
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                    Sistema Operativo Windows POS • Software de Facturación Comercial y Tirillas • AnyDesk Soporte TI • Drivers SAT / Epson.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Circuito de Seguridad y Red</p>
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                    {pdv.dvr ? `Grabador Digital DVR (${pdv.camaras || 4} cámaras) • ` : ''}
                    {pdv.modem ? `Módem WAN: ${pdv.modem} • ` : ''}
                    {pdv.ups ? `Sistema de Respaldo UPS: ${pdv.ups}` : 'Conexión eléctrica directa'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERIFÉRICOS & CONEXIONES */}
          {activeTab === 'perifericos' && (
            <div className="space-y-4">
              {/* Barra superior con selector de vista (Tarjetas vs Tabla) */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs text-neutral-400 font-semibold">
                  Dotación tecnológica activa: {activeEquipment.length} dispositivos en servicio
                </span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => setPerifericosView('cards')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      perifericosView === 'cards'
                        ? 'bg-neutral-800 text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                  <button
                    onClick={() => setPerifericosView('table')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      perifericosView === 'table'
                        ? 'bg-neutral-800 text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabla</span>
                  </button>
                </div>
              </div>

              {/* VISTA 1: TARJETAS (Idéntica a Sedes) */}
              {perifericosView === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeEquipment.map((p) => {
                    const DeviceIcon = p.icon;
                    const hasPlaca = p.placa && p.placa !== 'N/A' && p.placa.trim() !== '';
                    const hasModelo = p.modelo && p.modelo !== 'N/A' && p.modelo.trim() !== '';

                    return (
                      <div key={p.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5 hover:border-neutral-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0 border border-neutral-700">
                              <DeviceIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span>{p.dispositivo}</span>
                          </span>
                          <Badge variant="info">{p.categoria}</Badge>
                        </div>

                        {hasModelo && (
                          <p className="text-xs text-neutral-200 font-semibold">{p.modelo}</p>
                        )}
                        <p className="text-[11px] text-neutral-400">{p.detalle}</p>

                        {/* Barra inferior: si no tiene placa no la pone */}
                        {hasPlaca && (
                          <div className="text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-800 flex justify-between items-center">
                            <span>Placa Inventario:</span>
                            <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-white font-bold">
                              {p.placa}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* VISTA 2: TABLA EMPRESARIAL */
                <div className="overflow-x-auto rounded-2xl border border-neutral-800">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead className="bg-neutral-900 border-b border-neutral-800 shadow-sm">
                      <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 divide-x divide-neutral-800">
                        <th className="py-3 px-4">Componente / Periférico</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4">Marca & Modelo</th>
                        <th className="py-3 px-4">Placa de Inventario</th>
                        <th className="py-3 px-4">Especificación / Detalle</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 bg-neutral-950 font-medium">
                      {activeEquipment.map((item) => {
                        const Icon = item.icon;
                        return (
                          <tr key={item.id} className="hover:bg-neutral-900/60 transition-colors divide-x divide-neutral-800">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-white">{item.dispositivo}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold uppercase">
                                {item.categoria}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-neutral-200 font-medium">
                              {item.modelo || '-'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-white">
                              {item.placa ? (
                                <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                                  {item.placa}
                                </span>
                              ) : (
                                <span className="text-neutral-600 font-normal">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                              {item.detalle}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="success">Operativo</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANTENIMIENTOS */}
          {activeTab === 'mantenimientos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                <span className="text-xs text-neutral-400 font-medium">
                  Historial y programación de intervenciones técnicas del PDV
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMantenimiento(null);
                    setIsMantenimientoModalOpen(true);
                  }}
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
                        <Badge variant={m.estado === 'FINALIZADO' ? 'success' : m.estado === 'EN_PROCESO' ? 'info' : 'warning'}>
                          {m.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-300">{m.descripcion}</p>
                      <p className="text-[10px] text-neutral-500">Técnico: {m.tecnico_responsable || 'Soporte TI'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-400">
                        {m.fecha_programada ? new Date(m.fecha_programada).toLocaleDateString() : 'Por agendar'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingMantenimiento(m);
                          setIsMantenimientoModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                        title="Editar mantenimiento"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {mantenimientos.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-xs font-medium">
                    No registra intervenciones técnicas ni mantenimientos pendientes para este Punto de Venta.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BITÁCORA DE SOPORTE */}
          {activeTab === 'notas' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNota} className="flex gap-2">
                <input
                  type="text"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Escribir novedad técnica, mantenimiento o cambio de periférico..."
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
                    Aún no se han agregado notas a la bitácora de este Punto de Venta.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {isEditModalOpen && (
        <PdvModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          pdv={pdv}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pdvDetail', id] });
          }}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
          title="Eliminar Punto de Venta"
          description="¿Estás seguro de que deseas eliminar permanentemente este Punto de Venta? Se eliminarán también todas sus notas de bitácora y registros asociados."
          itemName={`${pdv.pdv_nombre} (PDV N° ${pdv.numero || pdv.id})`}
          isLoading={deleteMutation.isPending}
        />
      )}

      {isMantenimientoModalOpen && (
        <MantenimientoModal
          isOpen={isMantenimientoModalOpen}
          onClose={() => {
            setIsMantenimientoModalOpen(false);
            setEditingMantenimiento(null);
          }}
          mantenimiento={editingMantenimiento}
          initialEquipo={{
            origen: 'PDV',
            id: Number(id),
            nombre: pdv.pdv_nombre || `PDV N° ${pdv.numero || id}`,
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pdvDetail', id] });
            queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
          }}
        />
      )}
    </div>
  );
};

export default PdvDetail;
