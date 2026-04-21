import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { LoginLayout } from './layouts/LoginLayout.jsx';
import { PrivateLayout } from './layouts/PrivateLayout.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { NoSession } from './pages/NoSession.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { PhotoDetail } from './pages/PhotoDetail.jsx';
import { PhotoDetailClosed } from './pages/PhotoDetailClosed.jsx';
import { UploadPhoto } from './pages/UploadPhoto.jsx';
import { UploadSuccess } from './pages/UploadSuccess.jsx';
import { Profile } from './pages/Profile.jsx';
import { ProfileEdit } from './pages/ProfileEdit.jsx';
import { Forbidden } from './pages/Forbidden.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { Winners } from './pages/Winners.jsx';
import { AdminPanel } from './pages/AdminPanel.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';

function RequireAuth({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="status loading">Restaurando sesión...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/no-session" state={{ from: location }} replace />;
  }

  return children;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return <Navigate to="/app/forbidden" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/winners" replace />} />
          <Route element={<LoginLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<PublicLayout />}>
            <Route path="/no-session" element={<NoSession />} />
            <Route path="/winners" element={<Winners />} />
          </Route>
          <Route
            path="/app"
            element={(
              <RequireAuth>
                <PrivateLayout />
              </RequireAuth>
            )}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="photos/upload" element={<UploadPhoto />} />
            <Route path="photos/upload/success" element={<UploadSuccess />} />
            <Route path="photos/:photoId" element={<PhotoDetail />} />
            <Route path="photos/:photoId/closed" element={<PhotoDetailClosed />} />
            <Route path="winners" element={<Winners />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<ProfileEdit />} />
            <Route
              path="admin"
              element={(
                <RequireRole role="admin">
                  <AdminPanel />
                </RequireRole>
              )}
            />
            <Route path="forbidden" element={<Forbidden />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


