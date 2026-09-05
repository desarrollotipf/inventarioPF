import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  HardDrive,
  Store,
  Laptop,
  HelpCircle,
  Layers,
  ArrowDownToLine,
  Info,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';

interface ImportReport {
  success: boolean;
  procesados: number;
  insertados: number;
  actualizados: number;
  totalFilas: number;
  detalles?: {
    pdv?: { insertados: number; actualizados: number };
    sedes?: { insertados: number; actualizados: number };
  };
  errores?: Array<{ fila: number; hoja: string; error: string }>;
  message?: string;
}

export const ImportExportView: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedModulo, setSelectedModulo] = useState<'AUTO' | 'PDV' | 'TI'>('AUTO');
  const [importStatus, setImportStatus] = useState<ImportReport | null>(null);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async (tipo: 'pdv' | 'ti' | 'completo') => {
    setDownloading(tipo);
    setExportMessage(null);
    try {
      const res = await api.get(`/import-export/export/${tipo}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Inventario_PolloFiesta_${tipo.toUpperCase()}_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportMessage({
        type: 'success',
        text: `Reporte Excel ${tipo.toUpperCase()} descargado exitosamente.`,
      });
    } catch (err: any) {
      console.error('Error al exportar:', err);
      setExportMessage({
        type: 'error',
        text: 'Error al generar la descarga del archivo Excel. Inténtalo nuevamente.',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPlantilla = async (modulo: 'pdv' | 'ti') => {
    setDownloading(`plantilla-${modulo}`);
    try {
      const res = await api.get(`/import-export/plantilla/${modulo}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Plantilla_Inventario_${modulo.toUpperCase()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar plantilla:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setImportStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    if (selectedModulo !== 'AUTO') {
      formData.append('modulo', selectedModulo);
    }

    try {
      const res = await api.post('/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportStatus(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el archivo Excel. Verifica el formato de columnas o usa las plantillas.';
      setImportStatus({
        success: false,
        procesados: 0,
        insertados: 0,
        actualizados: 0,
        totalFilas: 0,
        message: msg,
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
          <span>Gestor de Datos Masivos</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Importación & Exportación de Inventarios Excel
        </h1>
        <p className="text-sm text-neutral-400 font-medium mt-1">
          Descarga reportes consolidados actualizados y realiza cargas masivas de activos para Puntos de Venta (PDV) y Sedes TI.
        </p>
      </div>

      {/* Export Message Banner */}
      {exportMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between transition-all ${
            exportMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {exportMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{exportMessage.text}</span>
          </div>
          <button
            onClick={() => setExportMessage(null)}
            className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Export Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-neutral-400" />
            <span>Exportar Bases de Datos Consolidadas</span>
          </h3>
          <span className="text-xs text-neutral-400">Archivos oficiales en formato .XLSX</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Export PDV */}
          <div className="glass-card p-6 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center font-bold text-xl">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white">Inventario Puntos de Venta (PDV)</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Todas las sedes PDV con computadores de caja, periféricos de facturación, básculas, cajones y cámaras CCTV.
              </p>
            </div>
            <button
              onClick={() => handleExport('pdv')}
              disabled={downloading === 'pdv'}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              {downloading === 'pdv' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel PDV</span>
                </>
              )}
            </button>
          </div>

          {/* Export TI */}
          <div className="glass-card p-6 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-cyan-400 flex items-center justify-center font-bold text-xl">
                <Laptop className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white">Inventario Sedes TI & Oficinas</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Estaciones de trabajo corporativas, portátiles, PCs, placas de inventario/sistemas, procesador, RAM y usuarios asignados.
              </p>
            </div>
            <button
              onClick={() => handleExport('ti')}
              disabled={downloading === 'ti'}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              {downloading === 'ti' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel TI</span>
                </>
              )}
            </button>
          </div>

          {/* Export Complete */}
          <div className="glass-card p-6 rounded-3xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-emerald-400 flex items-center justify-center font-bold text-xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white">Consolidado Maestro Completo</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Auditoría general con hojas separadas para: Equipos PDV, Sedes TI, Catálogo de Sedes y Mantenimientos.
              </p>
            </div>
            <button
              onClick={() => handleExport('completo')}
              disabled={downloading === 'completo'}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              {downloading === 'completo' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando Consolidado...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Descargar Consolidado</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="glass-card p-6 rounded-3xl border border-neutral-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-400" />
              <span>Plantillas Oficiales para Carga Masiva</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Descarga los formatos oficiales en blanco o con datos de ejemplo para preparar tus archivos antes de importar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadPlantilla('pdv')}
              disabled={downloading === 'plantilla-pdv'}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-2 border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" />
              <span>Plantilla PDV</span>
            </button>
            <button
              onClick={() => handleDownloadPlantilla('ti')}
              disabled={downloading === 'plantilla-ti'}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-2 border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plantilla Sedes TI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-neutral-400" />
            <span>Importación Masiva de Archivos Excel</span>
          </h3>

          {/* Module Selector */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-2xl text-xs font-semibold">
            <span className="text-neutral-400 px-2">Destino:</span>
            <button
              type="button"
              onClick={() => setSelectedModulo('AUTO')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedModulo === 'AUTO'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auto-detectar
            </button>
            <button
              type="button"
              onClick={() => setSelectedModulo('PDV')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedModulo === 'PDV'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Equipos PDV
            </button>
            <button
              type="button"
              onClick={() => setSelectedModulo('TI')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedModulo === 'TI'
                  ? 'bg-cyan-400 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sedes TI
            </button>
          </div>
        </div>

        {/* Drag & Drop Card */}
        <div className="glass-card p-10 rounded-3xl border border-dashed border-neutral-700 hover:border-neutral-500 text-center relative transition-all group">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div className="space-y-4 max-w-lg mx-auto pointer-events-none">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
              <Upload className={`w-8 h-8 text-neutral-200 ${uploading ? 'animate-bounce text-amber-400' : ''}`} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {uploading ? 'Procesando y validando registros en base de datos...' : 'Arrastra o haz clic para subir tu archivo Excel'}
              </h4>
              <p className="text-xs text-neutral-400 mt-1.5">
                Archivos compatibles: <span className="font-mono text-neutral-200">.xlsx, .xls</span>. Los registros existentes se actualizan automáticamente y los nuevos se insertan.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300">
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              <span>Compatible con el archivo maestro <strong className="text-white">INVENTARIOS TI 2.xlsx</strong></span>
            </div>
          </div>
        </div>

        {/* Import Results Report Card */}
        {importStatus && (
          <div
            className={`p-6 rounded-3xl border transition-all ${
              importStatus.success
                ? 'bg-neutral-900/90 border-neutral-700'
                : 'bg-neutral-900/90 border-rose-900/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  importStatus.success
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">
                    {importStatus.success
                      ? 'Importación completada con éxito'
                      : 'Ocurrió un problema en la importación'}
                  </h4>
                  <button
                    onClick={() => setImportStatus(null)}
                    className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

                {importStatus.message && (
                  <p className="text-xs text-neutral-300">{importStatus.message}</p>
                )}

                {importStatus.success && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 text-center">
                      <div className="text-xl font-black text-white">{importStatus.procesados}</div>
                      <div className="text-[11px] text-neutral-400 uppercase font-semibold mt-0.5">Total Procesados</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 text-center">
                      <div className="text-xl font-black text-emerald-400">{importStatus.insertados}</div>
                      <div className="text-[11px] text-neutral-400 uppercase font-semibold mt-0.5">Nuevos Creados</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 text-center">
                      <div className="text-xl font-black text-cyan-400">{importStatus.actualizados}</div>
                      <div className="text-[11px] text-neutral-400 uppercase font-semibold mt-0.5">Actualizados</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 text-center">
                      <div className="text-xl font-black text-amber-400">{importStatus.totalFilas}</div>
                      <div className="text-[11px] text-neutral-400 uppercase font-semibold mt-0.5">Filas Excel</div>
                    </div>
                  </div>
                )}

                {/* Subdetails if available */}
                {importStatus.detalles && (
                  <div className="flex flex-wrap gap-4 pt-1 text-xs text-neutral-400">
                    {importStatus.detalles.pdv && (
                      <span className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        Puntos de Venta: <strong className="text-white">{importStatus.detalles.pdv.actualizados} actualizados, {importStatus.detalles.pdv.insertados} nuevos</strong>
                      </span>
                    )}
                    {importStatus.detalles.sedes && (
                      <span className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                        Sedes TI: <strong className="text-white">{importStatus.detalles.sedes.actualizados} actualizados, {importStatus.detalles.sedes.insertados} nuevos</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Errors list if any */}
                {importStatus.errores && importStatus.errores.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 space-y-1 max-h-40 overflow-y-auto">
                    <p className="font-bold text-rose-200">Filas con observaciones:</p>
                    {importStatus.errores.map((err, idx) => (
                      <div key={idx}>
                        Hoja "{err.hoja}", Fila {err.fila}: {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExportView;
