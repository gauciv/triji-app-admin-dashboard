import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Download from './pages/Download';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import Users from './pages/Users';
import FreedomWall from './pages/FreedomWall';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c222f',
              color: '#fff',
              border: '1px solid rgba(34, 229, 132, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#22e584',
                secondary: '#1c222f',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1c222f',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Download />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="freedom-wall" element={<FreedomWall />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
