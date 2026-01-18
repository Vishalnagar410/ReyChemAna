/**
 * Admin Analytics Service (READ-ONLY)
 */
import api from './api';

const adminAnalyticsService = {
    async getAnalytics(params = {}) {
        const response = await api.get('/admin/analytics', { params });
        return response.data;
    }
};

export default adminAnalyticsService;
