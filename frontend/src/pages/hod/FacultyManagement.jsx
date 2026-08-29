import { useState, useEffect } from 'react';
import { hodAPI } from '../../services/api';
import './FacultyManagement.css';

const FacultyManagement = () => {
    const [faculty, setFaculty] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showAdvisorFields, setShowAdvisorFields] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState({
        faculty_id: '',
        class_year: '1st Year',
        section: 'A',
    });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employee_id: '',
        mobile: '',
        department: '',
        class_year: '1st Year',
        section: 'A',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const advisorMap = assignments.reduce((acc, item) => {
        if (item.faculty_id) {
            acc[item.faculty_id] = item;
        }
        return acc;
    }, {});

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        try {
            const [facultyData, advisorData] = await Promise.all([
                hodAPI.getFaculty(),
                hodAPI.getClassAdvisors(),
            ]);
            setFaculty(facultyData || []);
            setAssignments(advisorData?.assignments || []);
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
                const payload = {
                    name: formData.name,
                    mobile: formData.mobile,
                    employee_id: formData.employee_id,
                    department: formData.department,
                };

                if (formData.password && formData.password.trim()) {
                    payload.password = formData.password.trim();
                }

                await hodAPI.updateFaculty(editingFaculty.id, payload);

                if (showAdvisorFields) {
                    await hodAPI.assignClassAdvisor({
                        faculty_id: editingFaculty.id,
                        class_year: formData.class_year || '1st Year',
                        section: formData.section || 'A',
                    });
                    setSuccess('Faculty and class advisor updated successfully');
                } else {
                    setSuccess('Faculty updated successfully');
                }
            } else {
                await hodAPI.createFaculty(formData);
                if (showAdvisorFields) {
                    const createdFaculty = await hodAPI.getFaculty();
                    const created = createdFaculty.find((member) => member.email === formData.email && member.employee_id === formData.employee_id);
                    if (created) {
                        await hodAPI.assignClassAdvisor({
                            faculty_id: created.id,
                            class_year: formData.class_year || '1st Year',
                            section: formData.section || 'A',
                        });
                    }
                }
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

    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        if (!assignmentForm.faculty_id) {
            setError('Please select a faculty member');
            return;
        }

        try {
            await hodAPI.assignClassAdvisor(assignmentForm);
            setSuccess('Class advisor assigned successfully');
            setShowAssignmentModal(false);
            setAssignmentForm({ faculty_id: '', class_year: '1st Year', section: 'A' });
            loadFaculty();
        } catch (err) {
            setError(err.message || 'Failed to assign class advisor');
        }
    };

    const handleDeleteAssignment = async (classYear, section) => {
        try {
            await hodAPI.deleteClassAdvisor(classYear, section);
            setSuccess('Class advisor assignment removed');
            loadFaculty();
        } catch (err) {
            setError(err.message || 'Failed to remove assignment');
        }
    };

    const openModal = (facultyMember = null) => {
        if (facultyMember) {
            setEditingFaculty(facultyMember);
            const existingAssignment = assignments.find((assignment) => assignment.faculty_id === facultyMember.id);
            setShowAdvisorFields(Boolean(existingAssignment));
            setFormData({
                name: facultyMember.name,
                email: facultyMember.email,
                password: '',
                employee_id: facultyMember.employee_id,
                mobile: facultyMember.mobile || '',
                department: facultyMember.department || '',
                class_year: existingAssignment?.class_year || '1st Year',
                section: existingAssignment?.section || 'A',
            });
        } else {
            setEditingFaculty(null);
            setShowAdvisorFields(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                employee_id: '',
                mobile: '',
                department: '',
                class_year: '1st Year',
                section: 'A',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFaculty(null);
        setShowAdvisorFields(false);
        setFormData({
            name: '',
            email: '',
            password: '',
            employee_id: '',
            mobile: '',
            department: '',
            class_year: '1st Year',
            section: 'A',
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
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Faculty
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowAssignmentModal(true)}>
                        Assign Class Advisor
                    </button>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header"><h3>Class Advisor Assignments</h3></div>
                <div className="card-body">
                    {assignments.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Faculty</th>
                                        <th>Year</th>
                                        <th>Section</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((item) => (
                                        <tr key={`${item.class_year}-${item.section}`}>
                                            <td>{item.faculty?.name || 'Faculty'}</td>
                                            <td>{item.class_year}</td>
                                            <td>{item.section}</td>
                                            <td>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAssignment(item.class_year, item.section)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center">No class advisor assignments yet</p>
                    )}
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Employee ID</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Department</th>
                            <th>Class Advisor</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.length > 0 ? (
                            faculty.map((f) => {
                                const assignedClass = advisorMap[f.id];
                                return (
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
                                            {assignedClass ? (
                                                <span className="badge badge-success">
                                                    {assignedClass.class_year} / {assignedClass.section}
                                                </span>
                                            ) : (
                                                <span className="text-muted">Not assigned</span>
                                            )}
                                        </td>
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
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center text-muted">
                                    No faculty members found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showAssignmentModal && (
                <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assign Class Advisor</h3>
                            <button className="btn btn-icon" onClick={() => setShowAssignmentModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAssignmentSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Faculty</label>
                                        <select
                                            className="form-input"
                                            value={assignmentForm.faculty_id}
                                            onChange={(e) => setAssignmentForm({ ...assignmentForm, faculty_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select faculty</option>
                                            {faculty.map((member) => (
                                                <option key={member.id} value={member.id}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Year</label>
                                        <select
                                            className="form-input"
                                            value={assignmentForm.class_year}
                                            onChange={(e) => setAssignmentForm({ ...assignmentForm, class_year: e.target.value })}
                                        >
                                            <option value="1st Year">1</option>
                                            <option value="2nd Year">2</option>
                                            <option value="3rd Year">3</option>
                                            <option value="4th Year">4</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section</label>
                                        <select
                                            className="form-input"
                                            value={assignmentForm.section}
                                            onChange={(e) => setAssignmentForm({ ...assignmentForm, section: e.target.value })}
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    <div className="form-group">
                                        <label className="form-label">
                                            {editingFaculty ? 'Update Password (optional)' : 'Password *'}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingFaculty}
                                            placeholder={editingFaculty ? 'Leave blank to keep current password' : 'Enter password'}
                                        />
                                    </div>
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
                                    {showAdvisorFields && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Class Advisor - Year</label>
                                                <select
                                                    className="form-input"
                                                    value={formData.class_year}
                                                    onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}
                                                >
                                                    <option value="1st Year">1</option>
                                                    <option value="2nd Year">2</option>
                                                    <option value="3rd Year">3</option>
                                                    <option value="4th Year">4</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Class Advisor - Section</label>
                                                <select
                                                    className="form-input"
                                                    value={formData.section}
                                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                                >
                                                    <option value="A">A</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                                {editingFaculty && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAdvisorFields((prev) => !prev)}
                                    >
                                        {showAdvisorFields ? 'Hide Advisor' : 'Assign Advisor'}
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingFaculty ? 'Update' : 'Create'} Faculty
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyManagement;
