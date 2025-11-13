import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, X, Filter } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';

const Announcements = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [filterExpiry, setFilterExpiry] = useState('All');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General',
    expiresAt: ''
  });

  useEffect(() => {
    if (!db || !currentUser) {
      setError('Not authenticated or database unavailable.');
      setLoading(false);
      return;
    }

    const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      announcementsQuery, 
      (snapshot) => {
        const announcementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAnnouncements(announcementsData);
        setFilteredAnnouncements(announcementsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching announcements:', err);
        if (err.code === 'permission-denied') {
          setError('Access denied. You do not have permission to view announcements.');
        } else {
          setError(`Failed to load announcements: ${err.message}`);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Filter announcements
  useEffect(() => {
    let filtered = announcements;

    if (filterType !== 'All') {
      filtered = filtered.filter(announcement => announcement.type === filterType);
    }

    if (filterExpiry === 'Active') {
      filtered = filtered.filter(announcement => 
        !announcement.expiresAt || isAfter(announcement.expiresAt.toDate(), new Date())
      );
    } else if (filterExpiry === 'Expired') {
      filtered = filtered.filter(announcement => 
        announcement.expiresAt && !isAfter(announcement.expiresAt.toDate(), new Date())
      );
    }

    setFilteredAnnouncements(filtered);
  }, [filterType, filterExpiry, announcements]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const announcementData = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      authorName: currentUser.email,
      authorId: currentUser.uid,
      expiresAt: formData.expiresAt ? Timestamp.fromDate(new Date(formData.expiresAt)) : null,
      createdAt: Timestamp.now()
    };

    try {
      if (editingAnnouncement) {
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), announcementData);
        setSuccessModal({ 
          isOpen: true, 
          message: 'Announcement has been updated successfully!' 
        });
      } else {
        await addDoc(collection(db, 'announcements'), announcementData);
        setSuccessModal({ 
          isOpen: true, 
          message: 'New announcement has been published successfully!' 
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      setErrorModal({
        isOpen: true,
        title: 'Failed to Save Announcement',
        message: error.code === 'permission-denied'
          ? 'You do not have permission to create or edit announcements.'
          : 'An error occurred while saving the announcement. Please try again.',
        details: error.message
      });
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      expiresAt: announcement.expiresAt?.toDate().toISOString().split('T')[0] || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (announcement) => {
    // Check permission based on Firebase rules
    setConfirmModal({
      isOpen: true,
      action: async () => {
        try {
          await deleteDoc(doc(db, 'announcements', announcement.id));
          setSuccessModal({ 
            isOpen: true, 
            message: 'Announcement has been deleted successfully!' 
          });
        } catch (error) {
          console.error('Error deleting announcement:', error);
          setErrorModal({
            isOpen: true,
            title: 'Failed to Delete Announcement',
            message: error.code === 'permission-denied'
              ? 'You can only delete your own announcements or you need admin privileges.'
              : 'An error occurred while deleting the announcement. Please try again.',
            details: error.message
          });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'General',
      expiresAt: ''
    });
    setEditingAnnouncement(null);
    setShowModal(false);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Event': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Reminder': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return !isAfter(expiresAt.toDate(), new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Announcements Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-600 border border-primary/20 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="All">All Types</option>
            <option value="General">General</option>
            <option value="Reminder">Reminder</option>
            <option value="Event">Event</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={filterExpiry}
            onChange={(e) => setFilterExpiry(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-8 text-center">
            <p className="text-secondary">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => (
            <div 
              key={announcement.id} 
              className={`bg-dark-600 border rounded-xl p-6 hover:border-primary/40 transition-colors ${
                isExpired(announcement.expiresAt) ? 'border-gray-500/20 opacity-60' : 'border-primary/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold">{announcement.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs border ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    {isExpired(announcement.expiresAt) && (
                      <span className="px-3 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-400 border-gray-500/50">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-secondary mb-3 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-secondary">
                    <span>By: {announcement.authorName}</span>
                    <span>Posted: {announcement.createdAt ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</span>
                    {announcement.expiresAt && (
                      <span>Expires: {format(announcement.expiresAt.toDate(), 'MMM dd, yyyy')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    disabled={announcement.authorId !== currentUser.uid}
                    title={announcement.authorId !== currentUser.uid ? 'Can only delete your own announcements' : ''}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={resetForm} className="text-secondary hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="General">General</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Event">Event</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-2 rounded-lg transition-colors"
                >
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
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

export default Announcements;
