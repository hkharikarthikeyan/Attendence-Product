import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
const SESSIONS_KEY = 'app_sessions';
const ACTIVE_SESSION_KEY = 'active_session';

const readSessions = () => {
    try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeSessions = (sessions) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

const readSessionStorage = (key) => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeSessionStorage = (key, value) => {
    if (!value) {
        sessionStorage.removeItem(key);
        return;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
};

const getActiveSession = () => readSessionStorage(ACTIVE_SESSION_KEY);

const setActiveSession = (session) => {
    if (!session) {
        writeSessionStorage(ACTIVE_SESSION_KEY, null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return;
    }

    writeSessionStorage(ACTIVE_SESSION_KEY, session);
    sessionStorage.setItem('token', session.access_token);
    sessionStorage.setItem('user', JSON.stringify(session.user));
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activeSession = getActiveSession();

        if (activeSession?.user && activeSession?.access_token) {
            setUser(activeSession.user);
        } else {
            const storedUser = sessionStorage.getItem('user');
            const token = sessionStorage.getItem('token');

            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role) => {
        try {
            const response = await authAPI.login(email, password, role);
            const sessionKey = `${response.user.email || response.user.id || 'user'}:${role || response.user.role || 'user'}`;
            const sessions = readSessions();
            const session = {
                key: sessionKey,
                access_token: response.access_token,
                user: response.user,
                role,
                email,
            };

            sessions[sessionKey] = session;
            writeSessions(sessions);
            setActiveSession(session);
            setUser(response.user);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        const activeSession = getActiveSession();
        const sessions = readSessions();

        if (activeSession?.key) {
            delete sessions[activeSession.key];
            writeSessions(sessions);
        }

        // Always clear the active session and any cached account data so logout
        // cannot automatically reopen a previous dashboard.
        localStorage.removeItem(SESSIONS_KEY);
        sessionStorage.removeItem(ACTIVE_SESSION_KEY);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        setActiveSession(null);
        setUser(null);
    };

    const switchAccount = (sessionKey) => {
        const sessions = readSessions();
        const nextSession = sessions[sessionKey];

        if (!nextSession) {
            return false;
        }

        setActiveSession(nextSession);
        setUser(nextSession.user);
        return true;
    };

    const value = {
        user,
        login,
        logout,
        switchAccount,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
