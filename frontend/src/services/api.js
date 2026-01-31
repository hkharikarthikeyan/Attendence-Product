// ==========================================
// MOCK API - Frontend testing without backend
// ==========================================

// Set to false to use real backend
const USE_MOCK = true;
const API_BASE_URL = 'http://localhost:8000/api';

// Helper to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const mockData = {
    users: {
        hod: { id: '1', email: 'hod@college.edu', name: 'Dr. John Smith', role: 'hod' },
        faculty: { id: '2', email: 'faculty@college.edu', name: 'Prof. Jane Doe', role: 'faculty', employee_id: 'FAC001', department: 'Computer Science' },
        student: { id: '3', email: 'student@college.edu', name: 'Alex Johnson', role: 'student', register_number: 'REG2024001', roll_number: '01', class_year: '3rd Year', section: 'A', batch: '2022-2026', father_name: 'Robert Johnson', mother_name: 'Sarah Johnson', mobile: '9876543210' },
    },
    faculty: [
        { id: '1', name: 'Prof. Jane Doe', email: 'jane@college.edu', employee_id: 'FAC001', mobile: '9876543210', department: 'Computer Science', availability_status: true },
        { id: '2', name: 'Prof. Mike Wilson', email: 'mike@college.edu', employee_id: 'FAC002', mobile: '9876543211', department: 'Computer Science', availability_status: true },
        { id: '3', name: 'Prof. Lisa Brown', email: 'lisa@college.edu', employee_id: 'FAC003', mobile: '9876543212', department: 'Computer Science', availability_status: false },
    ],
    students: [
        { id: '1', name: 'Alex Johnson', email: 'alex@college.edu', register_number: 'REG2024001', roll_number: '01', class_year: '3rd Year', section: 'A', mobile: '9876543220', father_name: 'Robert Johnson', mother_name: 'Sarah Johnson' },
        { id: '2', name: 'Emma Davis', email: 'emma@college.edu', register_number: 'REG2024002', roll_number: '02', class_year: '3rd Year', section: 'A', mobile: '9876543221', father_name: 'James Davis', mother_name: 'Mary Davis' },
        { id: '3', name: 'Ryan Smith', email: 'ryan@college.edu', register_number: 'REG2024003', roll_number: '03', class_year: '3rd Year', section: 'A', mobile: '9876543222', father_name: 'William Smith', mother_name: 'Emily Smith' },
        { id: '4', name: 'Sophia Lee', email: 'sophia@college.edu', register_number: 'REG2024004', roll_number: '04', class_year: '3rd Year', section: 'B', mobile: '9876543223', father_name: 'David Lee', mother_name: 'Jennifer Lee' },
        { id: '5', name: 'Daniel Kim', email: 'daniel@college.edu', register_number: 'REG2024005', roll_number: '05', class_year: '2nd Year', section: 'A', mobile: '9876543224', father_name: 'Chris Kim', mother_name: 'Amanda Kim' },
    ],
    events: [
        { id: '1', title: 'Annual Tech Fest 2026', description: 'Technology exhibition and competitions', event_date: '2026-02-15T10:00:00', event_type: 'cultural' },
        { id: '2', title: 'Internal Exam - Mid Semester', description: 'Mid semester examinations for all departments', event_date: '2026-02-10T09:00:00', event_type: 'academic' },
        { id: '3', title: 'Sports Day', description: 'Annual sports competition', event_date: '2026-02-20T08:00:00', event_type: 'sports' },
        { id: '4', title: 'Guest Lecture - AI in Healthcare', description: 'Special lecture by industry expert', event_date: '2026-02-05T14:00:00', event_type: 'academic' },
    ],
};

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for real fetch with auth
const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

// Auth API
export const authAPI = {
    login: async (email, password, role) => {
        if (!USE_MOCK) return fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role }) });

        await delay(500);
        // Mock login - accept any credentials for testing
        const user = mockData.users[role] || mockData.users.student;
        const token = 'mock_token_' + role + '_' + Date.now();
        return {
            access_token: token,
            token_type: 'bearer',
            user: { ...user, email }
        };
    },
    logout: async () => {
        if (!USE_MOCK) return fetchWithAuth('/auth/logout', { method: 'POST' });
        await delay(200);
        return { message: 'Logged out successfully' };
    },
};

// HOD API
export const hodAPI = {
    // Faculty
    getFaculty: async () => {
        if (!USE_MOCK) return fetchWithAuth('/hod/faculty');
        await delay(300);
        return [...mockData.faculty];
    },
    createFaculty: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/hod/faculty', { method: 'POST', body: JSON.stringify(data) });
        await delay(400);
        const newFaculty = { id: Date.now().toString(), ...data, availability_status: true };
        mockData.faculty.push(newFaculty);
        return newFaculty;
    },
    updateFaculty: async (id, data) => {
        if (!USE_MOCK) return fetchWithAuth(`/hod/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        await delay(300);
        const index = mockData.faculty.findIndex(f => f.id === id);
        if (index >= 0) mockData.faculty[index] = { ...mockData.faculty[index], ...data };
        return mockData.faculty[index];
    },
    deleteFaculty: async (id) => {
        if (!USE_MOCK) return fetchWithAuth(`/hod/faculty/${id}`, { method: 'DELETE' });
        await delay(300);
        mockData.faculty = mockData.faculty.filter(f => f.id !== id);
        return { message: 'Deleted successfully' };
    },

    // Students
    getStudents: async (filters = {}) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams(filters).toString();
            return fetchWithAuth(`/hod/students${params ? `?${params}` : ''}`);
        }
        await delay(300);
        let students = [...mockData.students];
        if (filters.class_year) students = students.filter(s => s.class_year === filters.class_year);
        if (filters.section) students = students.filter(s => s.section === filters.section);
        return students;
    },
    createStudent: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/hod/students', { method: 'POST', body: JSON.stringify(data) });
        await delay(400);
        const newStudent = { id: Date.now().toString(), ...data };
        mockData.students.push(newStudent);
        return newStudent;
    },
    updateStudent: async (id, data) => {
        if (!USE_MOCK) return fetchWithAuth(`/hod/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        await delay(300);
        const index = mockData.students.findIndex(s => s.id === id);
        if (index >= 0) mockData.students[index] = { ...mockData.students[index], ...data };
        return mockData.students[index];
    },
    deleteStudent: async (id) => {
        if (!USE_MOCK) return fetchWithAuth(`/hod/students/${id}`, { method: 'DELETE' });
        await delay(300);
        mockData.students = mockData.students.filter(s => s.id !== id);
        return { message: 'Deleted successfully' };
    },

    // Events
    getEvents: async () => {
        if (!USE_MOCK) return fetchWithAuth('/hod/events');
        await delay(300);
        return [...mockData.events];
    },
    createEvent: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/hod/events', { method: 'POST', body: JSON.stringify(data) });
        await delay(400);
        const newEvent = { id: Date.now().toString(), ...data };
        mockData.events.push(newEvent);
        return newEvent;
    },
    deleteEvent: async (id) => {
        if (!USE_MOCK) return fetchWithAuth(`/hod/events/${id}`, { method: 'DELETE' });
        await delay(300);
        mockData.events = mockData.events.filter(e => e.id !== id);
        return { message: 'Deleted successfully' };
    },

    // Reports
    getAttendanceReport: async (filters = {}) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams(filters).toString();
            return fetchWithAuth(`/hod/reports/attendance${params ? `?${params}` : ''}`);
        }
        await delay(400);
        return { report: 'Attendance Report', data: [] };
    },
    getPerformanceReport: async (filters = {}) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams(filters).toString();
            return fetchWithAuth(`/hod/reports/performance${params ? `?${params}` : ''}`);
        }
        await delay(400);
        return { report: 'Performance Report', data: [] };
    },
};

// Faculty API
export const facultyAPI = {
    getProfile: async () => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/profile');
        await delay(300);
        return mockData.users.faculty;
    },
    updateProfile: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/profile', { method: 'PUT', body: JSON.stringify(data) });
        await delay(300);
        mockData.users.faculty = { ...mockData.users.faculty, ...data };
        return mockData.users.faculty;
    },
    getClasses: async () => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/classes');
        await delay(300);
        return { classes: [{ class_year: '3rd Year', section: 'A' }, { class_year: '3rd Year', section: 'B' }, { class_year: '2nd Year', section: 'A' }] };
    },
    getStudents: async (classYear, section) => {
        if (!USE_MOCK) return fetchWithAuth(`/faculty/students?class_year=${classYear}&section=${section}`);
        await delay(300);
        const students = mockData.students.filter(s => s.class_year === classYear && s.section === section);
        return { students };
    },

    // Attendance
    markAttendance: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/attendance', { method: 'POST', body: JSON.stringify(data) });
        await delay(500);
        return { message: 'Attendance marked successfully', count: data.entries?.length || 0 };
    },
    getAttendance: async (classYear, section, filters = {}) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams(filters).toString();
            return fetchWithAuth(`/faculty/attendance/${classYear}/${section}${params ? `?${params}` : ''}`);
        }
        await delay(300);
        return { attendance: [] };
    },
    getAttendanceSummary: async (classYear, section) => {
        if (!USE_MOCK) return fetchWithAuth(`/faculty/attendance/summary/${classYear}/${section}`);
        await delay(300);
        return { summary: [] };
    },

    // Marks
    enterMarks: async (data) => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/marks', { method: 'POST', body: JSON.stringify(data) });
        await delay(500);
        return { message: 'Marks entered successfully', count: data.entries?.length || 0 };
    },
    updateMarks: async (id, marksObtained) => {
        if (!USE_MOCK) return fetchWithAuth(`/faculty/marks/${id}?marks_obtained=${marksObtained}`, { method: 'PUT' });
        await delay(300);
        return { message: 'Marks updated successfully' };
    },
    getMarks: async (classYear, section, filters = {}) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams(filters).toString();
            return fetchWithAuth(`/faculty/marks/${classYear}/${section}${params ? `?${params}` : ''}`);
        }
        await delay(300);
        return { marks: [] };
    },

    // Events
    getEvents: async () => {
        if (!USE_MOCK) return fetchWithAuth('/faculty/events');
        await delay(300);
        return { events: [...mockData.events] };
    },
};

// Student API
export const studentAPI = {
    getProfile: async () => {
        if (!USE_MOCK) return fetchWithAuth('/student/profile');
        await delay(300);
        return mockData.users.student;
    },
    getAttendance: async (subject = null) => {
        if (!USE_MOCK) return fetchWithAuth(`/student/attendance${subject ? `?subject=${subject}` : ''}`);
        await delay(400);
        return {
            overall: { present: 42, absent: 5, late: 3, total_classes: 50, percentage: 84 },
            subject_breakdown: [
                { subject: 'Mathematics', present: 14, total: 16, percentage: 87 },
                { subject: 'Physics', present: 13, total: 15, percentage: 87 },
                { subject: 'Computer Science', present: 10, total: 12, percentage: 83 },
                { subject: 'English', present: 5, total: 7, percentage: 71 },
            ],
        };
    },
    getMarks: async (subject = null, examType = null) => {
        if (!USE_MOCK) {
            const params = new URLSearchParams();
            if (subject) params.append('subject', subject);
            if (examType) params.append('exam_type', examType);
            const queryString = params.toString();
            return fetchWithAuth(`/student/marks${queryString ? `?${queryString}` : ''}`);
        }
        await delay(400);
        return {
            overall: { total_obtained: 425, total_max: 500, percentage: 85 },
            subject_breakdown: [
                { subject: 'Mathematics', percentage: 88, exams: [{ exam_type: 'Internal 1', marks_obtained: 45, max_marks: 50 }, { exam_type: 'Internal 2', marks_obtained: 43, max_marks: 50 }] },
                { subject: 'Physics', percentage: 82, exams: [{ exam_type: 'Internal 1', marks_obtained: 40, max_marks: 50 }, { exam_type: 'Internal 2', marks_obtained: 42, max_marks: 50 }] },
                { subject: 'Computer Science', percentage: 90, exams: [{ exam_type: 'Internal 1', marks_obtained: 48, max_marks: 50 }, { exam_type: 'Internal 2', marks_obtained: 42, max_marks: 50 }] },
                { subject: 'English', percentage: 78, exams: [{ exam_type: 'Internal 1', marks_obtained: 38, max_marks: 50 }, { exam_type: 'Internal 2', marks_obtained: 40, max_marks: 50 }] },
            ],
        };
    },
    getEvents: async () => {
        if (!USE_MOCK) return fetchWithAuth('/student/events');
        await delay(300);
        return { events: [...mockData.events] };
    },
    getDashboard: async () => {
        if (!USE_MOCK) return fetchWithAuth('/student/dashboard');
        await delay(400);
        return {
            profile: mockData.users.student,
            attendance: { present: 42, total_classes: 50, percentage: 84 },
            marks: { percentage: 85 },
            recent_events: mockData.events.slice(0, 3),
        };
    },
};

export default { authAPI, hodAPI, facultyAPI, studentAPI };
