import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, CheckSquare, Megaphone, Flag, Users, MessageSquare } from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/freedom-wall', label: 'Freedom Wall', icon: MessageSquare },
    { path: '/reports', label: 'Reports', icon: Flag },
    { path: '/users', label: 'Users', icon: Users },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
                <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-64 bg-dark-600 border-r border-primary/20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-dark-900">
                T
              </div>
              <span className="font-bold text-lg">Triji Admin</span>
            </div>
                        <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-secondary hover:text-white cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-dark-900 font-medium'
                      : 'text-secondary hover:bg-dark-700 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
