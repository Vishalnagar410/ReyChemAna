/**
 * Main App component with routing
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Login from './components/Auth/Login';
import ChemistDashboard from './components/Chemist/ChemistDashboard';
import CreateRequest from './components/Chemist/CreateRequest';
import AnalystDashboard from './components/Analyst/AnalystDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import RequestDetails from './components/Common/RequestDetails';
import { USER_ROLES } from './utils/constants';

function AppRoutes() {
    const { user, loading } = useAuth();


    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontSize: '1.2rem'
                }}
            >
                Loading...
            </div>
        );
    }

    // Redirect logged-in users from root to their dashboard
    const getRootRedirect = () => {
        if (!user) return '/login';
        switch (user.role) {
            case USER_ROLES.CHEMIST:
                return '/chemist';
            case USER_ROLES.ANALYST:
                return '/analyst';
            case USER_ROLES.ADMIN:
                return '/admin';
            default:
                return '/login';
        }
    };

    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />

            {/* Chemist Routes */}
            <Route
                path="/chemist"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.CHEMIST]}>
                        <ChemistDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/chemist/create-request"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.CHEMIST]}>
                        <CreateRequest />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/chemist/request/:id"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.CHEMIST]}>
                        <RequestDetails />
                    </ProtectedRoute>
                }
            />

            {/* Analyst Routes */}
            <Route
                path="/analyst"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ANALYST]}>
                        <AnalystDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/analyst/request/:id"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ANALYST]}>
                        <RequestDetails />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
