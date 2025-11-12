import { useAuth } from '../contexts/AuthContext';
import { Menu, LogOut } from 'lucide-react';

const Header = ({ setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="bg-dark-600 border-b border-primary/20 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-white hover:text-primary transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 md:flex-none"></div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-secondary hidden sm:inline">
            {currentUser?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-800 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
