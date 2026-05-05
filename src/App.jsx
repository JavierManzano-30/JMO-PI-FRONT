import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { LoginLayout } from './layouts/LoginLayout.jsx';
import { PrivateLayout } from './layouts/PrivateLayout.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';

const Login = lazy(() => import('./pages/Login.jsx').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register.jsx').then((m) => ({ default: m.Register })));
const NoSession = lazy(() => import('./pages/NoSession.jsx').then((m) => ({ default: m.NoSession })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then((m) => ({ default: m.Dashboard })));
const PhotoDetail = lazy(() => import('./pages/PhotoDetail.jsx').then((m) => ({ default: m.PhotoDetail })));
const PhotoDetailClosed = lazy(() => import('./pages/PhotoDetailClosed.jsx').then((m) => ({ default: m.PhotoDetailClosed })));
const UploadPhoto = lazy(() => import('./pages/UploadPhoto.jsx').then((m) => ({ default: m.UploadPhoto })));
const UploadSuccess = lazy(() => import('./pages/UploadSuccess.jsx').then((m) => ({ default: m.UploadSuccess })));
const Profile = lazy(() => import('./pages/Profile.jsx').then((m) => ({ default: m.Profile })));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit.jsx').then((m) => ({ default: m.ProfileEdit })));
const Chat = lazy(() => import('./pages/Chat.jsx').then((m) => ({ default: m.Chat })));
const Forbidden = lazy(() => import('./pages/Forbidden.jsx').then((m) => ({ default: m.Forbidden })));
const NotFound = lazy(() => import('./pages/NotFound.jsx').then((m) => ({ default: m.NotFound })));
const Winners = lazy(() => import('./pages/Winners.jsx').then((m) => ({ default: m.Winners })));
const ContestDetail = lazy(() => import('./pages/ContestDetail.jsx').then((m) => ({ default: m.ContestDetail })));
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx').then((m) => ({ default: m.AdminPanel })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx').then((m) => ({ default: m.ForgotPassword })));
const LegalNotice = lazy(() => import('./pages/legal/LegalNotice.jsx').then((m) => ({ default: m.LegalNotice })));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy.jsx').then((m) => ({ default: m.PrivacyPolicy })));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy.jsx').then((m) => ({ default: m.CookiePolicy })));

function LoadingRoute() {
  return <div className="status loading">Cargando...</div>;
}

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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Suspense fallback={<LoadingRoute />}>
          <Routes>
            <Route path="/" element={<Navigate to="/gallery" replace />} />
            <Route element={<LoginLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<PublicLayout />}>
              <Route path="/no-session" element={<NoSession />} />
              <Route path="/contests" element={<Winners />} />
              <Route path="/contests/:themeId" element={<ContestDetail />} />
              <Route path="/winners" element={<Navigate to="/contests" replace />} />
              <Route path="/legal-notice" element={<LegalNotice />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/gallery" element={<Dashboard />} />
              <Route path="/photos/:photoId" element={<PhotoDetail />} />
              <Route path="/users/:userId" element={<Profile />} />
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
              <Route path="contests" element={<Winners />} />
              <Route path="contests/:themeId" element={<ContestDetail />} />
              <Route path="winners" element={<Navigate to="../contests" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users/:userId" element={<Profile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
              <Route path="chat" element={<Chat />} />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}


