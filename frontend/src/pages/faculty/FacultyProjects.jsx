import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../services/api';
import '../hod/FacultyManagement.css';

const FacultyProjects = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewing, setReviewing] = useState(null);

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

    const getMemberNames = (project) => {
        const members = project.team_members || [];
        return members
            .map((member) => member.students?.name)
            .filter(Boolean)
            .join(', ') || 'No students assigned';
    };

    const handleFacultyApproval = async (projectId, status) => {
        try {
            setError('');
            await projectsAPI.submitFacultyReview(projectId, {
                faculty_status: status,
                faculty_comment: status === 'approved' ? 'Faculty validated the project progress.' : 'Faculty rejected the current project progress. Rework required.'
            });
            setSuccess(status === 'approved' ? 'Project approved successfully.' : 'Project marked for rework.');
            loadAssignedProjects();
        } catch (err) {
            setError(err.message || 'Failed to update project review');
        }
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Faculty Project Teams</h1>
                    <p>Review project progress, validate work, and approve team milestones</p>
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
                                        <th>Status</th>
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
                                                    <span style={{
                                                        color: team.faculty_status === 'approved' ? '#15803d' : '#b45309',
                                                        backgroundColor: team.faculty_status === 'approved' ? '#dcfce7' : '#fef3c7',
                                                        padding: '4px 8px',
                                                        borderRadius: '999px',
                                                        fontWeight: '600',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {team.faculty_status || 'pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <button className="btn btn-sm btn-primary" onClick={() => setReviewing(team)}>
                                                            View
                                                        </button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => handleFacultyApproval(team.id, 'approved')}>
                                                            Approve
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted">No project teams assigned to you yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {reviewing && (
                <div className="modal-overlay" onClick={() => setReviewing(null)}>
                    <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{reviewing.title} Status</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setReviewing(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Team Lead:</strong> {reviewing.team_lead_name || 'Not assigned'}</p>
                            <p><strong>Team:</strong> {getMemberNames(reviewing)}</p>
                            <p><strong>Completion:</strong> {reviewing.completion_percentage || 0}%</p>
                            <p><strong>Current Phase:</strong> {reviewing.current_phase || 'Phase 1'}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                                <div className="card" style={{ padding: '0.75rem' }}>
                                    <strong>Phase 1</strong>
                                    <div>{reviewing.progress?.phase_1_mark || 0}%</div>
                                </div>
                                <div className="card" style={{ padding: '0.75rem' }}>
                                    <strong>Phase 2</strong>
                                    <div>{reviewing.progress?.phase_2_mark || 0}%</div>
                                </div>
                                <div className="card" style={{ padding: '0.75rem' }}>
                                    <strong>Phase 3</strong>
                                    <div>{reviewing.progress?.phase_3_mark || 0}%</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setReviewing(null)}>Close</button>
                            <button className="btn btn-primary" onClick={() => handleFacultyApproval(reviewing.id, 'approved')}>Approve</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyProjects;
