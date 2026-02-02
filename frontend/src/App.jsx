import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/LoginPage';
import { HODLayout, HODDashboard } from './pages/hod/HODDashboard';
import FacultyManagement from './pages/hod/FacultyManagement';
import StudentManagement from './pages/hod/StudentManagement';
import EventsManagement from './pages/hod/EventsManagement';
import { FacultyLayout, FacultyDashboard } from './pages/faculty/FacultyDashboard';
import AttendanceEntry from './pages/faculty/AttendanceEntry';
import MarksEntry from './pages/faculty/MarksEntry';
import StudentUpload from './pages/faculty/StudentUpload';
import { StudentLayout, StudentDashboard } from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentEvents from './pages/student/StudentEvents';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />

      {/* HOD Routes */}
      <Route path="/hod" element={
        <ProtectedRoute allowedRoles={['hod']}>
          <HODLayout />
        </ProtectedRoute>
      }>
        <Route index element={<HODDashboard />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="reports" element={<div className="management-page"><h1>Reports</h1><p>Coming soon...</p></div>} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FacultyDashboard />} />
        <Route path="students" element={<StudentUpload />} />
        <Route path="attendance" element={<AttendanceEntry />} />
        <Route path="marks" element={<MarksEntry />} />
        <Route path="events" element={<StudentEvents />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="marks" element={<StudentMarks />} />
        <Route path="events" element={<StudentEvents />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
