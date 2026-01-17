/**
 * User service - handles user management API calls (Admin only)
 */
import api from './api';

const userService = {
    /**
     * Create a new user
     */
    async createUser(data) {
        const response = await api.post('/users/', data);
        return response.data;
    },

    /**
     * Get all users with filters
     */
    async getUsers(params = {}) {
        const response = await api.get('/users/', { params });
        return response.data;
    },

    /**
     * Get user by ID
     */
    async getUser(id) {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    /**
     * Update user
     */
    async updateUser(id, data) {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },

    /**
     * Get current user info
     */
    async getCurrentUser() {
        const response = await api.get('/users/me');
        return response.data;
    }
};

export default userService;
