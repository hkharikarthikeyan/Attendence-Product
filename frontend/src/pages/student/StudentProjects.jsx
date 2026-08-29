import { useEffect, useState } from 'react';
import { studentAPI, projectsAPI } from '../../services/api';
import './StudentDashboard.css';

const StudentProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [phaseForm, setPhaseForm] = useState({ current_phase: 'phase_1', completion_percentage: 0, note: '' });

    const loadProjects = async () => {
        try {
            const response = await studentAPI.getMyProjects();
            setProjects(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load assigned projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleTakeLead = async (projectId) => {
        try {
            setError('');
            await projectsAPI.takeLead(projectId);
            setSuccess('Project lead assigned successfully');
            loadProjects();
        } catch (err) {
            setError(err.message || 'Could not assign project lead');
        }
    };

    const handlePhaseUpdate = async (projectId) => {
        try {
            setError('');
            await projectsAPI.updateProjectPhase(projectId, {
                current_phase: phaseForm.current_phase,
                completion_percentage: Number(phaseForm.completion_percentage),
                note: phaseForm.note,
            });
            setSuccess('Project phase updated successfully');
            setSelectedProjectId('');
            setPhaseForm({ current_phase: 'phase_1', completion_percentage: 0, note: '' });
            loadProjects();
        } catch (err) {
            setError(err.message || 'Could not update project phase');
        }
    };

    const getMemberNames = (project) => {
        const members = project.team_members || [];
        return members.map((member) => member.students?.name).filter(Boolean).join(', ') || 'No team members';
    };

    const teamLeadName = (project) => project.team_lead_name || 'Not assigned yet';
    const canEditProgress = (project) => Boolean(project.team_member_is_lead);
    const getFinalProjectMark = (project) => {
        const phaseMarks = [
            Number(project.progress?.phase_1_mark ?? 0),
            Number(project.progress?.phase_2_mark ?? 0),
            Number(project.progress?.phase_3_mark ?? 0),
        ].filter((value) => !Number.isNaN(value));

        if (!phaseMarks.length) return 0;
        return Math.round(phaseMarks.reduce((sum, value) => sum + value, 0) / phaseMarks.length);
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1 style={{ color: '#1e3a5f', fontSize: '1.75rem', fontWeight: 'bold' }}>My Project Work</h1>
                    <p style={{ color: '#64748b' }}>Track team assignments, progress, and phase updates</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading project assignments...</p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header"><h3>Assigned Academic Projects</h3></div>
                    <div className="card-body">
                        {projects.length > 0 ? projects.map((p) => (
                            <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ color: '#1e3a5f', fontSize: '1.25rem', fontWeight: 'bold' }}>{p.title}</h3>
                                        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Deadline: {p.deadline || 'Not set'}</p>
                                    </div>
                                    <span style={{
                                        color: '#0284c7',
                                        backgroundColor: '#e0f2fe',
                                        padding: '4px 12px',
                                        borderRadius: '9999px',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem'
                                    }}>
                                        {p.status || 'In Progress'}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', color: '#64748b' }}>Assigned Guide</h4>
                                        <p style={{ fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}>{p.faculty?.name || 'Not assigned'}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', color: '#64748b' }}>Team Members</h4>
                                        <p style={{ fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}>{getMemberNames(p)}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="card" style={{ padding: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#64748b' }}>Team Lead</h4>
                                        <p style={{ fontSize: '1rem', fontWeight: '700', margin: '0.5rem 0' }}>{teamLeadName(p)}</p>
                                    </div>
                                    <div className="card" style={{ padding: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#64748b' }}>Lead Access</h4>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            {p.team_member_is_lead ? 'You are the project lead' : (p.team_lead_student_id ? 'Lead already assigned' : 'No lead assigned yet')}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="card" style={{ padding: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#64748b' }}>Final Project Mark</h4>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0.5rem 0' }}>
                                            {Math.round(((Number(p.progress?.phase_1_mark ?? 0) + Number(p.progress?.phase_2_mark ?? 0) + Number(p.progress?.phase_3_mark ?? 0)) / 3) || 0)}/100
                                        </p>
                                        <p style={{ color: '#475569' }}>Overall percentage: {p.completion_percentage || 0}%</p>
                                        <p>Current Phase: {p.current_phase || 'Phase 1'}</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.5rem' }}>
                                                <small style={{ color: '#64748b' }}>Phase 1</small>
                                                <div style={{ fontWeight: '700', marginTop: '0.2rem' }}>{p.progress?.phase_1_mark ?? 0}/100</div>
                                            </div>
                                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.5rem' }}>
                                                <small style={{ color: '#64748b' }}>Phase 2</small>
                                                <div style={{ fontWeight: '700', marginTop: '0.2rem' }}>{p.progress?.phase_2_mark ?? 0}/100</div>
                                            </div>
                                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.5rem' }}>
                                                <small style={{ color: '#64748b' }}>Phase 3</small>
                                                <div style={{ fontWeight: '700', marginTop: '0.2rem' }}>{p.progress?.phase_3_mark ?? 0}/100</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card" style={{ padding: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#64748b' }}>Lead & Review</h4>
                                        <p style={{ margin: '0.5rem 0' }}>
                                            {p.team_member_is_lead ? 'You are the project lead' : 'You are a team member'}
                                        </p>
                                        {!p.team_lead_student_id && !p.team_member_is_lead && (
                                            <button className="btn btn-sm btn-primary" onClick={() => handleTakeLead(p.id)}>
                                                Take Lead
                                            </button>
                                        )}
                                        {p.team_lead_student_id && !p.team_member_is_lead && (
                                            <span style={{ color: '#64748b', fontWeight: '600' }}>Lead assigned to {p.team_lead_name}</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    {canEditProgress(p) ? (
                                        selectedProjectId === p.id ? (
                                            <div className="card" style={{ padding: '0.75rem' }}>
                                                <h4>Update Project Progress</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                    <label>
                                                        <span>Phase</span>
                                                        <select className="form-input" value={phaseForm.current_phase} onChange={(e) => setPhaseForm({ ...phaseForm, current_phase: e.target.value })}>
                                                            <option value="phase_1">Phase 1</option>
                                                            <option value="phase_2">Phase 2</option>
                                                            <option value="phase_3">Phase 3</option>
                                                        </select>
                                                    </label>
                                                    <label>
                                                        <span>Completion %</span>
                                                        <input type="number" min="0" max="100" className="form-input" value={phaseForm.completion_percentage} onChange={(e) => setPhaseForm({ ...phaseForm, completion_percentage: e.target.value })} />
                                                    </label>
                                                </div>
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <label>
                                                        <span>Phase Notes</span>
                                                        <textarea className="form-input" rows="3" value={phaseForm.note} onChange={(e) => setPhaseForm({ ...phaseForm, note: e.target.value })} />
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                    <button className="btn btn-primary" onClick={() => handlePhaseUpdate(p.id)}>Save Progress</button>
                                                    <button className="btn btn-secondary" onClick={() => setSelectedProjectId('')}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn btn-primary" onClick={() => setSelectedProjectId(p.id)}>
                                                Update Phase
                                            </button>
                                        )
                                    ) : (
                                        <div className="card" style={{ padding: '0.75rem', backgroundColor: '#f8fafc' }}>
                                            <h4 style={{ fontSize: '0.8rem', color: '#64748b' }}>Progress View</h4>
                                            <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>
                                                Score and completion percentage are visible to all team members. Only the team lead can update the project phase.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="text-muted text-center">No project assignments yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProjects;
