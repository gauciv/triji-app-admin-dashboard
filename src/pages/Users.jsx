import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Users as UsersIcon, UserCheck, Shield } from 'lucide-react';
import { format } from 'date-fns';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
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

          // Calculate stats
          const newStats = {
            students: usersData.filter(u => u.role === 'student').length,
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
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Users;
