import { useEffect, useState } from 'react';
import adminAnalyticsService from '../../services/adminAnalyticsService';

export default function AnalyticsPanel() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const [filters, setFilters] = useState({
        period: 'monthly',
        status: 'all',
        chemist_id: 'all',
        analyst_id: 'all'
    });

    useEffect(() => {
        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await adminAnalyticsService.getAnalytics(filters);
            setStats(data);
        } catch (error) {
            console.error('Analytics load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="text-muted">No analytics data available.</div>;
    }

    return (
        <div>
            {/* Filters */}
            <div className="filters" style={{ marginBottom: '1.5rem' }}>
                <select
                    value={filters.period}
                    onChange={(e) =>
                        setFilters({ ...filters, period: e.target.value })
                    }
                >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                    }
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h4>Total Requests</h4>
                    <strong>{stats.total_requests}</strong>
                </div>
                <div className="card">
                    <h4>Pending</h4>
                    <strong>{stats.pending}</strong>
                </div>
                <div className="card">
                    <h4>In Progress</h4>
                    <strong>{stats.in_progress}</strong>
                </div>
                <div className="card">
                    <h4>Completed</h4>
                    <strong>{stats.completed}</strong>
                </div>
            </div>

            {/* Placeholder for charts */}
            <div className="card">
                <p style={{ color: '#6b7280' }}>
                    📊 Visual charts (donut / trend) will be enabled next.
                </p>
            </div>
        </div>
    );
}
