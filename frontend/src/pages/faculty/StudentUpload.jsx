import { useState, useEffect, useRef } from 'react';
import { facultyAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const ViewIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const StudentUpload = () => {
    const [classYear, setClassYear] = useState('');
    const [section, setSection] = useState('');
    const [batch, setBatch] = useState('');
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [viewBatch, setViewBatch] = useState(null);
    const [editStudent, setEditStudent] = useState(null);
    const fileInputRef = useRef(null);

    // Load batches on mount
    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            const data = await facultyAPI.getBatches();
            setBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        }
    };

    const loadStudentsByBatch = async (batchInfo) => {
        setLoading(true);
        try {
            const data = await facultyAPI.getStudentsByBatch(
                batchInfo.class_year,
                batchInfo.section,
                batchInfo.batch
            );
            setStudents(data.students || []);
            setViewBatch(batchInfo);
        } catch (err) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
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

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !classYear || !section || !batch) {
            setError('Please fill all fields and select a file');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await facultyAPI.uploadStudents(file, classYear, section, batch);
            setSuccess(`Successfully uploaded ${result.count} students to batch "${batch}"`);
            setFile(null);
            setBatch('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadBatches();
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student?')) return;
        try {
            await facultyAPI.deleteStudent(studentId);
            setStudents(students.filter(s => s.id !== studentId));
            loadBatches();
        } catch (err) {
            setError('Failed to delete student');
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (!editStudent) return;

        setLoading(true);
        try {
            await facultyAPI.updateStudent(editStudent.id, {
                name: editStudent.name,
                register_number: editStudent.register_number,
                roll_number: editStudent.roll_number,
                mobile: editStudent.mobile,
                father_name: editStudent.father_name,
                mother_name: editStudent.mother_name
            });
            setSuccess('Student updated successfully');
            setEditStudent(null);
            if (viewBatch) loadStudentsByBatch(viewBatch);
        } catch (err) {
            setError('Failed to update student');
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

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Student Upload</h1>
                    <p>Upload student data from Excel files and manage batches</p>
                </div>
                <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
                    <DownloadIcon /> Download Template
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="management-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Upload Section */}
                <div className="card">
                    <div className="card-header"><h3>Upload Students</h3></div>
                    <div className="card-body">
                        <form onSubmit={handleUpload}>
                            <div className="filters-bar" style={{ marginBottom: '1rem' }}>
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

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Batch Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                    placeholder="e.g., 2024 Batch A, Morning Batch"
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
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: dragActive ? 'var(--accent-light)' : file ? 'var(--success-light)' : 'var(--surface)',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '1rem'
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <UploadIcon style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
                                </div>
                                {file ? (
                                    <p style={{ color: 'var(--success)', fontWeight: 500 }}>
                                        📄 {file.name}
                                    </p>
                                ) : (
                                    <>
                                        <p style={{ fontWeight: 500 }}>Drag & drop Excel file here</p>
                                        <p className="text-muted">or click to browse</p>
                                    </>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading || !file} style={{ width: '100%' }}>
                                {loading ? 'Uploading...' : 'Upload Students'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Batches Section */}
                <div className="card">
                    <div className="card-header"><h3>Existing Batches</h3></div>
                    <div className="card-body">
                        {batches.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Batch</th>
                                            <th>Class</th>
                                            <th>Section</th>
                                            <th>Students</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batches.map((b, i) => (
                                            <tr key={i}>
                                                <td><strong>{b.batch}</strong></td>
                                                <td>{b.class_year}</td>
                                                <td>{b.section}</td>
                                                <td>{b.count}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => loadStudentsByBatch(b)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                    >
                                                        <ViewIcon /> View Students
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted text-center">No batches found. Upload students to create batches.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Students Table */}
            {viewBatch && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Students - {viewBatch.batch} ({viewBatch.class_year} - {viewBatch.section})</h3>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setViewBatch(null); setStudents([]); }}>
                            Close
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="loading-container"><div className="spinner"></div></div>
                        ) : students.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Register No</th>
                                            <th>Mobile</th>
                                            <th>Father</th>
                                            <th>Mother</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => (
                                            <tr key={s.id}>
                                                <td>{s.roll_number}</td>
                                                <td>{s.name}</td>
                                                <td>{s.register_number}</td>
                                                <td>{s.mobile || '-'}</td>
                                                <td>{s.father_name || '-'}</td>
                                                <td>{s.mother_name || '-'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => setEditStudent(s)}>
                                                            <EditIcon />
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStudent(s.id)}>
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted text-center">No students in this batch</p>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editStudent && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal card" style={{ width: '500px', maxWidth: '90%' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3>Edit Student</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditStudent(null)}>✕</button>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdateStudent}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input type="text" className="form-input" value={editStudent.name}
                                        onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Register Number</label>
                                    <input type="text" className="form-input" value={editStudent.register_number}
                                        onChange={(e) => setEditStudent({ ...editStudent, register_number: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Roll Number</label>
                                    <input type="text" className="form-input" value={editStudent.roll_number}
                                        onChange={(e) => setEditStudent({ ...editStudent, roll_number: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mobile</label>
                                    <input type="text" className="form-input" value={editStudent.mobile || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, mobile: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Father Name</label>
                                    <input type="text" className="form-input" value={editStudent.father_name || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, father_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mother Name</label>
                                    <input type="text" className="form-input" value={editStudent.mother_name || ''}
                                        onChange={(e) => setEditStudent({ ...editStudent, mother_name: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditStudent(null)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentUpload;
