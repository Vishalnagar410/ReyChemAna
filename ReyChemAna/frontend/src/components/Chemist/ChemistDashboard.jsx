/**
 * Chemist Dashboard - main view for chemists
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import StatusBadge from '../Common/StatusBadge';
import requestService from '../../services/requestService';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';

export default function ChemistDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await requestService.getRequests({ page: 1, page_size: 50 });
            setRequests(data.requests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div>
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <h1>My Analysis Requests</h1>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/chemist/create-request')}
                    >
                        + New Request
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <p>No requests found. Create your first analysis request!</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/chemist/create-request')}
                        >
                            Create Request
                        </button>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Request #</th>
                                    <th>Compound</th>
                                    <th>Analysis Types</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Analyst</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr
                                        key={request.id}
                                        onClick={() => navigate(`/chemist/request/${request.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td><strong>{request.request_number}</strong></td>
                                        <td>{request.compound_name}</td>
                                        <td>
                                            {request.analysis_types.map(at => at.code).join(', ')}
                                        </td>
                                        <td>
                                            <span style={{
                                                color: PRIORITY_COLORS[request.priority],
                                                fontWeight: '500'
                                            }}>
                                                {PRIORITY_LABELS[request.priority]}
                                            </span>
                                        </td>
                                        <td>{formatDate(request.due_date)}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td>{request.analyst_name || '-'}</td>
                                        <td>{formatDate(request.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
