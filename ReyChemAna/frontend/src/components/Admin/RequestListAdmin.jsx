import { useEffect, useState } from 'react';
import requestService from '../../services/requestService';
import { REQUEST_STATUS, STATUS_LABELS } from '../../utils/constants';

export default function RequestListAdmin() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: 'all',
        page: 1,
        page_size: 50
    });

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                page_size: filters.page_size
            };

            if (filters.status !== 'all') {
                params.status = filters.status;
            }

            const data = await requestService.getRequests(params);
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Failed to load admin requests', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Filters */}
            <div className="filters" style={{ marginBottom: '1rem' }}>
                <select
                    value={filters.status}
                    onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value, page: 1 })
                    }
                >
                    <option value="all">All Status</option>
                    {Object.values(REQUEST_STATUS).map((status) => (
                        <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading">Loading requests...</div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Request No</th>
                                <th>Compound</th>
                                <th>Chemist</th>
                                <th>Analyst</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => (
                                <tr key={r.id}>
                                    <td>{r.request_number}</td>
                                    <td>{r.compound_name}</td>
                                    <td>{r.chemist_name || '-'}</td>
                                    <td>{r.analyst_name || '-'}</td>
                                    <td>
                                        <span className={`status-${r.status}`}>
                                            {STATUS_LABELS[r.status]}
                                        </span>
                                    </td>
                                    <td>
                                        {r.due_date
                                            ? new Date(r.due_date).toLocaleDateString()
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
