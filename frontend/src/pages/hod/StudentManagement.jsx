import { useState, useEffect, useRef } from 'react';
import { hodAPI, facultyAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './FacultyManagement.css';

const StudentManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [filters, setFilters] = useState({ class_year: '', section: '', batch: '' });
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', register_number: '',
        roll_number: '', mobile: '', father_name: '', mother_name: '',
        class_year: '', section: '', batch: '',
    });
    
    // Bulk upload states
    const [classYear, setClassYear] = useState('');
    const [section, setSection] = useState('');
    const [batch, setBatch] = useState('');
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);

    useEffect(() => { loadStudents(); }, [filters]);

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            const data = await hodAPI.getBatches();
            setAvailableBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        }
    };

    const loadStudents = async () => {
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v)
            );
            const data = await hodAPI.getStudents(activeFilters);
            setStudents(data.students || data);
            setSelectedStudentIds([]);
        } catch (err) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = [...students].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        const aValue = a[sortConfig.key].toString().toLowerCase();
        const bValue = b[sortConfig.key].toString().toLowerCase();

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const viewStudent = (student) => {
        setViewingStudent(student);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setViewingStudent(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingStudent) {
                const updateData = {
                    email: formData.email.trim() || undefined,
                    name: formData.name, mobile: formData.mobile,
                    father_name: formData.father_name, mother_name: formData.mother_name,
                    class_year: formData.class_year, section: formData.section, batch: formData.batch,
                };
                await hodAPI.updateStudent(editingStudent.id, updateData);
                setSuccess('Student updated successfully');
            } else {
                await hodAPI.createStudent(formData);
                setSuccess('Student created successfully');
            }
            loadStudents();
            closeModal();
        } catch (err) {
            setError(err.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this student?')) return;
        try {
            await hodAPI.deleteStudent(id);
            setSuccess('Student deleted successfully');
            loadStudents();
        } catch (err) {
            setError(err.message || 'Failed to delete student');
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === sortedStudents.length && sortedStudents.length > 0) {
            setSelectedStudentIds([]);
            return;
        }
        setSelectedStudentIds(sortedStudents.map((student) => student.id));
    };

    const handleDeleteSelected = async () => {
        if (selectedStudentIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedStudentIds.length} selected student(s)?`)) return;

        try {
            await Promise.all(selectedStudentIds.map((id) => hodAPI.deleteStudent(id)));
            setSelectedStudentIds([]);
            setSuccess('Selected students deleted successfully');
            loadStudents();
        } catch (err) {
            setError(err.message || 'Failed to delete selected students');
        }
    };

    const openModal = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({ ...student, password: '' });
        } else {
            setEditingStudent(null);
            setFormData({
                name: '', email: '', password: '', register_number: '',
                roll_number: '', mobile: '', father_name: '', mother_name: '',
                class_year: '', section: '', batch: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
    };

    const closeBulkModal = () => {
        setShowBulkModal(false);
        setFile(null);
        setClassYear('');
        setSection('');
        setBatch('');
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
                setError('');
            } else {
                setError('Please upload an Excel file (.xlsx or .xls)');
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await facultyAPI.downloadStudentTemplate();
        } catch (err) {
            setError('Failed to download template');
        }
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!file || !classYear || !section || !batch) {
            setError('Please fill all fields and select a file');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await facultyAPI.uploadStudents(file, classYear, section, batch);
            setSuccess(`Successfully uploaded ${result.count} students`);
            closeBulkModal();
            loadStudents();
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
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
                <p>Loading students...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Student Management</h1>
                    <p>Manage students in your department</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Student
                </button>
                {selectedStudentIds.length > 0 && (
                    <button className="btn btn-danger" onClick={handleDeleteSelected}>
                        Delete Selected ({selectedStudentIds.length})
                    </button>
                )}
                <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Bulk Excel Import
                </button>
                <button className="btn btn-info" onClick={() => navigate('/hod/attendance')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 1 1 4 0v2M9 11h6" />
                    </svg>
                    View Attendance
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="filters-bar">
                <div className="form-group">
                    <label className="form-label">Class/Year</label>
                    <select
                        className="form-input form-select"
                        value={filters.class_year}
                        onChange={(e) => setFilters({ ...filters, class_year: e.target.value })}
                    >
                        <option value="">All</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Section</label>
                    <select
                        className="form-input form-select"
                        value={filters.section}
                        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                    >
                        <option value="">All</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select
                        className="form-input form-select"
                        value={filters.batch}
                        onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                    >
                        <option value="">All Batches</option>
                        {availableBatches.map((b) => (
                            <option key={b.batch} value={b.batch}>
                                {b.batch} ({b.count} students)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    className="table-checkbox"
                                    checked={sortedStudents.length > 0 && selectedStudentIds.length === sortedStudents.length}
                                    onChange={handleSelectAll}
                                    aria-label="Select all students"
                                />
                            </th>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('register_number')} style={{ cursor: 'pointer' }}>
                                Register No {sortConfig.key === 'register_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('roll_number')} style={{ cursor: 'pointer' }}>
                                Roll No {sortConfig.key === 'roll_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('class_year')} style={{ cursor: 'pointer' }}>
                                Class {sortConfig.key === 'class_year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('section')} style={{ cursor: 'pointer' }}>
                                Section {sortConfig.key === 'section' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('batch')} style={{ cursor: 'pointer' }}>
                                Batch {sortConfig.key === 'batch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Mobile</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.length > 0 ? (
                            sortedStudents.map((s) => (
                                <tr key={s.id} className={selectedStudentIds.includes(s.id) ? 'row-selected' : ''}>
                                    <td className="checkbox-cell">
                                        <input
                                            type="checkbox"
                                            className="table-checkbox"
                                            checked={selectedStudentIds.includes(s.id)}
                                            onChange={() => toggleStudentSelection(s.id)}
                                            aria-label={`Select ${s.name}`}
                                        />
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">{s.name.charAt(0)}</div>
                                            <span>{s.name}</span>
                                        </div>
                                    </td>
                                    <td>{s.register_number}</td>
                                    <td>{s.roll_number}</td>
                                    <td>{s.class_year || '-'}</td>
                                    <td>{s.section || '-'}</td>
                                    <td>
                                        {s.batch ? (
                                            <span className="badge badge-info">{s.batch}</span>
                                        ) : '-'}
                                    </td>
                                    <td>{s.mobile || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-icon btn-info" onClick={() => viewStudent(s)} title="View">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            <button className="btn btn-icon btn-secondary" onClick={() => openModal(s)} title="Edit">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(s.id)} title="Delete">
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
                            <tr><td colSpan="9" className="text-center text-muted">No students found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                            <button className="btn btn-icon" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input type="text" className="form-input" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Register Number *</label>
                                        <input type="text" className="form-input" value={formData.register_number}
                                            onChange={(e) => setFormData({ ...formData, register_number: e.target.value })}
                                            required disabled={!!editingStudent} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Roll Number *</label>
                                        <input type="text" className="form-input" value={formData.roll_number}
                                            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className="form-input" value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required disabled={!!editingStudent} />
                                    </div>
                                    {!editingStudent && (
                                        <div className="form-group">
                                            <label className="form-label">Password *</label>
                                            <input type="password" className="form-input" value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Mobile</label>
                                        <input type="tel" className="form-input" value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Father's Name</label>
                                        <input type="text" className="form-input" value={formData.father_name}
                                            onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mother's Name</label>
                                        <input type="text" className="form-input" value={formData.mother_name}
                                            onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Class/Year</label>
                                        <select className="form-input form-select" value={formData.class_year}
                                            onChange={(e) => setFormData({ ...formData, class_year: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section</label>
                                        <select className="form-input form-select" value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Batch</label>
                                        <input type="text" className="form-input" value={formData.batch}
                                            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                            placeholder="e.g., 2024-2028" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingStudent ? 'Update' : 'Create'} Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showViewModal && viewingStudent && (
                <div className="modal-overlay" onClick={closeViewModal}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Student Details</h3>
                            <button className="btn btn-icon" onClick={closeViewModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="student-details">
                                <div className="detail-row">
                                    <span className="detail-label">Name:</span>
                                    <span className="detail-value">{viewingStudent.name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Register Number:</span>
                                    <span className="detail-value">{viewingStudent.register_number}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Roll Number:</span>
                                    <span className="detail-value">{viewingStudent.roll_number}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{viewingStudent.email || 'Not provided'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Mobile:</span>
                                    <span className="detail-value">{viewingStudent.mobile || 'Not provided'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Class/Year:</span>
                                    <span className="detail-value">{viewingStudent.class_year || 'Not assigned'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Section:</span>
                                    <span className="detail-value">{viewingStudent.section || 'Not assigned'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Batch:</span>
                                    <span className="detail-value">{viewingStudent.batch || 'Not assigned'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Father's Name:</span>
                                    <span className="detail-value">{viewingStudent.father_name || 'Not provided'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Mother's Name:</span>
                                    <span className="detail-value">{viewingStudent.mother_name || 'Not provided'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Created:</span>
                                    <span className="detail-value">{new Date(viewingStudent.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeViewModal}>Close</button>
                            <button className="btn btn-primary" onClick={() => { closeViewModal(); openModal(viewingStudent); }}>Edit Student</button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="modal-overlay" onClick={closeBulkModal}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Bulk Excel Import</h3>
                            <button className="btn btn-icon" onClick={closeBulkModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleBulkUpload}>
                            <div className="modal-body">
                                <div className="filters-bar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Class/Year *</label>
                                        <select className="form-input form-select" value={classYear}
                                            onChange={(e) => setClassYear(e.target.value)} required>
                                            <option value="">Select</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section *</label>
                                        <select className="form-input form-select" value={section}
                                            onChange={(e) => setSection(e.target.value)} required>
                                            <option value="">Select</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Batch Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={batch}
                                        onChange={(e) => setBatch(e.target.value)}
                                        placeholder="e.g., 2022-2026"
                                        required
                                    />
                                </div>

                                <div
                                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '2.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: dragActive ? '#f1f5f9' : file ? '#f0fdf4' : '#fff',
                                        transition: 'all 0.2s ease',
                                        marginBottom: '1.5rem'
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ width: '40px', height: '40px', margin: '0 auto' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    {file ? (
                                        <p style={{ color: '#16a34a', fontWeight: 600 }}>
                                            📄 {file.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p style={{ fontWeight: 600, color: '#334155' }}>Drag & drop Excel file here</p>
                                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>or click to browse</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download Template
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={closeBulkModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={!file}>Upload Excel</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
