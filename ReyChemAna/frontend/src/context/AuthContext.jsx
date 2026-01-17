/**
 * Authentication context for global auth state
 * Backend is the source of truth
 */
import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                const token = localStorage.getItem('access_token');

                if (!token) {
                    setUser(null);
                    return;
                }

                // 🔐 Verify token with backend
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.warn('Auth bootstrap failed, clearing session');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = async (username, password) => {
        const { user } = await authService.login(username, password);
        setUser(user);
        return user;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
