import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const FacultyManagement = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employee_id: '',
        mobile: '',
        department: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        try {
            const data = await hodAPI.getFaculty();
            setFaculty(data);
        } catch (err) {
            setError('Failed to load faculty');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingFaculty) {
                await hodAPI.updateFaculty(editingFaculty.id, {
                    name: formData.name,
                    mobile: formData.mobile,
                    department: formData.department,
                });
                setSuccess('Faculty updated successfully');
            } else {
                await hodAPI.createFaculty(formData);
                setSuccess('Faculty created successfully');
            }

            loadFaculty();
            closeModal();
        } catch (err) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this faculty?')) return;

        try {
            await hodAPI.deleteFaculty(id);
            setSuccess('Faculty deleted successfully');
            loadFaculty();
        } catch (err) {
            setError(err.message || 'Failed to delete faculty');
        }
    };

    const openModal = (facultyMember = null) => {
        if (facultyMember) {
            setEditingFaculty(facultyMember);
            setFormData({
                name: facultyMember.name,
                email: facultyMember.email,
                password: '',
                employee_id: facultyMember.employee_id,
                mobile: facultyMember.mobile || '',
                department: facultyMember.department || '',
            });
        } else {
            setEditingFaculty(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                employee_id: '',
                mobile: '',
                department: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFaculty(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            employee_id: '',
            mobile: '',
            department: '',
        });
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
                <p>Loading faculty...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Faculty Management</h1>
                    <p>Manage faculty members in your department</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Faculty
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Employee ID</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.length > 0 ? (
                            faculty.map((f) => (
                                <tr key={f.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">{f.name.charAt(0)}</div>
                                            <span>{f.name}</span>
                                        </div>
                                    </td>
                                    <td>{f.employee_id}</td>
                                    <td>{f.email}</td>
                                    <td>{f.mobile || '-'}</td>
                                    <td>{f.department || '-'}</td>
                                    <td>
                                        <span className={`badge ${f.availability_status ? 'badge-success' : 'badge-error'}`}>
                                            {f.availability_status ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-icon btn-secondary"
                                                onClick={() => openModal(f)}
                                                title="Edit"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-icon btn-danger"
                                                onClick={() => handleDelete(f.id)}
                                                title="Delete"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-muted">
                                    No faculty members found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                            <button className="btn btn-icon" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Employee ID *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                            required
                                            disabled={!!editingFaculty}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={!!editingFaculty}
                                        />
                                    </div>
                                    {!editingFaculty && (
                                        <div className="form-group">
                                            <label className="form-label">Password *</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!editingFaculty}
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Mobile</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingFaculty ? 'Update' : 'Create'} Faculty
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyManagement;
