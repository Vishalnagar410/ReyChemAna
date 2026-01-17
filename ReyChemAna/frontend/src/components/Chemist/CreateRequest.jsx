/**
 * Create Request form for chemists
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import requestService from '../../services/requestService';
import { PRIORITY } from '../../utils/constants';

export default function CreateRequest() {
    const [formData, setFormData] = useState({
        compound_name: '',
        analysis_type_ids: [],
        priority: 'medium',
        due_date: '',
        description: '',
        chemist_comments: ''
    });
    const [analysisTypes, setAnalysisTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadAnalysisTypes();
    }, []);

    const loadAnalysisTypes = async () => {
        try {
            const types = await requestService.getAnalysisTypes();
            setAnalysisTypes(types);
        } catch (error) {
            console.error('Error loading analysis types:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAnalysisTypeToggle = (typeId) => {
        setFormData(prev => ({
            ...prev,
            analysis_type_ids: prev.analysis_type_ids.includes(typeId)
                ? prev.analysis_type_ids.filter(id => id !== typeId)
                : [...prev.analysis_type_ids, typeId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.analysis_type_ids.length === 0) {
            setError('Please select at least one analysis type');
            return;
        }

        setLoading(true);

        try {
            await requestService.createRequest(formData);
            navigate('/chemist');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <h1>Create New Analysis Request</h1>
                </div>

                <form onSubmit={handleSubmit} className="form-card">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="compound_name">Compound Name *</label>
                        <input
                            type="text"
                            id="compound_name"
                            name="compound_name"
                            value={formData.compound_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Analysis Types * (Select at least one)</label>
                        <div className="checkbox-grid">
                            {analysisTypes.map(type => (
                                <label key={type.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.analysis_type_ids.includes(type.id)}
                                        onChange={() => handleAnalysisTypeToggle(type.id)}
                                    />
                                    <span>{type.code} - {type.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="priority">Priority *</label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                            >
                                <option value={PRIORITY.LOW}>Low</option>
                                <option value={PRIORITY.MEDIUM}>Medium</option>
                                <option value={PRIORITY.HIGH}>High</option>
                                <option value={PRIORITY.URGENT}>Urgent</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="due_date">Due Date *</label>
                            <input
                                type="date"
                                id="due_date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="chemist_comments">Chemist Comments</label>
                        <textarea
                            id="chemist_comments"
                            name="chemist_comments"
                            value={formData.chemist_comments}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/chemist')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
