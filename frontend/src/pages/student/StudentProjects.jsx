import { useState } from 'react';
import './StudentDashboard.css';

const StudentProjects = () => {
    const [projects] = useState([
        { id: 'p1', title: 'AI-Based Attendance Scanner', guide: 'Prof. Jane Doe', team: 'Team A (Alex Johnson, Ryan Smith)', status: 'In Progress', deadline: '2026-09-30' }
    ]);

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1 style={{ color: '#1e3a5f', fontSize: '1.75rem', fontWeight: 'bold' }}>My Project Work</h1>
                    <p style={{ color: '#64748b' }}>Track guide allocations, deadlines, and project execution status</p>
                </div>
            </header>

            <div className="card">
                <div className="card-header"><h3>Active Academic Projects</h3></div>
                <div className="card-body">
                    {projects.map(p => (
                        <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ color: '#1e3a5f', fontSize: '1.25rem', fontWeight: 'bold' }}>{p.title}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Deadline: {p.deadline}</p>
                                </div>
                                <span style={{ 
                                    color: '#0284c7',
                                    backgroundColor: '#e0f2fe',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                }}>
                                    {p.status}
                                </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#64748b' }}>Assigned Guide</h4>
                                    <p style={{ fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}>{p.guide}</p>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#64748b' }}>Team Members</h4>
                                    <p style={{ fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}>{p.team}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentProjects;
