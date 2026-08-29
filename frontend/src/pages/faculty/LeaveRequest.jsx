import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const LeaveRequest = () => {
    const [activeTab, setActiveTab] = useState('faculty');
    const [leaves, setLeaves] = useState([]);
    const [studentLeaves, setStudentLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [studentLoading, setStudentLoading] = useState(false);
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
        loadStudentLeaves();
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

    const loadStudentLeaves = async () => {
        setStudentLoading(true);
        try {
            const data = await facultyAPI.getStudentLeaves();
            setStudentLeaves(data.requests || []);
        } catch (err) {
            console.error('Failed to load student leave requests:', err);
        } finally {
            setStudentLoading(false);
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

    const handleStudentApproval = async (id, status) => {
        try {
            await facultyAPI.updateStudentLeave(id, status);
            setSuccess(`Student leave request ${status}`);
            loadStudentLeaves();
        } catch (err) {
            setError(err.message || 'Failed to update student leave request');
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
            case 'pending_hod': return 'badge-warning';
            case 'pending_faculty': return 'badge-info';
            default: return 'badge-warning';
        }
    };

    const getStudentStatusLabel = (status) => {
        switch (status) {
            case 'pending_faculty': return 'Pending Faculty';
            case 'pending_hod': return 'Pending HOD';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return status || 'Pending';
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
                    <p>Manage your leave and review student requests</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${activeTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('faculty')}
                        >
                            Faculty Leave Request
                        </button>
                        <button
                            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('students')}
                        >
                            Student Approval
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'faculty' && (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Apply for Leave</h3>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Apply Leave
                            </button>
                        </div>
                    </div>

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
                                                    <td>{leave.name || leave.user_name || formData.name || 'N/A'}</td>
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
                </>
            )}

            {activeTab === 'students' && (
                <div className="card">
                    <div className="card-body">
                        {studentLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : studentLeaves.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Class</th>
                                            <th>Leave Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentLeaves.map((leave) => (
                                            <tr key={leave.id}>
                                                <td>{leave.students?.[0]?.name || leave.name || 'N/A'}</td>
                                                <td>{leave.students?.[0]?.class_year || '-'} / {leave.students?.[0]?.section || '-'}</td>
                                                <td><span className="badge badge-info">{leave.leave_type}</span></td>
                                                <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                                                <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                                                <td>{leave.reason}</td>
                                                <td><span className={`badge ${getStatusColor(leave.status)}`}>{getStudentStatusLabel(leave.status)}</span></td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn btn-icon btn-success"
                                                            onClick={() => handleStudentApproval(leave.id, 'approved')}
                                                            title="Approve"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="btn btn-icon btn-danger"
                                                            onClick={() => handleStudentApproval(leave.id, 'rejected')}
                                                            title="Reject"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280' }}>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
                                    No student leave requests pending approval.
                                </p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                                    When students submit leave requests, they will appear here for review.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                                        <option value="casual">Casual</option>
                                        <option value="sick">Sick</option>
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