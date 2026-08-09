import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const LeaveRequest = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        reason: '',
        from_date: '',
        to_date: '',
        leave_type: 'od'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadLeaves();
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await facultyAPI.getProfile();
            setFormData(prev => ({ ...prev, name: profile.name }));
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await facultyAPI.getLeaves();
            setLeaves(data.requests || []);
        } catch (err) {
            console.error('Failed to load leaves:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await facultyAPI.applyLeave(formData);
            setSuccess('Leave request submitted successfully');
            loadLeaves();
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to submit leave request');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        loadProfile();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'badge-success';
            case 'rejected': return 'badge-danger';
            default: return 'badge-warning';
        }
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Leave Requests</h1>
                    <p>Apply for leave and track your requests</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Apply Leave
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : leaves.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Leave Type</th>
                                        <th>From Date</th>
                                        <th>To Date</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave.id}>
                                            <td>{leave.name || 'N/A'}</td>
                                            <td><span className="badge badge-info">{leave.leave_type}</span></td>
                                            <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                            <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                            <td>{leave.reason}</td>
                                            <td><span className={`badge ${getStatusColor(leave.status)}`}>{leave.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center">No leave requests yet</p>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Apply for Leave</h3>
                            <button className="btn btn-icon" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type of Leave *</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.leave_type}
                                        onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                        required
                                    >
                                        <option value="od">OD (On Duty)</option>
                                        <option value="medical">Medical</option>
                                        <option value="personal">Personal</option>
                                        <option value="permission">Permission</option>
                                    </select>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">From Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.from_date}
                                            onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">To Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.to_date}
                                            onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason *</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveRequest;