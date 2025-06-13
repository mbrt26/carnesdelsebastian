import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdenesPage from './pages/OrdenesPage';
import CalidadPage from './pages/CalidadPage';
import InventariosPage from './pages/InventariosPage';
import authService from './services/authService';

// Configurar tema de Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f', // Rojo para la temática cárnica
    },
    secondary: {
      main: '#2e7d32', // Verde para calidad
    },
  },
});

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ordenes/*" element={<OrdenesPage />} />
                    <Route path="/calidad/*" element={<CalidadPage />} />
                    <Route path="/inventarios/*" element={<InventariosPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
