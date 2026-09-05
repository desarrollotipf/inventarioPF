import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Store,
  Laptop,
  Video,
  Wrench,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { CardNav, CardNavItem } from './CardNav';
import { GlobalSearchDropdown, GlobalSearchResults } from './GlobalSearchDropdown';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query global search across all lists
  const { data: searchResults, isLoading } = useQuery<GlobalSearchResults>({
    queryKey: ['globalSearchNavbar', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null;
      const res = await api.get('/catalogos/global-search', {
        params: { q: debouncedQuery },
      });
      return res.data;
    },
    enabled: Boolean(debouncedQuery),
    staleTime: 1000 * 30, // 30s cache
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardNavItems: CardNavItem[] = [
    {
      to: '/',
      label: 'Dashboard',
      badge: 'Métricas TI',
      description: 'Consola unificada con KPIs, distribución de equipos y estados en tiempo real.',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/inventario-ti',
      label: 'Sedes TI',
      badge: '138 Equipos',
      description: 'Parque de cómputo en sedes administrativas y plantas de beneficio.',
      icon: Laptop,
    },
    {
      to: '/pdv',
      label: 'Puntos de Venta',
      badge: '22 Tiendas',
      description: 'Dotación completa: cajas POS, impresoras, básculas, cajones y AnyDesk.',
      icon: Store,
    },
    {
      to: '/cctv',
      label: 'CCTV & Seguridad',
      badge: 'Canales DVR',
      description: 'Monitoreo de DVRs, cámaras IP y análogas en cada punto de venta.',
      icon: Video,
    },
    {
      to: '/mantenimientos',
      label: 'Mantenimientos',
      badge: 'Soporte',
      description: 'Gestión de mantenimientos preventivos, correctivos y bitácora técnica.',
      icon: Wrench,
    },
    {
      to: '/import-export',
      label: 'Importar / Exportar',
      badge: 'Excel .xlsx',
      description: 'Carga masiva por archivo Excel y descarga de inventarios consolidados.',
      icon: FileSpreadsheet,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsDropdownOpen(false);
  };

  const logoNode = (
    <div className="flex items-center gap-3 shrink-0 cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black shadow-md ring-1 ring-white/40">
        <ShieldCheck className="w-5 h-5 text-black" />
      </div>
      <div>
        <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
          Inventario Pollo Fiesta
        </span>
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-3">
      {/* Global Unified Search Input with Multi-List Dropdown */}
      <form
        ref={searchContainerRef}
        onSubmit={handleSearchSubmit}
        className="relative w-48 sm:w-64 md:w-80 lg:w-96"
      >
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim()) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsDropdownOpen(false);
            }
          }}
          placeholder="Buscar en Sedes, PDVs, CCTV o Mantenimientos..."
          className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Multi-list Search Dropdown Panel */}
        <GlobalSearchDropdown
          query={debouncedQuery}
          results={searchResults || null}
          isLoading={isLoading}
          isOpen={isDropdownOpen && Boolean(debouncedQuery)}
          onClose={() => setIsDropdownOpen(false)}
        />
      </form>
    </div>
  );

  return (
    <CardNav
      logo={logoNode}
      items={cardNavItems}
      rightContent={rightContent}
      ease="power3.out"
    />
  );
};

export default Navbar;
