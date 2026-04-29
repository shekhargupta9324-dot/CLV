import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { DataUpload } from '@/pages/DataUpload';
import { Prediction } from '@/pages/Prediction';
import { ChurnPrediction } from '@/pages/ChurnPrediction';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import { About } from '@/pages/About';
import { Contact } from '@/pages/Contact';
import { Login } from '@/pages/Login';
import { Insights } from '@/pages/Insights';
import { MongoExplorer } from '@/pages/MongoExplorer';
import { UserManagement } from '@/pages/UserManagement';
import ScenarioSimulation from '@/pages/ScenarioSimulation';
import { ModelComparison } from '@/pages/ModelComparison';
import { Profile } from '@/pages/Profile';
import { Chatbot } from '@/components/Chatbot';
import { Toaster } from 'react-hot-toast';
import { PredictionProvider } from '@/context/PredictionContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GlobalLoader } from '@/components/GlobalLoader';

// Redirects to /login if the user is not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Redirects to / if the user is already logged in
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { isLoading } = useAuth();
  return (
    <>
      <GlobalLoader isLoading={isLoading} />
      <PredictionProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '0.75rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f8fafc',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f8fafc',
                },
              },
            }}
          />
          <Chatbot />
          <Routes>
            {/* Public route — login page only */}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

            {/* Protected routes — require authentication */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="upload" element={<DataUpload />} />
              <Route path="prediction" element={<Prediction />} />
              <Route path="churn" element={<ChurnPrediction />} />
              <Route path="simulation" element={<ScenarioSimulation />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="insights" element={<Insights />} />
              <Route path="mongo-explorer" element={<MongoExplorer />} />
              <Route path="model-comparison" element={<ModelComparison />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PredictionProvider>
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
