import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';

const FreedomWall = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [formData, setFormData] = useState({
    content: '',
    isAnonymous: false
  });

  useEffect(() => {
    if (!db || !currentUser) {
      setError('Not authenticated or database unavailable.');
      setLoading(false);
      return;
    }

    const postsQuery = query(collection(db, 'freedom-wall-posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching posts:', err);
        if (err.code === 'permission-denied') {
          setError('Access denied. You do not have permission to view freedom wall posts.');
        } else {
          setError(`Failed to load posts: ${err.message}`);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      content: formData.content.trim(),
      authorId: currentUser.uid,
      authorName: formData.isAnonymous ? 'Anonymous' : currentUser.email,
      isAnonymous: formData.isAnonymous,
      createdAt: Timestamp.now()
    };

    try {
      await addDoc(collection(db, 'freedom-wall-posts'), postData);
      setSuccessModal({
        isOpen: true,
        message: 'Post has been published successfully!'
      });
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
      setErrorModal({
        isOpen: true,
        title: 'Failed to Create Post',
        message: error.code === 'permission-denied'
          ? 'You do not have permission to create posts.'
          : 'An error occurred while creating the post. Please try again.',
        details: error.message
      });
    }
  };

  const handleDelete = async (postId) => {
    setConfirmModal({
      isOpen: true,
      action: async () => {
        try {
          await deleteDoc(doc(db, 'freedom-wall-posts', postId));
          setSuccessModal({
            isOpen: true,
            message: 'Post has been deleted successfully!'
          });
        } catch (error) {
          console.error('Error deleting post:', error);
          setErrorModal({
            isOpen: true,
            title: 'Failed to Delete Post',
            message: error.code === 'permission-denied'
              ? 'You can only delete your own posts or you need admin privileges.'
              : 'An error occurred while deleting the post. Please try again.',
            details: error.message
          });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      content: '',
      isAnonymous: false
    });
    setShowModal(false);
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Freedom Wall</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>New Post</span>
          </button>
        </div>
        <div className="bg-dark-600 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Failed to Load Posts</h3>
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
        <div>
          <h1 className="text-3xl font-bold">Freedom Wall</h1>
          <p className="text-secondary text-sm mt-1">Share thoughts and ideas with the community</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={20} />
          <span>New Post</span>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length === 0 ? (
          <div className="col-span-full bg-dark-600 border border-primary/20 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-secondary mx-auto mb-3" />
            <p className="text-secondary">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className="bg-dark-600 border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {post.isAnonymous ? 'Anonymous' : post.authorName}
                    </p>
                    <p className="text-xs text-secondary">
                      {post.createdAt ? format(post.createdAt.toDate(), 'MMM dd, yyyy h:mm a') : 'Just now'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors flex-shrink-0 cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-secondary whitespace-pre-wrap break-words flex-1">
                {post.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-600 border border-primary/20 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">New Post</h2>
              <button onClick={resetForm} className="text-secondary hover:text-white cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Message *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your thoughts, ideas, or feedback..."
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-xs text-secondary mt-1">
                  {formData.content.length}/500 characters
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 bg-dark-700 border border-dark-800 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="anonymous" className="text-sm text-secondary cursor-pointer">
                  Post as Anonymous
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!formData.content.trim() || formData.content.length > 500}
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish Post
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-dark-700 hover:bg-dark-800 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={confirmModal.action}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        type="danger"
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

export default FreedomWall;
