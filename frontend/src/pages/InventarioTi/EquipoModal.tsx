import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Save,
  Monitor,
  Cpu,
  Shield,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  User,
  MapPin,
  Tag,
  Radio,
  Tv,
} from 'lucide-react';
import { api } from '../../services/api';

interface EquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo?: any | null; // null for create mode, object for edit mode
  onSuccess?: () => void;
}

export const EquipoModal: React.FC<EquipoModalProps> = ({
  isOpen,
  onClose,
  equipo,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(equipo?.id);
  const [activeTab, setActiveTab] = useState<'identificacion' | 'placas' | 'hardware' | 'perifericos' | 'especiales'>('identificacion');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    nombre_computo: '',
    tipo_equipo: 'Computador AIO',
    modelo_computo: '',
    usuario_asignado: '',
    proceso_oficina: '',
    ubicacion_fisica: '',
    estado_equipo: 'Buen estado',
    foto_url: '',
    placa_sistemas: '',
    placa_inventario: '',
    serial_computo: '',
    id_anydesk: '',
    procesador: '',
    ram_tipo: 'DDR4',
    ram_capacidad: '8 GB',
    disco_tipo: 'SSD',
    disco_capacidad: '240 GB',
    sistema_operativo: 'Windows 10 Pro',
    software_base: 'Office 365, Chrome, AnyDesk',
    monitor_marca: '',
    monitor_placa: '',
    monitor_serial: '',
    teclado_placa: '',
    mouse_placa: '',
    impresora_placa: '',
    televisor: '',
    modem: '',
    dvr: '',
    camaras: '',
    cajon_monedero: '',
    bascula: '',
    accesorios: '',
  });

  useEffect(() => {
    if (equipo) {
      setFormData({
        nombre_computo: equipo.nombre_computo || '',
        tipo_equipo: equipo.tipo_equipo || 'Computador AIO',
        modelo_computo: equipo.modelo_computo || '',
        usuario_asignado: equipo.usuario_asignado || '',
        proceso_oficina: equipo.proceso_oficina || '',
        ubicacion_fisica: equipo.ubicacion_fisica || '',
        estado_equipo: equipo.estado_equipo || 'Buen estado',
        foto_url: equipo.foto_url || '',
        placa_sistemas: equipo.placa_sistemas || '',
        placa_inventario: equipo.placa_inventario || '',
        serial_computo: equipo.serial_computo || '',
        id_anydesk: equipo.id_anydesk || '',
        procesador: equipo.procesador || '',
        ram_tipo: equipo.ram_tipo || 'DDR4',
        ram_capacidad: equipo.ram_capacidad || '8 GB',
        disco_tipo: equipo.disco_tipo || 'SSD',
        disco_capacidad: equipo.disco_capacidad || '240 GB',
        sistema_operativo: equipo.sistema_operativo || 'Windows 10 Pro',
        software_base: equipo.software_base || 'Office 365, Chrome, AnyDesk',
        monitor_marca: equipo.monitor_marca || '',
        monitor_placa: equipo.monitor_placa || '',
        monitor_serial: equipo.monitor_serial || '',
        teclado_placa: equipo.teclado_placa || '',
        mouse_placa: equipo.mouse_placa || '',
        impresora_placa: equipo.impresora_placa || '',
        televisor: equipo.televisor || '',
        modem: equipo.modem || '',
        dvr: equipo.dvr || '',
        camaras: equipo.camaras || '',
        cajon_monedero: equipo.cajon_monedero || '',
        bascula: equipo.bascula || '',
        accesorios: equipo.accesorios || '',
      });
    } else {
      setFormData({
        nombre_computo: '',
        tipo_equipo: 'Computador AIO',
        modelo_computo: '',
        usuario_asignado: '',
        proceso_oficina: '',
        ubicacion_fisica: '',
        estado_equipo: 'Buen estado',
        foto_url: '',
        placa_sistemas: '',
        placa_inventario: '',
        serial_computo: '',
        id_anydesk: '',
        procesador: '',
        ram_tipo: 'DDR4',
        ram_capacidad: '8 GB',
        disco_tipo: 'SSD',
        disco_capacidad: '240 GB',
        sistema_operativo: 'Windows 10 Pro',
        software_base: 'Office 365, Chrome, AnyDesk',
        monitor_marca: '',
        monitor_placa: '',
        monitor_serial: '',
        teclado_placa: '',
        mouse_placa: '',
        impresora_placa: '',
        televisor: '',
        modem: '',
        dvr: '',
        camaras: '',
        cajon_monedero: '',
        bascula: '',
        accesorios: '',
      });
    }
    setErrorMsg(null);
  }, [equipo, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit) {
        return (await api.put(`/inventario-ti/equipos/${equipo.id}`, payload)).data;
      } else {
        return (await api.post('/inventario-ti/equipos', payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['hojaDeVida'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Error al guardar los datos del equipo');
    },
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_computo?.trim()) {
      setErrorMsg('El Nombre de Cómputo / Estación es obligatorio.');
      setActiveTab('identificacion');
      return;
    }
    setErrorMsg(null);
    saveMutation.mutate(formData);
  };

  const tabs = [
    { id: 'identificacion', label: '1. Identificación & Puesto', icon: User },
    { id: 'placas', label: '2. Placas & Seriales', icon: Tag },
    { id: 'hardware', label: '3. Hardware & Sistema', icon: Cpu },
    { id: 'perifericos', label: '4. Periféricos & Monitores', icon: Monitor },
    { id: 'especiales', label: '5. Especiales & Accesorios', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-4xl max-h-[92vh] rounded-3xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isEdit ? `Editar Equipo: ${equipo?.nombre_computo || 'Estación TI'}` : 'Agregar Nuevo Equipo TI'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isEdit ? 'Modifica cualquiera de las 33 columnas oficiales del inventario' : 'Registra un nuevo activo de cómputo en la planilla oficial'}
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-white text-white font-extrabold'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2 text-xs text-neutral-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: IDENTIFICACIÓN */}
          {activeTab === 'identificacion' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Nombre de Cómputo / Estación <span className="text-white">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre_computo}
                    onChange={(e) => handleChange('nombre_computo', e.target.value)}
                    placeholder="Ej. PF-ADMIN-01, Contabilidad-02"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Tipo de Equipo
                  </label>
                  <select
                    value={formData.tipo_equipo}
                    onChange={(e) => handleChange('tipo_equipo', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Computador AIO">Computador AIO (Todo en Uno)</option>
                    <option value="Portatil">Portátil / Laptop</option>
                    <option value="Desktop">Desktop / Torre PC</option>
                    <option value="Servidor">Servidor Local</option>
                    <option value="Tablet">Tablet / Dispositivo Móvil</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Modelo de Cómputo
                  </label>
                  <input
                    type="text"
                    value={formData.modelo_computo}
                    onChange={(e) => handleChange('modelo_computo', e.target.value)}
                    placeholder="Ej. HP ProDesk 400 G6, Lenovo ThinkCentre"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Estado del Equipo
                  </label>
                  <select
                    value={formData.estado_equipo}
                    onChange={(e) => handleChange('estado_equipo', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Buen estado">Buen estado</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                    <option value="En reparación">En reparación</option>
                    <option value="De baja">De baja</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Usuario Asignado
                  </label>
                  <input
                    type="text"
                    value={formData.usuario_asignado}
                    onChange={(e) => handleChange('usuario_asignado', e.target.value)}
                    placeholder="Ej. Juan Pérez, María Gómez"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Proceso / Área / Oficina
                  </label>
                  <input
                    type="text"
                    value={formData.proceso_oficina}
                    onChange={(e) => handleChange('proceso_oficina', e.target.value)}
                    placeholder="Ej. Sistemas, Contabilidad, Cartera, Producción"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Ubicación Física / Sede
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacion_fisica}
                    onChange={(e) => handleChange('ubicacion_fisica', e.target.value)}
                    placeholder="Ej. Sede Administrativa Piso 2, Granja 4"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    URL Foto del Equipo / Puesto
                  </label>
                  <input
                    type="text"
                    value={formData.foto_url}
                    onChange={(e) => handleChange('foto_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLACAS Y SERIALES */}
          {activeTab === 'placas' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Placa Sistemas (Cómputo)
                  </label>
                  <input
                    type="text"
                    value={formData.placa_sistemas}
                    onChange={(e) => handleChange('placa_sistemas', e.target.value)}
                    placeholder="Ej. 1042"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Placa Inventario Físico (Cómputo)
                  </label>
                  <input
                    type="text"
                    value={formData.placa_inventario}
                    onChange={(e) => handleChange('placa_inventario', e.target.value)}
                    placeholder="Ej. 05321"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Serial del Fabricante (Cómputo)
                  </label>
                  <input
                    type="text"
                    value={formData.serial_computo}
                    onChange={(e) => handleChange('serial_computo', e.target.value)}
                    placeholder="Ej. 8CC8329NZX"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    ID AnyDesk (Soporte Remoto)
                  </label>
                  <input
                    type="text"
                    value={formData.id_anydesk}
                    onChange={(e) => handleChange('id_anydesk', e.target.value)}
                    placeholder="Ej. 152048291"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE Y SISTEMA */}
          {activeTab === 'hardware' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Procesador
                  </label>
                  <input
                    type="text"
                    value={formData.procesador}
                    onChange={(e) => handleChange('procesador', e.target.value)}
                    placeholder="Ej. Intel Core i5-10400 @ 2.90GHz / AMD Ryzen 5"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Tipo de RAM
                  </label>
                  <select
                    value={formData.ram_tipo}
                    onChange={(e) => handleChange('ram_tipo', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="DDR4">DDR4</option>
                    <option value="DDR3">DDR3</option>
                    <option value="DDR5">DDR5</option>
                    <option value="LPDDR4">LPDDR4</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Capacidad RAM
                  </label>
                  <input
                    type="text"
                    value={formData.ram_capacidad}
                    onChange={(e) => handleChange('ram_capacidad', e.target.value)}
                    placeholder="Ej. 8 GB, 16 GB"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Tipo de Disco
                  </label>
                  <select
                    value={formData.disco_tipo}
                    onChange={(e) => handleChange('disco_tipo', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="SSD">SSD (Sólido)</option>
                    <option value="NVMe">NVMe M.2</option>
                    <option value="HDD">HDD (Mecánico)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Capacidad de Disco
                  </label>
                  <input
                    type="text"
                    value={formData.disco_capacidad}
                    onChange={(e) => handleChange('disco_capacidad', e.target.value)}
                    placeholder="Ej. 240 GB, 480 GB, 1 TB"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Sistema Operativo
                  </label>
                  <input
                    type="text"
                    value={formData.sistema_operativo}
                    onChange={(e) => handleChange('sistema_operativo', e.target.value)}
                    placeholder="Ej. Windows 10 Pro 64-bit, Windows 11"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Software Base Instalado
                  </label>
                  <input
                    type="text"
                    value={formData.software_base}
                    onChange={(e) => handleChange('software_base', e.target.value)}
                    placeholder="Ej. Chrome, Office 365, AnyDesk, Antivirus, 7-Zip"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERIFÉRICOS Y MONITORES */}
          {activeTab === 'perifericos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Monitor Principal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Marca (Monitor)
                  </label>
                  <input
                    type="text"
                    value={formData.monitor_marca}
                    onChange={(e) => handleChange('monitor_marca', e.target.value)}
                    placeholder="Ej. LG, Samsung, Lenovo, HP"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Placa (Monitor)
                  </label>
                  <input
                    type="text"
                    value={formData.monitor_placa}
                    onChange={(e) => handleChange('monitor_placa', e.target.value)}
                    placeholder="Ej. 1089"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Serial (Monitor)
                  </label>
                  <input
                    type="text"
                    value={formData.monitor_serial}
                    onChange={(e) => handleChange('monitor_serial', e.target.value)}
                    placeholder="Ej. 809NTX721"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pt-2">
                Periféricos de Entrada & Impresión
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Teclado (Placa / Marca)
                  </label>
                  <input
                    type="text"
                    value={formData.teclado_placa}
                    onChange={(e) => handleChange('teclado_placa', e.target.value)}
                    placeholder="Ej. Genius, Lenovo 042"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Mouse (Placa / Marca)
                  </label>
                  <input
                    type="text"
                    value={formData.mouse_placa}
                    onChange={(e) => handleChange('mouse_placa', e.target.value)}
                    placeholder="Ej. Genius Óptico"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Impresora (Placa / Modelo)
                  </label>
                  <input
                    type="text"
                    value={formData.impresora_placa}
                    onChange={(e) => handleChange('impresora_placa', e.target.value)}
                    placeholder="Ej. Kyocera 3520 - Placa 028"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ESPECIALES Y ACCESORIOS */}
          {activeTab === 'especiales' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Televisor
                  </label>
                  <input
                    type="text"
                    value={formData.televisor}
                    onChange={(e) => handleChange('televisor', e.target.value)}
                    placeholder="Ej. LG 43 Pulgadas Smart"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Módem / Router
                  </label>
                  <input
                    type="text"
                    value={formData.modem}
                    onChange={(e) => handleChange('modem', e.target.value)}
                    placeholder="Ej. TP-Link Dual Band"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    DVR (Grabador CCTV)
                  </label>
                  <input
                    type="text"
                    value={formData.dvr}
                    onChange={(e) => handleChange('dvr', e.target.value)}
                    placeholder="Ej. Dahua 4 Canales"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Cámaras (Detalle / Cantidad)
                  </label>
                  <input
                    type="text"
                    value={formData.camaras}
                    onChange={(e) => handleChange('camaras', e.target.value)}
                    placeholder="Ej. 2 Cámaras Dahua HD"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Cajón Monedero
                  </label>
                  <input
                    type="text"
                    value={formData.cajon_monedero}
                    onChange={(e) => handleChange('cajon_monedero', e.target.value)}
                    placeholder="Ej. 3nStar apertura RJ11"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Báscula Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.bascula}
                    onChange={(e) => handleChange('bascula', e.target.value)}
                    placeholder="Ej. TEK GALAXY 30kg"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Accesorios Adicionales
                  </label>
                  <textarea
                    rows={3}
                    value={formData.accesorios}
                    onChange={(e) => handleChange('accesorios', e.target.value)}
                    placeholder="Ej. Cargador original 65W, guaya de seguridad Kensington, adaptador VGA-HDMI..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

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
              <span>{saveMutation.isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipoModal;
