import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, Megaphone, Flag, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    tasks: 0,
    announcements: 0,
    reports: 0,
    users: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers = [];

    // Listen to tasks
    const tasksQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, tasks: snapshot.size }));
    });
    unsubscribers.push(unsubTasks);

    // Listen to announcements
    const announcementsQuery = query(collection(db, 'announcements'));
    const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, announcements: snapshot.size }));
    });
    unsubscribers.push(unsubAnnouncements);

    // Listen to pending reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'Pending')
    );
    const unsubReports = onSnapshot(reportsQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, reports: snapshot.size }));
    });
    unsubscribers.push(unsubReports);

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, users: snapshot.size }));
      setLoading(false);
    });
    unsubscribers.push(unsubUsers);

    // Listen to recent activity (tasks and announcements)
    const recentTasksQuery = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubRecentTasks = onSnapshot(recentTasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'task',
        ...doc.data(),
      }));

      const recentAnnouncementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(2)
      );
      const unsubRecentAnnouncements = onSnapshot(
        recentAnnouncementsQuery,
        (announcementSnapshot) => {
          const announcements = announcementSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'announcement',
            ...doc.data(),
          }));

          // Combine and sort by date
          const combined = [...tasks, ...announcements].sort(
            (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
          );
          setRecentActivity(combined.slice(0, 5));
        }
      );
      unsubscribers.push(unsubRecentAnnouncements);
    });
    unsubscribers.push(unsubRecentTasks);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const statCards = [
    {
      title: 'Active Tasks',
      value: stats.tasks,
      icon: CheckSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Announcements',
      value: stats.announcements,
      icon: Megaphone,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Pending Reports',
      value: stats.reports,
      icon: Flag,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-secondary">{currentUser?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-dark-600 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${stat.bgColor} ${stat.color} p-1.5 rounded-lg`}>
                <stat.icon size={16} />
              </div>
              <h3 className="text-xl font-bold">{stat.value}</h3>
            </div>
            <p className="text-xs text-secondary">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-600 border border-primary/20 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-secondary text-center py-6 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    item.type === 'task'
                      ? 'bg-blue-400/10 text-blue-400'
                      : 'bg-purple-400/10 text-purple-400'
                  }`}
                >
                  {item.type === 'task' ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Megaphone size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                  <p className="text-xs text-secondary line-clamp-1">
                    {item.description || item.content}
                  </p>
                  {item.createdAt && (
                    <p className="text-xs text-secondary mt-1">
                      {formatDistanceToNow(item.createdAt.toDate(), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
