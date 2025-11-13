import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Users as UsersIcon, UserCheck, Shield, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [stats, setStats] = useState({
    students: 0,
    officers: 0,
    admins: 0,
    total: 0
  });

  useEffect(() => {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase db is not initialized');
      setError('Database connection not available.');
      setLoading(false);
      return;
    }

    let unsubscribe;
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        usersQuery, 
        (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(usersData);
          setFilteredUsers(usersData);

          // Calculate stats - users without role field are students by default
          const newStats = {
            students: usersData.filter(u => !u.role || u.role === 'student').length,
            officers: usersData.filter(u => u.role === 'officer').length,
            admins: usersData.filter(u => u.role === 'admin').length,
            total: usersData.length
          };
          setStats(newStats);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching users:', err);
          if (err.code === 'permission-denied') {
            setError('Access denied. Admin privileges required to view users.');
          } else {
            setError(`Failed to load users: ${err.message}`);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up users listener:', err);
      setError('Failed to initialize users list.');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'All') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    setConfirmModal({
      isOpen: true,
      action: async () => {
        try {
          await updateDoc(doc(db, 'users', selectedUser.id), {
            role: newRole,
            updatedAt: new Date()
          });
          
          setSuccessModal({
            isOpen: true,
            message: `Successfully updated ${selectedUser.firstName} ${selectedUser.lastName}'s role to ${newRole}!`
          });
          
          setShowRoleModal(false);
          setSelectedUser(null);
          setNewRole('');
        } catch (error) {
          console.error('Error updating role:', error);
          setErrorModal({
            isOpen: true,
            title: 'Failed to Update Role',
            message: error.code === 'permission-denied'
              ? 'Permission denied. Please check your Firebase Security Rules configuration.'
              : 'An error occurred while updating the user role. Please try again.',
            details: error.message
          });
        }
      }
    });
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setNewRole('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'officer': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Shield;
      case 'officer': return UserCheck;
      default: return UsersIcon;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <div className="bg-dark-600 border border-red-500/30 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Failed to Load Users</h3>
          <p className="text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-dark-900 font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Users Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-600 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <UsersIcon className="text-primary" size={16} />
            </div>
            <span className="text-xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-secondary">Total Users</p>
        </div>
        <div className="bg-dark-600 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <UsersIcon className="text-blue-400" size={16} />
            </div>
            <span className="text-xl font-bold">{stats.students}</span>
          </div>
          <p className="text-xs text-secondary">Students</p>
        </div>
        <div className="bg-dark-600 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <UserCheck className="text-purple-400" size={16} />
            </div>
            <span className="text-xl font-bold">{stats.officers}</span>
          </div>
          <p className="text-xs text-secondary">Officers</p>
        </div>
        <div className="bg-dark-600 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <Shield className="text-red-400" size={16} />
            </div>
            <span className="text-xl font-bold">{stats.admins}</span>
          </div>
          <p className="text-xs text-secondary">Admins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-600 border border-primary/20 rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="officer">Officers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table/Cards */}
      <div className="bg-dark-600 border border-primary/20 rounded-lg overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-secondary text-sm">No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700 border-b border-primary/20">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Role</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Joined</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {filteredUsers.map(user => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-dark-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-medium text-sm">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                            <span className="font-medium text-sm truncate">{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-secondary text-sm">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                            <RoleIcon size={12} />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary text-xs">
                          {user.createdAt ? (typeof user.createdAt.toDate === 'function' ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : format(new Date(user.createdAt), 'MMM dd, yyyy')) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleEditRole(user)}
                            className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md transition-colors cursor-pointer"
                            title="Edit role"
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-primary/10">
              {filteredUsers.map(user => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <div key={user.id} className="p-4 hover:bg-dark-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-secondary mb-2 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                            <RoleIcon size={12} />
                            {user.role}
                          </span>
                          <span className="text-xs text-secondary">
                            {user.createdAt ? (typeof user.createdAt.toDate === 'function' ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : format(new Date(user.createdAt), 'MMM dd, yyyy')) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditRole(user)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md transition-colors cursor-pointer flex-shrink-0"
                        title="Edit role"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Change User Role</h2>
              <button onClick={closeRoleModal} className="text-secondary hover:text-white cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-sm text-secondary">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">Current Role:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="student">Student</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Role Descriptions */}
              <div className="bg-dark-700 rounded-lg p-3 text-xs">
                <p className="text-secondary mb-2">Role Descriptions:</p>
                <ul className="space-y-1 text-secondary">
                  <li><strong className="text-blue-400">Student:</strong> Default role with basic access</li>
                  <li><strong className="text-purple-400">Officer:</strong> Extended privileges for organization officers</li>
                  <li><strong className="text-red-400">Admin:</strong> Full access to all features and settings</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdateRole}
                  disabled={newRole === selectedUser.role}
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Role
                </button>
                <button
                  onClick={closeRoleModal}
                  className="flex-1 bg-dark-700 hover:bg-dark-800 text-white py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={confirmModal.action}
        title="Confirm Role Change"
        message={`Are you sure you want to change ${selectedUser?.firstName} ${selectedUser?.lastName}'s role to ${newRole}? This will affect their permissions in the system.`}
        confirmText="Update Role"
        type="warning"
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '', details: '' })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: '' })}
        message={successModal.message}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </div>
  );
};

export default Users;
