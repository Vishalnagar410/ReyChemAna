/**
 * RequestDetailsModal
 * FINAL (Option 1)
 * Results-only modal for Chemist & Analyst
 */
import { useEffect, useState } from 'react';
import requestService from '../../services/requestService';
import './RequestDetailsModal.css';

export default function RequestDetailsModal({ requestId, onClose }) {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (requestId) {
            loadRequest();
            setTimeout(() => setVisible(true), 10);
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [requestId]);

    const loadRequest = async () => {
        try {
            setLoading(true);
            const data = await requestService.getRequest(requestId);
            setRequest(data);
        } catch (err) {
            console.error('Failed to load results', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            await requestService.downloadFile(file.id, file.file_name);
        } catch (err) {
            alert('Download failed');
        }
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 200);
    };

    if (!requestId) return null;

    return (
        <div className="modal-backdrop">
            <div className={`modal-card ${visible ? 'modal-show' : ''}`}>

                <div className="modal-header">
                    <h3>Results & Files</h3>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading && <div className="loading">Loading results…</div>}

                    {!loading && request && (
                        <>
                            {/* Analyst Comments */}
                            {request.analyst_comments && (
                                <div className="comments-section">
                                    <label>Analyst Comments</label>
                                    <p>{request.analyst_comments}</p>
                                </div>
                            )}

                            <hr className="divider" />

                            {/* Result Files */}
                            {request.result_files?.length > 0 ? (
                                <div className="file-list">
                                    {request.result_files.map(file => (
                                        <div key={file.id} className="file-item">
                                            <span className="file-name">
                                                {file.file_name}
                                            </span>
                                            <button
                                                className="btn-outline-sm"
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

                            {/* Completion Info */}
                            {request.completed_at && (
                                <div className="completion-info">
                                    ✓ Completed on{' '}
                                    {new Date(request.completed_at).toLocaleDateString()}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
