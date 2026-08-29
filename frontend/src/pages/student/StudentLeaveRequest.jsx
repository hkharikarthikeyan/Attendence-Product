import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const StudentLeaveRequest = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        leave_type: 'od',
        from_date: '',
        to_date: '',
        reason: ''
    });

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            const data = await studentAPI.getLeaves();
            setLeaves(data.leaves || []);
        } catch (err) {
            setError(err.message || 'Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.from_date || !formData.to_date || !formData.reason.trim()) {
            setError('Please complete all required fields.');
            return;
        }

        try {
            await studentAPI.applyLeave(formData);
            setSuccess('Leave request submitted successfully');
            setFormData({ leave_type: 'od', from_date: '', to_date: '', reason: '' });
            await loadLeaves();
        } catch (err) {
            setError(err.message || 'Failed to submit leave request');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'badge-success';
            case 'rejected':
                return 'badge-danger';
            case 'pending_hod':
                return 'badge-warning';
            case 'pending_faculty':
            default:
                return 'badge-info';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending_faculty':
                return 'Pending Faculty';
            case 'pending_hod':
                return 'Pending HOD';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return status || 'Pending';
        }
    };

    const getStageProgress = (status) => {
        if (status === 'approved') return 3;
        if (status === 'pending_hod') return 2;
        if (status === 'pending_faculty') return 1;
        if (status === 'rejected') return 0;
        return 0;
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
                    <p>Submit a leave request and track it through faculty and HOD approval.</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3>Request Leave</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Leave Type *</label>
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
                                    <option value="casual">Casual</option>
                                    <option value="sick">Sick</option>
                                </select>
                            </div>
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

                        <div className="modal-footer" style={{ padding: 0, marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Submit Request</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Request Tracking</h3>
                </div>
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
                                        <th>Leave Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Tracking</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave.id}>
                                            <td><span className="badge badge-info">{leave.leave_type}</span></td>
                                            <td>{leave.from_date ? new Date(leave.from_date).toLocaleDateString() : '-'}</td>
                                            <td>{leave.to_date ? new Date(leave.to_date).toLocaleDateString() : '-'}</td>
                                            <td>{leave.reason}</td>
                                            <td><span className={`badge ${getStatusColor(leave.status)}`}>{getStatusLabel(leave.status)}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                    {['Faculty', 'HOD', 'Approved'].map((step, idx) => {
                                                        const progress = getStageProgress(leave.status);
                                                        const active = progress >= idx + 1 || (leave.status === 'approved' && idx === 2);
                                                        return (
                                                            <span
                                                                key={step}
                                                                className={`badge ${active ? 'badge-success' : 'badge-secondary'}`}
                                                                style={{ opacity: active ? 1 : 0.55 }}
                                                            >
                                                                {step}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
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
        </div>
    );
};

export default StudentLeaveRequest;
