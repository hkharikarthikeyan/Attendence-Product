import { useState, useEffect } from 'react';
import './FacultyManagement.css';

const HODAssignments = () => {
    const [assignments, setAssignments] = useState([
        { id: '1', title: 'Calculus Assignment 1', class_year: '3rd Year', section: 'A', submissions: 42, total: 50, rate: 84 },
        { id: '2', title: 'Data Structures Lab 2', class_year: '3rd Year', section: 'B', submissions: 25, total: 48, rate: 52 },
        { id: '3', title: 'Compiler Design Essay', class_year: '4th Year', section: 'A', submissions: 30, total: 30, rate: 100 }
    ]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [nonSubmitters, setNonSubmitters] = useState([]);

    const viewNonSubmitters = (assignment) => {
        setSelectedAssignment(assignment);
        // Mocking list of students who haven't submitted
        if (assignment.id === '1') {
            setNonSubmitters([
                { roll: '08', name: 'David Miller', register: 'REG2024008' },
                { roll: '15', name: 'Sophia Grace', register: 'REG2024015' },
                { roll: '23', name: 'Liam Neeson', register: 'REG2024023' }
            ]);
        } else if (assignment.id === '2') {
            setNonSubmitters([
                { roll: '02', name: 'Emma Davis', register: 'REG2024002' },
                { roll: '05', name: 'Daniel Kim', register: 'REG2024005' },
                { roll: '12', name: 'Olivia Martinez', register: 'REG2024012' }
            ]);
        } else {
            setNonSubmitters([]);
        }
    };

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Assignment Submission Tracking</h1>
                    <p>Monitor submission rates and verify students who have pending submissions</p>
                </div>
            </header>

            <div className="management-grid" style={{ display: 'grid', gridTemplateColumns: selectedAssignment ? '1fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
                <div className="card">
                    <div className="card-header"><h3>Active Assignments</h3></div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Class/Section</th>
                                        <th>Submissions</th>
                                        <th>Submission Rate</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map(ass => (
                                        <tr key={ass.id}>
                                            <td><strong>{ass.title}</strong></td>
                                            <td>{ass.class_year} - {ass.section}</td>
                                            <td>{ass.submissions} / {ass.total}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '80px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${ass.rate}%`, height: '100%', backgroundColor: ass.rate > 80 ? '#22c55e' : ass.rate > 50 ? '#eab308' : '#ef4444' }} />
                                                    </div>
                                                    <span>{ass.rate}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => viewNonSubmitters(ass)}>
                                                    View Pending
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {selectedAssignment && (
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>Pending Students</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{selectedAssignment.title}</p>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedAssignment(null)}>Close</button>
                        </div>
                        <div className="card-body">
                            {nonSubmitters.length > 0 ? (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Roll No</th>
                                                <th>Name</th>
                                                <th>Register No</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nonSubmitters.map(st => (
                                                <tr key={st.roll}>
                                                    <td>{st.roll}</td>
                                                    <td><strong>{st.name}</strong></td>
                                                    <td>{st.register}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>All students have submitted this assignment!</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HODAssignments;
