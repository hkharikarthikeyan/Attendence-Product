import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const PHASES = [
    { key: 'phase_1', label: 'Phase 1', num: 1 },
    { key: 'phase_2', label: 'Phase 2', num: 2 },
    { key: 'phase_3', label: 'Phase 3', num: 3 },
];

const statusStyles = {
    approved: { color: '#15803d', bg: '#dcfce7', label: 'Approved' },
    rejected: { color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
    pending:  { color: '#b45309', bg: '#fef3c7', label: 'Pending' },
};

const StatusBadge = ({ status }) => {
    const s = statusStyles[status] || statusStyles.pending;
    return (
        <span style={{
            color: s.color,
            backgroundColor: s.bg,
            padding: '3px 10px',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.78rem',
            textTransform: 'capitalize',
            whiteSpace: 'nowrap',
        }}>
            {s.label}
        </span>
    );
};

const FacultyProjects = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewing, setReviewing] = useState(null);
    const [activePhase, setActivePhase] = useState('phase_1');
    const [phaseComments, setPhaseComments] = useState({
        phase_1: '', phase_2: '', phase_3: '',
    });
    const [phaseMarks, setPhaseMarks] = useState({
        phase_1: 0, phase_2: 0, phase_3: 0,
    });
    const [submittingPhase, setSubmittingPhase] = useState(null);

    const loadAssignedProjects = async () => {
        try {
            setError('');
            const response = await projectsAPI.getProjects();
            const allProjects = response.data || [];
            const myProjects = allProjects.filter((project) => project.faculty_id === user?.id);
            setTeams(myProjects);
        } catch (err) {
            setError(err.message || 'Failed to load assigned projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            loadAssignedProjects();
            const intervalId = setInterval(loadAssignedProjects, 15000);
            return () => clearInterval(intervalId);
        }
    }, [user?.id]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const getMemberNames = (project) => {
        const members = project.team_members || [];
        return members
            .map((member) => member.students?.name)
            .filter(Boolean)
            .join(', ') || 'No students assigned';
    };

    const openReviewModal = (team) => {
        setReviewing(team);
        setActivePhase('phase_1');
        setPhaseComments({
            phase_1: team.faculty_phase_1_comment || team.progress?.faculty_phase_1_comment || '',
            phase_2: team.faculty_phase_2_comment || team.progress?.faculty_phase_2_comment || '',
            phase_3: team.faculty_phase_3_comment || team.progress?.faculty_phase_3_comment || '',
        });
        setPhaseMarks({
            phase_1: team.progress?.phase_1_mark || 0,
            phase_2: team.progress?.phase_2_mark || 0,
            phase_3: team.progress?.phase_3_mark || 0,
        });
    };

    const closeReviewModal = () => {
        setReviewing(null);
        setSubmittingPhase(null);
    };

    const handlePhaseReview = async (phaseKey, status) => {
        if (!reviewing) return;
        setSubmittingPhase(phaseKey);
        try {
            setError('');
            const phaseLabel = PHASES.find(p => p.key === phaseKey)?.label;
            await projectsAPI.submitFacultyReview(reviewing.id, {
                faculty_status: status,
                faculty_comment: phaseComments[phaseKey] || (status === 'approved'
                    ? `Faculty approved ${phaseLabel}.`
                    : `Faculty rejected ${phaseLabel}. Rework required.`),
                phase: phaseKey,
                phase_mark: phaseMarks[phaseKey],
            });
            setSuccess(`${phaseLabel} — ${status === 'approved' ? 'Approved' : 'Rejected'} with mark ${phaseMarks[phaseKey]}%.`);
            await loadAssignedProjects();
            // Refresh the modal with updated data
            const response = await projectsAPI.getProjects();
            const allProjects = response.data || [];
            const updatedProject = allProjects.find(p => p.id === reviewing.id);
            if (updatedProject) {
                setReviewing(updatedProject);
                setPhaseComments({
                    phase_1: updatedProject.faculty_phase_1_comment || updatedProject.progress?.faculty_phase_1_comment || '',
                    phase_2: updatedProject.faculty_phase_2_comment || updatedProject.progress?.faculty_phase_2_comment || '',
                    phase_3: updatedProject.faculty_phase_3_comment || updatedProject.progress?.faculty_phase_3_comment || '',
                });
                setPhaseMarks({
                    phase_1: updatedProject.progress?.phase_1_mark || 0,
                    phase_2: updatedProject.progress?.phase_2_mark || 0,
                    phase_3: updatedProject.progress?.phase_3_mark || 0,
                });
            }
        } catch (err) {
            setError(err.message || 'Failed to submit review');
        } finally {
            setSubmittingPhase(null);
        }
    };

    const getPhaseStatus = (project, phaseKey) => {
        return project[`faculty_${phaseKey}_status`] || project.progress?.[`faculty_${phaseKey}_status`] || 'pending';
    };

    const getPhaseComment = (project, phaseKey) => {
        return project[`faculty_${phaseKey}_comment`] || project.progress?.[`faculty_${phaseKey}_comment`] || '';
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Faculty Project Teams</h1>
                    <p>Review project progress phase-by-phase, validate work, and approve milestones</p>
                </div>
            </header>

            {success && <div className="toast toast-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading assigned teams...</p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header"><h3>Assigned Project Teams</h3></div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Project Title</th>
                                        <th>Team Members</th>
                                        <th>Team Lead</th>
                                        <th>Progress</th>
                                        <th>Current Phase</th>
                                        <th style={{ minWidth: '220px' }}>Phase Reviews</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.length > 0 ? (
                                        teams.map((team) => (
                                            <tr key={team.id}>
                                                <td><strong>{team.title}</strong></td>
                                                <td>{getMemberNames(team)}</td>
                                                <td>{team.team_lead_name || 'Not assigned'}</td>
                                                <td>{team.completion_percentage || 0}%</td>
                                                <td>{team.current_phase || 'Phase 1'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {PHASES.map(phase => (
                                                            <div key={phase.key} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '0.8rem',
                                                            }}>
                                                                <span style={{
                                                                    fontWeight: 600,
                                                                    color: '#475569',
                                                                    minWidth: '52px',
                                                                }}>{phase.label}:</span>
                                                                <StatusBadge status={getPhaseStatus(team, phase.key)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-primary" onClick={() => openReviewModal(team)}>
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center text-muted">No project teams assigned to you yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase-wise Review Modal */}
            {reviewing && (
                <div className="modal-overlay" onClick={closeReviewModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px', width: '95%' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: 0 }}>{reviewing.title} — Phase Review</h3>
                            <button className="btn btn-sm btn-secondary" onClick={closeReviewModal}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            {/* Project Info */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid #e2e8f0',
                                background: '#f8fafc',
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <p style={{ margin: 0 }}><strong>Team Lead:</strong> {reviewing.team_lead_name || 'Not assigned'}</p>
                                    <p style={{ margin: 0 }}><strong>Current Phase:</strong> {reviewing.current_phase || 'Phase 1'}</p>
                                    <p style={{ margin: 0, gridColumn: '1 / -1' }}><strong>Team:</strong> {getMemberNames(reviewing)}</p>
                                </div>

                                {/* Overall marks summary */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                    gap: '0.75rem',
                                    marginTop: '0.75rem',
                                }}>
                                    {PHASES.map(phase => (
                                        <div key={phase.key} style={{
                                            textAlign: 'center',
                                            background: '#fff',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{phase.label}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                {reviewing.progress?.[`${phase.key}_mark`] || 0}%
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{
                                        textAlign: 'center',
                                        background: '#1e293b',
                                        color: '#fff',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                    }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.8 }}>Overall</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                            {reviewing.completion_percentage || 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phase Tabs */}
                            <div style={{
                                display: 'flex',
                                borderBottom: '2px solid #e2e8f0',
                                background: '#fff',
                            }}>
                                {PHASES.map(phase => {
                                    const isActive = activePhase === phase.key;
                                    return (
                                        <button
                                            key={phase.key}
                                            onClick={() => setActivePhase(phase.key)}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem 1rem',
                                                border: 'none',
                                                borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                                background: isActive ? '#eff6ff' : 'transparent',
                                                cursor: 'pointer',
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? '#1d4ed8' : '#64748b',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <span>{phase.label}</span>
                                            <StatusBadge status={getPhaseStatus(reviewing, phase.key)} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Phase Review Content */}
                            {PHASES.map(phase => {
                                if (activePhase !== phase.key) return null;
                                const phaseStatus = getPhaseStatus(reviewing, phase.key);

                                return (
                                    <div key={phase.key} style={{ padding: '1.25rem 1.5rem' }}>
                                        {/* Existing comment display */}
                                        {getPhaseComment(reviewing, phase.key) && phaseStatus !== 'pending' && (
                                            <div style={{
                                                background: phaseStatus === 'approved' ? '#f0fdf4' : phaseStatus === 'rejected' ? '#fef2f2' : '#f8fafc',
                                                border: `1px solid ${phaseStatus === 'approved' ? '#bbf7d0' : phaseStatus === 'rejected' ? '#fecaca' : '#e2e8f0'}`,
                                                borderRadius: '10px',
                                                padding: '0.875rem',
                                                marginBottom: '1rem',
                                            }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                                    Previous Review:
                                                </div>
                                                <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                    {getPhaseComment(reviewing, phase.key)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Mark input */}
                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {phase.label} Mark (0 - 100)
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={phaseMarks[phase.key]}
                                                    onChange={(e) => setPhaseMarks({
                                                        ...phaseMarks,
                                                        [phase.key]: Number(e.target.value),
                                                    })}
                                                    style={{
                                                        flex: 1,
                                                        accentColor: '#3b82f6',
                                                        height: '6px',
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="form-input"
                                                    value={phaseMarks[phase.key]}
                                                    onChange={(e) => {
                                                        let val = Number(e.target.value);
                                                        if (val > 100) val = 100;
                                                        if (val < 0) val = 0;
                                                        setPhaseMarks({
                                                            ...phaseMarks,
                                                            [phase.key]: val,
                                                        });
                                                    }}
                                                    style={{
                                                        width: '72px',
                                                        textAlign: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '1rem',
                                                    }}
                                                />
                                                <span style={{ fontWeight: 600, color: '#64748b' }}>%</span>
                                            </div>
                                        </div>

                                        {/* Comment textarea */}
                                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {phase.label} Review Comment
                                            </label>
                                            <textarea
                                                className="form-input"
                                                rows="3"
                                                value={phaseComments[phase.key]}
                                                onChange={(e) => setPhaseComments({
                                                    ...phaseComments,
                                                    [phase.key]: e.target.value,
                                                })}
                                                placeholder={`Write your review for ${phase.label}...`}
                                                style={{ resize: 'vertical', minHeight: '80px' }}
                                            />
                                        </div>

                                        {/* Approve / Reject buttons */}
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => handlePhaseReview(phase.key, 'approved')}
                                                disabled={submittingPhase === phase.key}
                                                style={{
                                                    flex: 1,
                                                    background: '#16a34a',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.7rem 1rem',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    opacity: submittingPhase === phase.key ? 0.6 : 1,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                {submittingPhase === phase.key ? 'Submitting...' : `Approve ${phase.label}`}
                                            </button>
                                            <button
                                                onClick={() => handlePhaseReview(phase.key, 'rejected')}
                                                disabled={submittingPhase === phase.key}
                                                style={{
                                                    flex: 1,
                                                    background: '#dc2626',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.7rem 1rem',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    opacity: submittingPhase === phase.key ? 0.6 : 1,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                                {submittingPhase === phase.key ? 'Submitting...' : `Reject ${phase.label}`}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
                            <button className="btn btn-secondary" onClick={closeReviewModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyProjects;
