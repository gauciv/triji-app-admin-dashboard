import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = ({ setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    const loadingToast = toast.loading('Logging out...');
    
    try {
      // Add a small delay to make the logout feel more intentional
      await new Promise(resolve => setTimeout(resolve, 500));
      await logout();
      toast.success('Logged out successfully', { id: loadingToast });
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout. Please try again.', { id: loadingToast });
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-dark-600 border-b border-primary/20 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-white hover:text-primary transition-colors cursor-pointer"
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
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-800 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Logging out...</span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
