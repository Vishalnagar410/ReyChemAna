/**
 * Admin Analytics Panel
 * Phase-C Step-3
 * - Fixes 422 (page_size capped)
 * - Client-side aggregation
 */

import { useEffect, useState } from 'react';
import requestService from '../../services/requestService';
import { REQUEST_STATUS } from '../../utils/constants';

export default function AnalyticsPanel() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await requestService.getRequests({
                page: 1,
                page_size: 100   // 🔑 FIXED
            });

            const counts = {
                total: data.requests.length,
                pending: 0,
                in_progress: 0,
                completed: 0
            };

            data.requests.forEach((r) => {
                if (r.status === REQUEST_STATUS.PENDING) counts.pending++;
                if (r.status === REQUEST_STATUS.IN_PROGRESS) counts.in_progress++;
                if (r.status === REQUEST_STATUS.COMPLETED) counts.completed++;
            });

            setSummary(counts);
        } catch (error) {
            console.error('Analytics load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading analytics...</div>;
    }

    return (
        <div className="grid grid-4">
            <div className="card">
                <h3>Total Requests</h3>
                <strong>{summary.total}</strong>
            </div>
            <div className="card">
                <h3>Pending</h3>
                <strong>{summary.pending}</strong>
            </div>
            <div className="card">
                <h3>In Progress</h3>
                <strong>{summary.in_progress}</strong>
            </div>
            <div className="card">
                <h3>Completed</h3>
                <strong>{summary.completed}</strong>
            </div>
        </div>
    );
}
