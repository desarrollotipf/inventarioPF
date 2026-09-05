-- =========================================================================
-- REESTRUCTURACIÓN DEL ESQUEMA INVENTARIOS TI - POLLO FIESTA S.A.
-- Basado en: INVENTARIOS TI 2.xlsx (Inventarios Sedes & Equipos PDV)
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS "InventariosTI";
SET search_path TO "InventariosTI", public;

-- 1. Catálogo de Sedes y Ubicaciones
DROP TABLE IF EXISTS "InventariosTI".bitacora_notas CASCADE;
DROP TABLE IF EXISTS "InventariosTI".mantenimientos CASCADE;
DROP TABLE IF EXISTS "InventariosTI".inventario_sedes CASCADE;
DROP TABLE IF EXISTS "InventariosTI".equipos_pdv CASCADE;
DROP TABLE IF EXISTS "InventariosTI".sedes CASCADE;
DROP TABLE IF EXISTS "InventariosTI".usuarios_sistema CASCADE;

CREATE TABLE "InventariosTI".sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'SEDE_ADMINISTRATIVA', -- 'SEDE_ADMINISTRATIVA', 'PLANTA', 'PDV', 'OTRO'
    ciudad VARCHAR(100) DEFAULT 'Bogotá',
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inventario de Sedes (163 Puestos de Trabajo y Estaciones TI)
CREATE TABLE "InventariosTI".inventario_sedes (
    id SERIAL PRIMARY KEY,
    excel_id INT,
    nombre_computo VARCHAR(100),            -- Hostname / Estación
    tipo_equipo VARCHAR(100),               -- Portatil, ALL IN ONE, CPU-Monitor, etc.
    modelo_computo VARCHAR(150),
    placa_sistemas VARCHAR(100),            -- PLACA SISTEMAS (COMPUTO)
    placa_inventario VARCHAR(100),          -- PLACA INVENTARIO (COMPUTO)
    serial_computo VARCHAR(150),            -- SERIAL (COMPUTO)
    procesador VARCHAR(150),
    ram_tipo VARCHAR(50),                   -- DDR3, DDR4, DDR5
    ram_capacidad VARCHAR(50),              -- 4GB, 8GB, 16GB
    disco_tipo VARCHAR(50),                 -- SSD, HDD
    disco_capacidad VARCHAR(50),            -- 240 GB, 512 GB, 1TB
    id_anydesk VARCHAR(100),
    sistema_operativo VARCHAR(150),
    software_base TEXT,
    usuario_asignado VARCHAR(150),          -- Empleado
    proceso_oficina VARCHAR(150),           -- Área / Proceso (Sistemas, Auditoría, etc.)
    ubicacion_fisica VARCHAR(150),          -- Sede / Ubicación Física
    sede_id INT REFERENCES "InventariosTI".sedes(id) ON DELETE SET NULL,
    estado_equipo VARCHAR(100) DEFAULT 'Buen estado',
    foto_url TEXT,                          -- URL SharePoint
    accesorios TEXT,                        -- Cargador, adaptadores
    
    -- Periféricos y Equipos Vinculados al Puesto
    monitor_marca VARCHAR(100),
    monitor_placa VARCHAR(100),
    monitor_serial VARCHAR(150),
    teclado_placa VARCHAR(100),
    mouse_placa VARCHAR(100),
    impresora_placa VARCHAR(100),
    modem VARCHAR(150),
    televisor VARCHAR(150),
    dvr VARCHAR(150),
    camaras VARCHAR(100),
    cajon_monedero VARCHAR(100),
    bascula VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Equipos y Dotación Tecnológica por Punto de Venta (PDVs)
CREATE TABLE "InventariosTI".equipos_pdv (
    id SERIAL PRIMARY KEY,
    numero INT,                             -- N° en planilla PDV
    pdv_nombre VARCHAR(150) NOT NULL,       -- Nombre PDV (ej. PDV 20 DE JULIO)
    sede_id INT REFERENCES "InventariosTI".sedes(id) ON DELETE SET NULL,
    pc_modelo VARCHAR(150),                 -- PC
    pc_placa VARCHAR(100),                  -- PLACA
    procesador VARCHAR(150),                -- PROCESADOR
    ram VARCHAR(50),                        -- RAM
    disco VARCHAR(50),                      -- DISCO
    monitor VARCHAR(150),                   -- MONITOR
    teclado VARCHAR(100),                   -- TECLADO
    mouse VARCHAR(100),                     -- MOUSE
    impresora VARCHAR(150),                 -- IMPRESORA (POS)
    dvr VARCHAR(150),                       -- DVR
    camaras VARCHAR(100),                   -- CAMARAS (cantidad / detalle)
    cajon_monedero VARCHAR(150),            -- CAJON MONEDERO
    modem VARCHAR(150),                     -- MODEM
    televisor VARCHAR(150),                 -- TELEVISOR
    bascula_peso VARCHAR(150),              -- BASCULA DE PESO
    ups VARCHAR(150),                       -- UPS
    anydesk VARCHAR(100),                   -- ANYDESK
    estado VARCHAR(50) DEFAULT 'OPERATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Usuarios del Sistema para Acceso y Roles
CREATE TABLE "InventariosTI".usuarios_sistema (
    id SERIAL PRIMARY KEY,
    correo VARCHAR(150) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'ADMIN',        -- 'ADMIN', 'TECNICO', 'AUDITOR'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bitácora de Notas y Seguimiento Técnico
CREATE TABLE "InventariosTI".bitacora_notas (
    id SERIAL PRIMARY KEY,
    origen VARCHAR(20) NOT NULL,            -- 'SEDE' o 'PDV'
    registro_id INT NOT NULL,               -- ID de inventario_sedes o equipos_pdv
    autor VARCHAR(150) NOT NULL,
    nota TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Mantenimientos
CREATE TABLE "InventariosTI".mantenimientos (
    id SERIAL PRIMARY KEY,
    origen VARCHAR(20) NOT NULL,            -- 'SEDE' o 'PDV'
    registro_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,              -- 'PREVENTIVO', 'CORRECTIVO'
    descripcion TEXT NOT NULL,
    tecnico_responsable VARCHAR(150),
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'FINALIZADO'
    fecha_programada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_realizado TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda optimizados
CREATE INDEX idx_inv_sedes_search ON "InventariosTI".inventario_sedes(nombre_computo, placa_sistemas, placa_inventario, serial_computo, usuario_asignado);
CREATE INDEX idx_inv_sedes_ubicacion ON "InventariosTI".inventario_sedes(ubicacion_fisica);
CREATE INDEX idx_inv_sedes_proceso ON "InventariosTI".inventario_sedes(proceso_oficina);
CREATE INDEX idx_inv_pdv_nombre ON "InventariosTI".equipos_pdv(pdv_nombre);
