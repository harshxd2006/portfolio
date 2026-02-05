import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Home from '@/pages/Home';
import PostDetail from '@/pages/PostDetail';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import CreatePost from '@/pages/CreatePost';
import './App.css';

// Layout component with sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="md:pl-64">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// Simple layout without sidebar for auth pages
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container py-6">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/auth/callback"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />

          {/* Main Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/post/:id"
            element={
              <MainLayout>
                <PostDetail />
              </MainLayout>
            }
          />
          <Route
            path="/create-post"
            element={
              <MainLayout>
                <CreatePost />
              </MainLayout>
            }
          />
          <Route
            path="/u/:username"
            element={
              <MainLayout>
                <Profile />
              </MainLayout>
            }
          />
          <Route
            path="/trending"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/discussions"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/portfolio"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
