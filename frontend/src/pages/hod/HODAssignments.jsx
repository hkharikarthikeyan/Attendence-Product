import { useState, useEffect } from 'react';
import { assignmentsAPI, hodAPI } from '../../services/api';
import './FacultyManagement.css';

const HODAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [filters, setFilters] = useState({ class_year: '', section: '' });
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [nonSubmitters, setNonSubmitters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAssignments = async () => {
        try {
            setError('');
            const [assignmentsRes, submissionsRes] = await Promise.all([
                assignmentsAPI.getAssignments(filters.class_year, filters.section),
                assignmentsAPI.getSubmissions(null, filters.class_year, filters.section)
            ]);

            const assignmentList = Array.isArray(assignmentsRes?.data) ? assignmentsRes.data : [];
            const submissionList = Array.isArray(submissionsRes?.data) ? submissionsRes.data : [];

            const enrichedAssignments = await Promise.all(
                assignmentList.map(async (assignment) => {
                    try {
                        const studentsResponse = await hodAPI.getStudents({
                            class_year: assignment.class_year,
                            section: assignment.section,
                        });
                        const allStudents = studentsResponse.students || studentsResponse || [];
                        const submittedStudentIds = new Set(
                            submissionList
                                .filter((item) => item.assignment_id === assignment.id)
                                .map((item) => item.student_id)
                        );
                        const submitted = allStudents.filter((student) => submittedStudentIds.has(student.id)).length;
                        const total = allStudents.length;
                        const rate = total ? Math.round((submitted / total) * 100) : 0;

                        return {
                            ...assignment,
                            total,
                            submissions: submitted,
                            rate,
                            pendingCount: Math.max(total - submitted, 0),
                        };
                    } catch (error) {
                        return {
                            ...assignment,
                            total: 0,
                            submissions: 0,
                            rate: 0,
                            pendingCount: 0,
                        };
                    }
                })
            );

            setAssignments(enrichedAssignments);
            setSubmissions(submissionList);

            if (selectedAssignment) {
                const currentAssignment = enrichedAssignments.find((assignment) => assignment.id === selectedAssignment.id);
                if (currentAssignment) {
                    await viewNonSubmitters(currentAssignment, submissionList);
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const viewNonSubmitters = async (assignment, submissionList = submissions) => {
        try {
            const studentResponse = await hodAPI.getStudents({
                class_year: assignment.class_year,
                section: assignment.section,
            });
            const allStudents = studentResponse.students || studentResponse || [];
            const submittedStudentIds = new Set(
                submissionList
                    .filter((item) => item.assignment_id === assignment.id)
                    .map((item) => item.student_id)
            );

            const pendingStudents = allStudents
                .filter((student) => !submittedStudentIds.has(student.id))
                .map((student) => ({
                    id: student.id,
                    roll: student.roll_number || '-',
                    name: student.name,
                    register: student.register_number || student.roll_number || '-',
                }));

            setSelectedAssignment(assignment);
            setNonSubmitters(pendingStudents);
        } catch (err) {
            setError('Failed to load pending students');
        }
    };

    useEffect(() => {
        loadAssignments();
        const intervalId = setInterval(() => loadAssignments(), 15000);
        return () => clearInterval(intervalId);
    }, [filters.class_year, filters.section]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="management-page">
            <header className="page-header">
                <div>
                    <h1>Assignment Submission Tracking</h1>
                    <p>Monitor submission rates by class and section in real time</p>
                </div>
            </header>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body">
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))' }}>
                        <div className="form-group">
                            <label className="form-label">Class Year</label>
                            <select
                                className="form-input"
                                value={filters.class_year}
                                onChange={(e) => setFilters((prev) => ({ ...prev, class_year: e.target.value }))}
                            >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Section</label>
                            <select
                                className="form-input"
                                value={filters.section}
                                onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
                            >
                                <option value="">Select Section</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

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
                                    {assignments.length > 0 ? (
                                        assignments.map((ass) => (
                                            <tr key={ass.id}>
                                                <td><strong>{ass.title}</strong></td>
                                                <td>{ass.class_year || '-'} - {ass.section || '-'}</td>
                                                <td>{ass.submissions} / {ass.total}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '80px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${ass.rate}%`, height: '100%', backgroundColor: ass.rate >= 80 ? '#22c55e' : ass.rate >= 50 ? '#eab308' : '#ef4444' }} />
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
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted">
                                                No assignments found for this class/section.
                                            </td>
                                        </tr>
                                    )}
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
                                            {nonSubmitters.map((student) => (
                                                <tr key={student.id || student.roll}>
                                                    <td>{student.roll}</td>
                                                    <td><strong>{student.name}</strong></td>
                                                    <td>{student.register}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
                                    All students have submitted this assignment.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HODAssignments;
