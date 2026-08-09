import { useState } from 'react';
import '../hod/FacultyManagement.css';

const FacultyProjects = () => {
    const [students] = useState([
        { id: '1', name: 'Alex Johnson', roll: '01' },
        { id: '2', name: 'Emma Davis', roll: '02' },
        { id: '3', name: 'Ryan Smith', roll: '03' },
        { id: '4', name: 'Sophia Lee', roll: '04' }
    ]);
    const [teams, setTeams] = useState([
        { id: 't1', name: 'Alpha Team', project: 'AI-Based Attendance Scanner', members: 'Alex Johnson, Ryan Smith' },
        { id: 't2', name: 'Beta Team', project: 'Smart IoT Node', members: 'Emma Davis, Sophia Lee' }
    ]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    const toggleStudentSelection = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleCreateTeam = (e) => {
        e.preventDefault();
        if (!teamName || !projectTitle || selectedStudents.length === 0) return;
        
        const memberNames = students
            .filter(s => selectedStudents.includes(s.id))
            .map(s => s.name)
            .join(', ');

        const newTeam = {
            id: Date.now().toString(),
            name: teamName,
            project: projectTitle,
            members: memberNames
        };

        setTeams([...teams, newTeam]);
        setShowCreateModal(false);
        setTeamName('');
        setProjectTitle('');
        setSelectedStudents([]);
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Faculty Project Teams</h1>
                    <p>Organize students into project teams and track guides assignments</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    Create Team
                </button>
            </header>

            <div className="card">
                <div className="card-header"><h3>Active Project Groups</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Team Name</th>
                                    <th>Project Title</th>
                                    <th>Members</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.name}</strong></td>
                                        <td>{t.project}</td>
                                        <td>{t.members}</td>
                                        <td>
                                            <span style={{ 
                                                color: '#22c55e',
                                                backgroundColor: '#dcfce7',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem'
                                            }}>
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
                                    <label className="form-label">Team Name *</label>
                                    <input type="text" className="form-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Project Title *</label>
                                    <input type="text" className="form-input" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Select Team Members *</label>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px' }}>
                                        {students.map(s => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudentSelection(s.id)} />
                                                <span>{s.name} (Roll: {s.roll})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!teamName || !projectTitle || selectedStudents.length === 0}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyProjects;
