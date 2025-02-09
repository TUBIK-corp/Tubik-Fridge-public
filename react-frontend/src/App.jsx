import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Generator from './pages/Generator';
import Analytics from './pages/Analytics';
import Shopping from './pages/Shopping';
import AuthCallback from './pages/AuthCallback';
import Login from './pages/Login';
import { useEffect, useState } from 'react';
import { authApi } from './api/api';
import CodePage from './pages/CodePage';
import QRGridGenerator from './pages/QRGridGenerator';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi.checkAuth()
      .then(setIsAuthenticated)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading-overlay">
        <div className="app-loader"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login />
          } />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={
            isAuthenticated ? <Layout /> : <Navigate to="/auth/login" />
          }>
            <Route index element={<Home />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="generator" element={<Generator />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="shopping" element={<Shopping />} />
            <Route path="code" element={<CodePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;