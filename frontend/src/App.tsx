import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { AppShell } from './components/layout/AppShell';

// Features
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PracticePage } from './features/practice/PracticePage';
import { ProgressPage } from './features/progress/ProgressPage';
import { CoursePage } from './features/learning/CoursePage';
import { ModulePage } from './features/learning/ModulePage';
import { LessonPage } from './features/learning/LessonPage';
import { QuantumLabPage } from './features/circuit/QuantumLabPage';

const NotFoundPage: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-base)',
      padding: '2rem',
      textAlign: 'center'
    }}
  >
    <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
      404
    </h1>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
      The quantum state you were looking for has collapsed or does not exist in this realm.
    </p>
    <Link to="/" className="btn btn-primary">
      Return Home
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Authenticated Protected Application Shell */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="learn" element={<CoursePage />} />
            <Route path="learn/modules/:moduleId" element={<ModulePage />} />
            <Route path="learn/lessons/:lessonId" element={<LessonPage />} />
            <Route path="quantum-lab" element={<QuantumLabPage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
