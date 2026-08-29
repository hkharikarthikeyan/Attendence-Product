import { useEffect, useState } from 'react';
import { hodAPI, projectsAPI } from '../../services/api';
import './FacultyManagement.css';

const HODProjects = () => {
    const [facultyList, setFacultyList] = useState([]);
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [marksForm, setMarksForm] = useState({ phase_1_mark: 0, phase_2_mark: 0, phase_3_mark: 0, hod_comment: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        faculty_id: '',
        student_ids: []
    });

    const loadFaculty = async () => {
        try {
            const data = await hodAPI.getFaculty();
            setFacultyList(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load faculty');
        }
    };

    const loadStudents = async () => {
        try {
            const data = await hodAPI.getStudents();
            setStudents(data.students || data || []);
        } catch (err) {
            setError(err.message || 'Failed to load students');
        }
    };

    const loadProjects = async () => {
        try {
            const response = await projectsAPI.getProjects();
            const data = response.data || [];
            setProjects(data);
        } catch (err) {
            setError(err.message || 'Failed to load project allocations');
        }
    };

    useEffect(() => {
        loadFaculty();
        loadStudents();
        loadProjects();
        const intervalId = setInterval(() => {
            loadProjects();
        }, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const toggleStudentSelection = (studentId) => {
        setForm((prev) => {
            const selected = prev.student_ids.includes(studentId)
                ? prev.student_ids.filter((id) => id !== studentId)
                : [...prev.student_ids, studentId];
            return { ...prev, student_ids: selected };
        });
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.title || !form.faculty_id) {
            setError('Please select a title and guide');
            return;
        }

        if (form.student_ids.length === 0 || form.student_ids.length > 4) {
            setError('Each project team must include between 1 and 4 students');
            return;
        }

        try {
            await projectsAPI.createProjectTeam({
                title: form.title,
                description: form.description,
                faculty_id: form.faculty_id,
                student_ids: form.student_ids
            });
            setSuccess('Project team created successfully');
            setForm({ title: '', description: '', faculty_id: '', student_ids: [] });
            setShowCreateModal(false);
            loadProjects();
        } catch (err) {
            setError(err.message || 'Failed to create team');
        }
    };

    const openStatusModal = (project) => {
        setSelectedProject(project);
        setMarksForm({
            phase_1_mark: project.progress?.phase_1_mark || 0,
            phase_2_mark: project.progress?.phase_2_mark || 0,
            phase_3_mark: project.progress?.phase_3_mark || 0,
            hod_comment: project.progress?.hod_comment || ''
        });
        setShowStatusModal(true);
    };

    const handleSubmitMarks = async () => {
        try {
            setError('');
            await projectsAPI.submitHODMarks(selectedProject.id, marksForm);
            setSuccess('Project phase marks saved successfully.');
            setShowStatusModal(false);
            loadProjects();
        } catch (err) {
            setError(err.message || 'Failed to save marks');
        }
    };

    const getStudentNames = (project) => {
        const members = project.team_members || [];
        return members
            .map((member) => (member.students ? member.students.name : ''))
            .filter(Boolean)
            .join(', ') || 'No students assigned';
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Project Allocation</h1>
                    <p>Assign guides and create project teams for students</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    Create Team
                </button>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="card-header"><h3>Active Projects & Guide Allocations</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Project Title</th>
                                    <th>Team Members</th>
                                    <th>Team Lead</th>
                                    <th>Assigned Guide</th>
                                    <th>Progress</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length > 0 ? (
                                    projects.map((project) => (
                                        <tr key={project.id}>
                                            <td><strong>{project.title}</strong></td>
                                            <td>{getStudentNames(project)}</td>
                                            <td>{project.team_lead_name || 'Not assigned'}</td>
                                            <td>
                                                <span style={{
                                                    color: project.faculty_id ? '#22c55e' : '#ef4444',
                                                    fontWeight: 'bold',
                                                    backgroundColor: project.faculty_id ? '#dcfce7' : '#fef2f2',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {project.faculty?.name || 'Not assigned'}
                                                </span>
                                            </td>
                                            <td>{project.completion_percentage || 0}%</td>
                                            <td>
                                                <button className="btn btn-sm btn-primary" onClick={() => openStatusModal(project)}>
                                                    View Status
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">No project teams assigned yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showStatusModal && selectedProject && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedProject.title} Progress</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowStatusModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Guide:</strong> {selectedProject.faculty?.name || 'Not assigned'}</p>
                            <p><strong>Team Lead:</strong> {selectedProject.team_lead_name || 'Not assigned'}</p>
                            <p><strong>Team:</strong> {getStudentNames(selectedProject)}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                <label className="form-group">
                                    <span>Phase 1 Mark</span>
                                    <input type="number" min="0" max="100" className="form-input" value={marksForm.phase_1_mark} onChange={(e) => setMarksForm({ ...marksForm, phase_1_mark: Number(e.target.value) })} />
                                </label>
                                <label className="form-group">
                                    <span>Phase 2 Mark</span>
                                    <input type="number" min="0" max="100" className="form-input" value={marksForm.phase_2_mark} onChange={(e) => setMarksForm({ ...marksForm, phase_2_mark: Number(e.target.value) })} />
                                </label>
                                <label className="form-group">
                                    <span>Phase 3 Mark</span>
                                    <input type="number" min="0" max="100" className="form-input" value={marksForm.phase_3_mark} onChange={(e) => setMarksForm({ ...marksForm, phase_3_mark: Number(e.target.value) })} />
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">HOD Review</label>
                                <textarea className="form-input" rows="3" value={marksForm.hod_comment} onChange={(e) => setMarksForm({ ...marksForm, hod_comment: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmitMarks}>Save Marks</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Project Team</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateTeam}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Project Title *</label>
                                    <input type="text" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Guide *</label>
                                    <select className="form-input form-select" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} required>
                                        <option value="">Choose Faculty</option>
                                        {facultyList.map((faculty) => (
                                            <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Select Students (Max 4) *</label>
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '8px' }}>
                                        {students.length > 0 ? (
                                            students.map((student) => (
                                                <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={form.student_ids.includes(student.id)}
                                                        onChange={() => toggleStudentSelection(student.id)}
                                                    />
                                                    <span>{student.name} ({student.roll_number || student.roll || 'N/A'})</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted">No students available.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!form.title || !form.faculty_id || form.student_ids.length === 0}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODProjects;
