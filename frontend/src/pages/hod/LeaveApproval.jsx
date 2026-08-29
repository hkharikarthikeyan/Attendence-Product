import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const LeaveApproval = () => {
    const [activeTab, setActiveTab] = useState('faculty');
    const [facultyLeaves, setFacultyLeaves] = useState([]);
    const [studentLeaves, setStudentLeaves] = useState([]);
    const [loadingFaculty, setLoadingFaculty] = useState(true);
    const [loadingStudent, setLoadingStudent] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadFacultyLeaves();
        loadStudentLeaves();
    }, []);

    const loadFacultyLeaves = async () => {
        try {
            const data = await hodAPI.getFacultyLeaves();
            setFacultyLeaves(data.requests || []);
        } catch (err) {
            setError('Failed to load faculty leave requests');
        } finally {
            setLoadingFaculty(false);
        }
    };

    const loadStudentLeaves = async () => {
        try {
            const data = await hodAPI.getStudentLeaves();
            setStudentLeaves(data.requests || []);
        } catch (err) {
            setError('Failed to load student leave requests');
        } finally {
            setLoadingStudent(false);
        }
    };

    const handleFacultyApproval = async (id, status) => {
        try {
            await hodAPI.updateLeaveStatus(id, { status });
            setSuccess(`Faculty leave request ${status}`);
            loadFacultyLeaves();
        } catch (err) {
            setError(err.message || 'Failed to update faculty leave status');
        }
    };

    const handleStudentApproval = async (id, status) => {
        try {
            await hodAPI.updateStudentLeaveStatus(id, { status });
            setSuccess(`Student leave request ${status}`);
            loadStudentLeaves();
        } catch (err) {
            setError(err.message || 'Failed to update student leave status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'badge-success';
            case 'rejected': return 'badge-danger';
            case 'pending_faculty': return 'badge-info';
            case 'pending_hod': return 'badge-warning';
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
                    <h1>Leave Approvals</h1>
                    <p>Review faculty and student leave requests</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${activeTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('faculty')}
                        >
                            Faculty Requests
                        </button>
                        <button
                            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('students')}
                        >
                            Student Requests
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'faculty' && (
                <div className="card">
                    <div className="card-body">
                        {loadingFaculty ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading faculty leave requests...</p>
                            </div>
                        ) : facultyLeaves.length > 0 ? (
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
                                        {facultyLeaves.map((leave) => (
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
                                                                onClick={() => handleFacultyApproval(leave.id, 'approved')}
                                                                title="Approve"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="btn btn-icon btn-danger"
                                                                onClick={() => handleFacultyApproval(leave.id, 'rejected')}
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
                            <p className="text-muted text-center">No faculty leave requests</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="card">
                    <div className="card-body">
                        {loadingStudent ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading student leave requests...</p>
                            </div>
                        ) : studentLeaves.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Class</th>
                                            <th>Leave Type</th>
                                            <th>From Date</th>
                                            <th>To Date</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Actions</th>
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
                                                    {leave.status === 'pending_hod' && (
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
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted text-center">No student leave requests</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveApproval;