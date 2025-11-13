import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, isDemoMode } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If in demo mode, show configuration warning
    if (isDemoMode) {
      setError('Firebase not configured');
      setLoading(false);
      return;
    }

    try {
      // Set persistence to local (persist across browser sessions)
      setPersistence(auth, browserLocalPersistence).catch(err => {
        console.error('Failed to set persistence:', err);
      });

      // Simply track auth state - let Firebase Rules handle authorization
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      }, (err) => {
        console.error('Auth state change error:', err);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    error
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-dark-600 border border-orange-500/50 rounded-xl p-8 max-w-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-orange-400 mb-2">⚠️ Firebase Not Configured</h2>
              <p className="text-secondary mb-4">
                The application requires Firebase credentials to function. Please follow these steps to set it up:
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="font-bold mb-2 text-primary">Step 1: Get Firebase Credentials</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-secondary">
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a></li>
                <li>Select or create your project</li>
                <li>Go to Project Settings → General → Your apps</li>
                <li>Click the web icon (&lt;/&gt;) to create a web app</li>
                <li>Copy the configuration values</li>
              </ol>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="font-bold mb-2 text-primary">Step 2: Update .env File</h3>
              <p className="text-sm text-secondary mb-2">Edit the <code className="bg-dark-900 px-2 py-1 rounded">.env</code> file in the project root:</p>
              <pre className="bg-dark-900 p-3 rounded text-xs overflow-x-auto">
{`VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123`}
              </pre>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="font-bold mb-2 text-primary">Step 3: Enable Firebase Services</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-secondary">
                <li>Enable <strong>Authentication</strong> → Email/Password</li>
                <li>Create <strong>Firestore Database</strong></li>
                <li>Add an admin user in Authentication</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-3 rounded-lg transition-colors"
            >
              Reload After Configuration
            </button>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-dark-700 hover:bg-dark-800 text-white font-medium py-3 rounded-lg transition-colors text-center"
            >
              Open Firebase Console
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
