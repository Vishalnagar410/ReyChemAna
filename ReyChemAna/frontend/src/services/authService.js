/**
 * Authentication service
 */
import api from './api';

const authService = {
    /**
     * Login user
     */
    async login(username, password) {
        const response = await api.post('/auth/login', { username, password });
        const { access_token } = response.data;

        // Store token
        localStorage.setItem('access_token', access_token);

        // Fetch verified user from backend
        const userResponse = await api.get('/users/me');
        const user = userResponse.data;

        localStorage.setItem('user', JSON.stringify(user));

        return { token: access_token, user };
    },

    /**
     * Fetch current user from backend (token verification)
     */
    async fetchCurrentUser() {
        const response = await api.get('/users/me');
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Ignore API failure
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
    },

    /**
     * Get cached user (NOT trusted for auth decisions)
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check token existence only
     */
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
};

export default authService;
