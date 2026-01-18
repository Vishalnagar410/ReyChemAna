/**
 * RequestView Component
 * Read-only view of a request's details
 */
import {
    PRIORITY_LABELS,
    PRIORITY_COLORS,
    REQUEST_STATUS
} from '../../utils/constants';
import StatusBadge from './StatusBadge';
import requestService from '../../services/requestService';

export default function RequestView({ request }) {
    if (!request) return null;

    const handleDownload = async (file) => {
        try {
            await requestService.downloadFile(file.id, file.filename);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
        }
    };

    return (
        <div className="request-view">
            <div className="card-header">
                <div className="header-content">
                    <h1>{request.request_number}</h1>
                    <StatusBadge status={request.status} />
                </div>
                <div className="meta-info">
                    <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                    <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="details-grid">
                    <div className="detail-group">
                        <label>Compound Name</label>
                        <p>{request.compound_name}</p>
                    </div>

                    <div className="detail-group">
                        <label>Priority</label>
                        <span style={{
                            color: PRIORITY_COLORS[request.priority],
                            fontWeight: 'bold'
                        }}>
                            {PRIORITY_LABELS[request.priority]}
                        </span>
                    </div>

                    <div className="detail-group">
                        <label>Analysis Types</label>
                        <div className="tags">
                            {request.analysis_types.map(at => (
                                <span key={at.id} className="tag">{at.code}</span>
                            ))}
                        </div>
                    </div>

                    <div className="detail-group">
                        <label>Chemist</label>
                        <p>{request.chemist_name}</p>
                    </div>

                    <div className="detail-group">
                        <label>Assigned Analyst</label>
                        <p>{request.analyst_name || 'Unassigned'}</p>
                    </div>
                </div>

                <div className="description-section mt-4">
                    <label>Description</label>
                    <p>{request.description || 'No description provided.'}</p>
                </div>

                {request.chemist_comments && (
                    <div className="comments-section mt-4">
                        <label>Chemist Comments</label>
                        <p>{request.chemist_comments}</p>
                    </div>
                )}
                {request.analyst_comments && (
                    <div className="comments-section mt-4">
                        <label>Analyst Comments</label>
                        <p>{request.analyst_comments}</p>
                    </div>
                )}

                <hr className="divider" />

                {/* Result Section */}
                <div className="results-section mt-6">
                    <h2>Results &amp; Files</h2>

                    {/* File List (Read-Only) */}
                    {request.result_files && request.result_files.length > 0 ? (
                        <div className="file-list">
                            {request.result_files.map(file => (
                                <div key={file.id} className="file-item">
                                    <span className="file-name">{file.filename}</span>
                                    <span className="file-size">({(file.file_size / 1024).toFixed(1)} KB)</span>
                                    <button
                                        className="btn-sm btn-outline"
                                        onClick={() => handleDownload(file)}
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No results uploaded yet.</p>
                    )}

                    {/* Completion Message */}
                    {request.status === REQUEST_STATUS.COMPLETED && request.completed_at && (
                        <div className="completion-info mt-4">
                            <p className="text-success">
                                ✓ Request completed on {new Date(request.completed_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
