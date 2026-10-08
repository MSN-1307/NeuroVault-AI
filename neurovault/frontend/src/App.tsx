import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { GuidePage } from './pages/GuidePage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { VaultPage } from './pages/VaultPage';
import { GraphPage } from './pages/GraphPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DatabasePage } from './pages/DatabasePage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { InnovationsPage } from './pages/InnovationsPage';
import { DocumentIntelligencePage } from './pages/DocumentIntelligencePage';
import { ReplayPage } from './pages/ReplayPage';
import { ExplainableRetrievalPage } from './pages/ExplainableRetrievalPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login';
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 350);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isAuthRoute) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors flex flex-col">
      {/* Top Route Transition Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 shadow-md shadow-emerald-500/50 animate-pulse transition-opacity duration-300"></div>
      )}
      
      {/* Abatable Style Top Navbar */}
      <TopNavbar />

      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col justify-between">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/explainable" element={<ExplainableRetrievalPage />} />
            <Route path="/replay" element={<ReplayPage />} />
            <Route path="/documents" element={<DocumentIntelligencePage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/innovations" element={<InnovationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global DBTHON'26 Attribution Footer */}
        <footer className="mt-12 pt-6 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
            <span>Made with <span className="text-rose-500 inline-block animate-pulse">❤️</span> for <strong className="text-slate-800 dark:text-slate-200 font-bold">DBTHON'26</strong></span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>Engineered by <strong className="text-blue-600 dark:text-blue-400 font-bold">Sai Nikhit</strong> &amp; <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Sohan</strong></span>
          </div>
        </footer>
      </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
