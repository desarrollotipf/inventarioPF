import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Save,
  Store,
  Monitor,
  Video,
  Printer,
  Scale,
  DollarSign,
  Wifi,
  Tv,
  Zap,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';

interface PdvModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdv?: any | null; // null for create mode, object for edit mode
  onSuccess?: () => void;
}

export const PdvModal: React.FC<PdvModalProps> = ({
  isOpen,
  onClose,
  pdv,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(pdv?.id);
  const [activeTab, setActiveTab] = useState<'tienda' | 'pos' | 'perifericos' | 'cctv_red'>('tienda');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    pdv_nombre: '',
    numero: '',
    pc_modelo: '',
    pc_placa: '',
    anydesk: '',
    procesador: '',
    ram: '4 GB',
    disco: 'SSD 240 GB',
    monitor: '',
    teclado: 'Genius',
    mouse: 'Genius',
    impresora: '',
    cajon_monedero: '',
    bascula_peso: '',
    modem: '',
    dvr: '',
    camaras: '',
    televisor: '',
    ups: '',
    estado: 'Operativo',
  });

  useEffect(() => {
    if (pdv) {
      setFormData({
        pdv_nombre: pdv.pdv_nombre || '',
        numero: pdv.numero !== undefined && pdv.numero !== null ? String(pdv.numero) : '',
        pc_modelo: pdv.pc_modelo || '',
        pc_placa: pdv.pc_placa || '',
        anydesk: pdv.anydesk || '',
        procesador: pdv.procesador || '',
        ram: pdv.ram || '4 GB',
        disco: pdv.disco || 'SSD 240 GB',
        monitor: pdv.monitor || '',
        teclado: pdv.teclado || 'Genius',
        mouse: pdv.mouse || 'Genius',
        impresora: pdv.impresora || '',
        cajon_monedero: pdv.cajon_monedero || '',
        bascula_peso: pdv.bascula_peso || '',
        modem: pdv.modem || '',
        dvr: pdv.dvr || '',
        camaras: pdv.camaras || '',
        televisor: pdv.televisor || '',
        ups: pdv.ups || '',
        estado: pdv.estado || 'Operativo',
      });
    } else {
      setFormData({
        pdv_nombre: '',
        numero: '',
        pc_modelo: '',
        pc_placa: '',
        anydesk: '',
        procesador: '',
        ram: '4 GB',
        disco: 'SSD 240 GB',
        monitor: '',
        teclado: 'Genius',
        mouse: 'Genius',
        impresora: '',
        cajon_monedero: '',
        bascula_peso: '',
        modem: '',
        dvr: '',
        camaras: '',
        televisor: '',
        ups: '',
        estado: 'Operativo',
      });
    }
    setErrorMsg(null);
  }, [pdv, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const dataToSend = {
        ...payload,
        numero: payload.numero ? Number(payload.numero) : undefined,
      };
      if (isEdit) {
        return (await api.put(`/pdv/${pdv.id}`, dataToSend)).data;
      } else {
        return (await api.post('/pdv', dataToSend)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdvsList'] });
      queryClient.invalidateQueries({ queryKey: ['pdvDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Error al guardar los datos del punto de venta');
    },
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdv_nombre?.trim()) {
      setErrorMsg('El Nombre del Punto de Venta es obligatorio.');
      setActiveTab('tienda');
      return;
    }
    setErrorMsg(null);
    saveMutation.mutate(formData);
  };

  const tabs = [
    { id: 'tienda', label: '1. Tienda & Estado', icon: Store },
    { id: 'pos', label: '2. Computador de Caja POS', icon: Monitor },
    { id: 'perifericos', label: '3. Periféricos & Pesaje', icon: Printer },
    { id: 'cctv_red', label: '4. CCTV, Red & Energía', icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-3xl max-h-[92vh] rounded-3xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {isEdit ? `Editar Punto de Venta: ${pdv?.pdv_nombre}` : 'Agregar Nuevo Punto de Venta (PDV)'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isEdit ? 'Actualiza la dotación tecnológica de esta tienda' : 'Registra un nuevo PDV en la red de tiendas de Pollo Fiesta S.A.'}
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

        {/* Tabs */}
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

        {/* Error */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center gap-2 text-xs text-neutral-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: TIENDA */}
          {activeTab === 'tienda' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Nombre del Punto de Venta <span className="text-white">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pdv_nombre}
                    onChange={(e) => handleChange('pdv_nombre', e.target.value)}
                    placeholder="Ej. PDV 20 JULIO, PDV CHIA PLAZA"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Número de Tienda
                  </label>
                  <input
                    type="number"
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    placeholder="Ej. 1, 2, 3..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Estado Operativo
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Operativo">Operativo / En Servicio</option>
                    <option value="Buen Estado">Buen Estado</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Cierre Temporal">Cierre Temporal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPUTADOR POS */}
          {activeTab === 'pos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Modelo de Computador POS
                  </label>
                  <input
                    type="text"
                    value={formData.pc_modelo}
                    onChange={(e) => handleChange('pc_modelo', e.target.value)}
                    placeholder="Ej. HP-20 B001LA, Lenovo AIO"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Placa de Inventario PC
                  </label>
                  <input
                    type="text"
                    value={formData.pc_placa}
                    onChange={(e) => handleChange('pc_placa', e.target.value)}
                    placeholder="Ej. 3547"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    AnyDesk ID (Caja POS)
                  </label>
                  <input
                    type="text"
                    value={formData.anydesk}
                    onChange={(e) => handleChange('anydesk', e.target.value)}
                    placeholder="Ej. 514980022"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Procesador
                  </label>
                  <input
                    type="text"
                    value={formData.procesador}
                    onChange={(e) => handleChange('procesador', e.target.value)}
                    placeholder="Ej. Intel Celeron 2.41 GHz, Core i3"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Memoria RAM
                  </label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => handleChange('ram', e.target.value)}
                    placeholder="Ej. 4 GB DDR4"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Disco Duro
                  </label>
                  <input
                    type="text"
                    value={formData.disco}
                    onChange={(e) => handleChange('disco', e.target.value)}
                    placeholder="Ej. SSD 240 GB"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERIFÉRICOS */}
          {activeTab === 'perifericos' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Monitor
                  </label>
                  <input
                    type="text"
                    value={formData.monitor}
                    onChange={(e) => handleChange('monitor', e.target.value)}
                    placeholder="Ej. Pantalla Integrada AIO, LG 19"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Impresora POS (Facturación)
                  </label>
                  <input
                    type="text"
                    value={formData.impresora}
                    onChange={(e) => handleChange('impresora', e.target.value)}
                    placeholder="Ej. SATQ22S - 3522"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Báscula Comercial (Peso)
                  </label>
                  <input
                    type="text"
                    value={formData.bascula_peso}
                    onChange={(e) => handleChange('bascula_peso', e.target.value)}
                    placeholder="Ej. TEK GALAXY, Torrey"
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
                    placeholder="Ej. 3nStar, SAT"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Teclado
                  </label>
                  <input
                    type="text"
                    value={formData.teclado}
                    onChange={(e) => handleChange('teclado', e.target.value)}
                    placeholder="Ej. HP-1105, Genius-3440 (Marca-Placa)"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Mouse
                  </label>
                  <input
                    type="text"
                    value={formData.mouse}
                    onChange={(e) => handleChange('mouse', e.target.value)}
                    placeholder="Ej. Genius-1427, ASUS-3111 (Marca-Placa)"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CCTV Y RED */}
          {activeTab === 'cctv_red' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    DVR (Grabador CCTV)
                  </label>
                  <input
                    type="text"
                    value={formData.dvr}
                    onChange={(e) => handleChange('dvr', e.target.value)}
                    placeholder="Ej. DAHUA 4 PUERTOS"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Cantidad / Detalle Cámaras
                  </label>
                  <input
                    type="text"
                    value={formData.camaras}
                    onChange={(e) => handleChange('camaras', e.target.value)}
                    placeholder="Ej. 2, 3 Cámaras HD"
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
                    placeholder="Ej. TP-LINK, Claro"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Televisor (Menú / Turnos)
                  </label>
                  <input
                    type="text"
                    value={formData.televisor}
                    onChange={(e) => handleChange('televisor', e.target.value)}
                    placeholder="Ej. LG 42 Pulgadas"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    UPS (Respaldo de Energía)
                  </label>
                  <input
                    type="text"
                    value={formData.ups}
                    onChange={(e) => handleChange('ups', e.target.value)}
                    placeholder="Ej. APC 500VA, CDP"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
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
              <span>{saveMutation.isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Registrar PDV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdvModal;
