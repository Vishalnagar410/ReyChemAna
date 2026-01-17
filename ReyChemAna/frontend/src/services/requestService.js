/**
 * Request service - handles analysis request API calls
 */
import api from './api';

const requestService = {
    /**
     * Create a new analysis request
     */
    async createRequest(data) {
        const response = await api.post('/requests/', data);
        return response.data;
    },

    /**
     * Get all requests with filters
     */
    async getRequests(params = {}) {
        const response = await api.get('/requests/', { params });
        return response.data;
    },

    /**
     * Get request by ID
     */
    async getRequest(id) {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },

    /**
     * Update request (analyst)
     */
    async updateRequest(id, data) {
        const response = await api.patch(`/requests/${id}`, data);
        return response.data;
    },

    /**
     * Analyst acknowledges sample receipt
     */
    async sampleReceived(id) {
        const response = await api.post(`/requests/${id}/sample-received`);
        return response.data;
    },

    /**
     * Update request (chemist - own requests)
     */
    async updateRequestChemist(id, data) {
        const response = await api.patch(`/requests/${id}/chemist`, data);
        return response.data;
    },

    /**
     * Get all analysis types
     */
    async getAnalysisTypes() {
        const response = await api.get('/requests/analysis-types/');
        return response.data;
    },

    /**
     * Upload files to request
     */
    async uploadFiles(requestId, files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post(`/files/upload/${requestId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Download file
     */
    async downloadFile(fileId, fileName) {
        const response = await api.get(`/files/download/${fileId}`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    /**
     * Get files for request
     */
    async getRequestFiles(requestId) {
        const response = await api.get(`/files/request/${requestId}`);
        return response.data;
    },

    /**
     * Delete file
     */
    async deleteFile(fileId) {
        await api.delete(`/files/${fileId}`);
    }
};

export default requestService;
