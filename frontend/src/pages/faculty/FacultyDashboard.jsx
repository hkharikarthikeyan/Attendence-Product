import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { facultyAPI } from '../../services/api';
import '../hod/HODDashboard.css';

const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const menuItems = [
    { path: '/faculty', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { path: '/faculty/students', label: 'Student Upload', icon: <UploadIcon /> },
    { path: '/faculty/attendance', label: 'Mark Attendance', icon: <CheckIcon /> },
    { path: '/faculty/marks', label: 'Enter Marks', icon: <EditIcon /> },
    { path: '/faculty/assignments', label: 'Assignments', icon: <FileIcon /> },
    { path: '/faculty/projects', label: 'Manage Teams', icon: <FileIcon /> },
    { path: '/faculty/leave', label: 'Leave Request', icon: <FileIcon /> },
    { path: '/faculty/events', label: 'Events', icon: <CalendarIcon /> },
];

const FacultyLayout = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar role="faculty" menuItems={menuItems} />
            <main className="main-content"><Outlet /></main>
        </div>
    );
};

const FacultyDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [myClass, setMyClass] = useState({ assignments: [], students: [] });
    const [studentRoster, setStudentRoster] = useState([]);
    const [showStudentList, setShowStudentList] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load profile - handle error gracefully
            try {
                const profileData = await facultyAPI.getProfile();
                setProfile(profileData);
            } catch (err) {
                console.error('Failed to load profile:', err);
                setProfile({ name: 'Faculty' }); // Fallback
            }

            // Load class assignments - handle gracefully
            try {
                const classData = await facultyAPI.getMyClass();
                const students = classData.students || [];
                setMyClass({
                    assignments: classData.assignments || [],
                    students,
                });
                setStudentRoster(students.map((student) => ({ ...student, attendance_percentage: 0 })));
            } catch (err) {
                console.error('Failed to load class assignments:', err);
                setMyClass({ assignments: [], students: [] });
                setStudentRoster([]);
            }

            // Load events - handle error gracefully  
            try {
                const eventsData = await facultyAPI.getEvents();
                setEvents(eventsData.events?.slice(0, 5) || []);
            } catch (err) {
                console.error('Failed to load events:', err);
                setEvents([]);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setError('Failed to load some data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleShowStudents = async () => {
        if (!myClass.assignments.length) {
            setStudentRoster([]);
            setShowStudentList(true);
            return;
        }

        try {
            const uniqueClasses = [];
            const seen = new Set();
            myClass.assignments.forEach((assignment) => {
                const key = `${assignment.class_year}-${assignment.section}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueClasses.push({ class_year: assignment.class_year, section: assignment.section });
                }
            });

            const attendanceMap = {};
            for (const item of uniqueClasses) {
                const summary = await facultyAPI.getAttendanceSummary(item.class_year, item.section);
                (summary.summary || []).forEach((row) => {
                    attendanceMap[row.student_id] = row.percentage;
                });
            }

            const roster = (myClass.students || []).map((student) => ({
                ...student,
                attendance_percentage: attendanceMap[student.id] ?? 0,
            }));

            setStudentRoster(roster);
            setShowStudentList(true);
        } catch (err) {
            console.error('Failed to load student roster:', err);
            setStudentRoster((myClass.students || []).map((student) => ({ ...student, attendance_percentage: 0 })));
            setShowStudentList(true);
        }
    };

    const handleStudentDetails = async (student) => {
        try {
            const detail = await facultyAPI.getStudentDetails(student.id);
            setSelectedStudent(student);
            setSelectedStudentDetail(detail);
        } catch (err) {
            console.error('Failed to load student details:', err);
            setSelectedStudent(student);
            setSelectedStudentDetail({
                student: {
                    ...student,
                    email: 'Not provided',
                    father_name: 'Not provided',
                    mother_name: 'Not provided',
                },
                attendance: { total_classes: 0, present: 0, percentage: 0 },
                marks: [],
            });
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Welcome, {profile?.name || 'Faculty'}</h1>
                    <p>Here's your dashboard overview for today.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><CheckIcon /></div>
                    <div className="stat-content">
                        <h3>Today</h3>
                        <p>Mark Attendance</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent"><EditIcon /></div>
                    <div className="stat-content">
                        <h3>Pending</h3>
                        <p>Marks Entry</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sky"><CalendarIcon /></div>
                    <div className="stat-content">
                        <h3>{events.length}</h3>
                        <p>Upcoming Events</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h3>My Class</h3></div>
                    <div className="card-body">
                        {myClass.assignments.length > 0 ? (
                            <div>
                                <p style={{ marginBottom: '0.75rem' }}>
                                    Assigned classes: {myClass.assignments.map((a) => `${a.class_year} / ${a.section}`).join(', ')}
                                </p>
                                <button
                                    className="btn btn-primary"
                                    style={{ marginBottom: '1rem' }}
                                    onClick={handleShowStudents}
                                >
                                    Show Students
                                </button>
                                {showStudentList && (
                                    <div style={{ marginTop: '1rem' }}>
                                        {studentRoster.length > 0 ? (
                                            <div className="table-container">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Roll No</th>
                                                            <th>Register No</th>
                                                            <th>Attendance %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {studentRoster.map((student) => (
                                                            <tr key={student.id}>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-link"
                                                                        onClick={() => handleStudentDetails(student)}
                                                                        style={{ padding: 0, textAlign: 'left', color: '#0b4d7a', fontWeight: 600 }}
                                                                    >
                                                                        {student.name}
                                                                    </button>
                                                                </td>
                                                                <td>{student.roll_number}</td>
                                                                <td>{student.register_number}</td>
                                                                <td>{student.attendance_percentage.toFixed(2)}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted text-center">No students in this class yet</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted text-center">No class assignments yet</p>
                        )}
                    </div>
                </div>

                {selectedStudentDetail && (
                    <div className="modal-overlay" onClick={() => setSelectedStudentDetail(null)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{selectedStudentDetail.student.name}</h3>
                                <button className="btn btn-icon" onClick={() => setSelectedStudentDetail(null)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="student-details">
                                    <div className="detail-row"><span className="detail-label">Name:</span><span className="detail-value">{selectedStudentDetail.student.name}</span></div>
                                    <div className="detail-row"><span className="detail-label">Roll No:</span><span className="detail-value">{selectedStudentDetail.student.roll_number}</span></div>
                                    <div className="detail-row"><span className="detail-label">Register Number:</span><span className="detail-value">{selectedStudentDetail.student.register_number}</span></div>
                                    <div className="detail-row"><span className="detail-label">Attendance %:</span><span className="detail-value">{selectedStudentDetail.attendance.percentage}%</span></div>
                                    <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{selectedStudentDetail.student.email}</span></div>
                                    <div className="detail-row"><span className="detail-label">Father Name:</span><span className="detail-value">{selectedStudentDetail.student.father_name || 'Not provided'}</span></div>
                                    <div className="detail-row"><span className="detail-label">Mother Name:</span><span className="detail-value">{selectedStudentDetail.student.mother_name || 'Not provided'}</span></div>
                                    <div className="detail-row"><span className="detail-label">Class:</span><span className="detail-value">{selectedStudentDetail.student.class_year} / {selectedStudentDetail.student.section}</span></div>
                                </div>

                                <h4 style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>Performance & Internal Marks</h4>
                                {selectedStudentDetail.marks.length > 0 ? (
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Marks</th>
                                                    <th>Average %</th>
                                                    <th>Exam Records</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedStudentDetail.marks.map((item, index) => (
                                                    <tr key={`${item.subject}-${index}`}>
                                                        <td>{item.subject}</td>
                                                        <td>{item.marks_obtained} / {item.max_marks}</td>
                                                        <td>{item.percentage}%</td>
                                                        <td>
                                                            {item.records.map((record, i) => (
                                                                <div key={`${record.exam_type}-${i}`}>
                                                                    {record.exam_type}: {record.marks_obtained}/{record.max_marks}
                                                                </div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">No marks available for this student yet.</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setSelectedStudentDetail(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="card-header"><h3>Quick Actions</h3></div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <a href="/faculty/attendance" className="action-btn">
                                <CheckIcon /><span>Mark Attendance</span>
                            </a>
                            <a href="/faculty/marks" className="action-btn">
                                <EditIcon /><span>Enter Marks</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Recent Events</h3></div>
                    <div className="card-body">
                        {events.length > 0 ? (
                            <ul className="event-list">
                                {events.map((event) => (
                                    <li key={event.id} className="event-item">
                                        <div className="event-icon"><CalendarIcon /></div>
                                        <div className="event-details">
                                            <h4>{event.title}</h4>
                                            <p>{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center">No events</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { FacultyLayout, FacultyDashboard };
export default FacultyDashboard;
