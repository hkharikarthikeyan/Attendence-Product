import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const LeaveApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadLeaves();
        const interval = setInterval(loadLeaves, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadLeaves = async () => {
        try {
            const data = await hodAPI.getFacultyLeaves();
            setLeaves(data.requests || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to load leave requests');
            setLoading(false);
        }
    };

    const handleApproval = async (id, status) => {
        try {
            await hodAPI.updateLeaveStatus(id, { status });
            setSuccess(`Leave request ${status}`);
            loadLeaves();
        } catch (err) {
            setError(err.message || 'Failed to update leave status');
        }
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading leave requests...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Leave Approvals</h1>
                    <p>Manage faculty leave requests</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-body">
                    {leaves.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Faculty Name</th>
                                        <th>Leave Type</th>
                                        <th>From Date</th>
                                        <th>To Date</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((leave) => (
                                        <tr key={leave.id}>
                                            <td>{leave.faculty?.name || leave.name || 'N/A'}</td>
                                            <td><span className="badge badge-info">{leave.leave_type}</span></td>
                                            <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                            <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                            <td>{leave.reason}</td>
                                            <td><span className={`badge ${getStatusColor(leave.status)}`}>{leave.status}</span></td>
                                            <td>
                                                {leave.status === 'pending' && (
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-icon btn-success"
                                                            onClick={() => handleApproval(leave.id, 'approved')}
                                                            title="Approve"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="btn btn-icon btn-danger"
                                                            onClick={() => handleApproval(leave.id, 'rejected')}
                                                            title="Reject"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center">No leave requests</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveApproval;