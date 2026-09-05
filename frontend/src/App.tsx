import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ClickSpark } from './components/ClickSpark';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PdvList } from './pages/Pdv/PdvList';
import { PdvDetail } from './pages/Pdv/PdvDetail';
import { CctvViewer } from './pages/Pdv/CctvViewer';
import { TiList } from './pages/InventarioTi/TiList';
import { MantenimientosList } from './pages/Mantenimiento/MantenimientosList';
import { ImportExportView } from './pages/ImportExport/ImportExportView';
import { SearchResults } from './pages/SearchResults/SearchResults';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ClickSpark sparkColor="#ffffff" sparkSize={12} sparkRadius={22} sparkCount={10} duration={400}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pdv" element={<PdvList />} />
              <Route path="/pdv/:id" element={<PdvDetail />} />
              <Route path="/cctv" element={<CctvViewer />} />
              <Route path="/inventario-ti" element={<TiList />} />
              <Route path="/mantenimientos" element={<MantenimientosList />} />
              <Route path="/import-export" element={<ImportExportView />} />
              <Route path="/buscar" element={<SearchResults />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ClickSpark>
    </QueryClientProvider>
  );
};

export default App;
