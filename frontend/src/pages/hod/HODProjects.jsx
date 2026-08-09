import { useState } from 'react';
import './FacultyManagement.css';

const HODProjects = () => {
    const [facultyList] = useState([
        { id: 'f1', name: 'Prof. Jane Doe' },
        { id: 'f2', name: 'Prof. Mike Wilson' },
        { id: 'f3', name: 'Prof. Lisa Brown' }
    ]);
    const [projects, setProjects] = useState([
        { id: 'p1', title: 'AI-Based Attendance Scanner', team: 'Team A (Alex Johnson, Ryan Smith)', guide: 'Prof. Jane Doe' },
        { id: 'p2', title: 'Blockchain Decentralized Voting', team: 'Team B (Emma Davis, Sophia Lee)', guide: 'None Assigned' },
        { id: 'p3', title: 'Smart Agriculture IoT Node', team: 'Team C (Daniel Kim, John Carter)', guide: 'None Assigned' }
    ]);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedGuide, setSelectedGuide] = useState('');

    const saveGuideAllocation = () => {
        if (!selectedGuide) return;
        const faculty = facultyList.find(f => f.id === selectedGuide);
        setProjects(projects.map(p => {
            if (p.id === editingProject.id) {
                return { ...p, guide: faculty ? faculty.name : 'None Assigned' };
            }
            return p;
        }));
        setEditingProject(null);
        setSelectedGuide('');
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Project Allocation</h1>
                    <p>Assign project guides to student teams and monitor progress</p>
                </div>
            </header>

            <div className="card">
                <div className="card-header"><h3>Active Projects & Guide Allocations</h3></div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Project Title</th>
                                    <th>Team Details</th>
                                    <th>Assigned Guide</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(p => (
                                    <tr key={p.id}>
                                        <td><strong>{p.title}</strong></td>
                                        <td>{p.team}</td>
                                        <td>
                                            <span style={{ 
                                                color: p.guide === 'None Assigned' ? '#ef4444' : '#22c55e',
                                                fontWeight: 'bold',
                                                backgroundColor: p.guide === 'None Assigned' ? '#fef2f2' : '#dcfce7',
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {p.guide}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => setEditingProject(p)}>
                                                Allocate Guide
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editingProject && (
                <div className="modal-overlay" onClick={() => setEditingProject(null)}>
                    <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Allocate Project Guide</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingProject(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem' }}><strong>Project:</strong> {editingProject.title}</p>
                            <div className="form-group">
                                <label className="form-label">Select Faculty Member *</label>
                                <select className="form-input form-select" value={selectedGuide} onChange={(e) => setSelectedGuide(e.target.value)}>
                                    <option value="">Choose Faculty</option>
                                    {facultyList.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditingProject(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveGuideAllocation} disabled={!selectedGuide}>Allocate Guide</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODProjects;
