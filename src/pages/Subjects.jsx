import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, Trash2, BookOpen, X } from 'lucide-react';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    const subjectsQuery = query(collection(db, 'subjects'));
    const unsubscribe = onSnapshot(subjectsQuery, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(subjectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const subjectData = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      createdAt: Timestamp.now()
    };

    try {
      if (editingSubject) {
        await updateDoc(doc(db, 'subjects', editingSubject.id), subjectData);
      } else {
        await addDoc(collection(db, 'subjects'), subjectData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      description: subject.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    // Check if tasks exist for this subject
    const tasksQuery = query(collection(db, 'tasks'), where('subjectId', '==', subjectId));
    const tasksSnapshot = await getDocs(tasksQuery);

    if (tasksSnapshot.size > 0) {
      alert(`Cannot delete this subject. It has ${tasksSnapshot.size} task(s) associated with it.`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteDoc(doc(db, 'subjects', subjectId));
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: ''
    });
    setEditingSubject(null);
    setShowModal(false);
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
        <h1 className="text-3xl font-bold">Subjects Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="col-span-full bg-dark-600 border border-primary/20 rounded-xl p-8 text-center">
            <p className="text-secondary">No subjects found. Create your first subject!</p>
          </div>
        ) : (
          subjects.map(subject => (
            <div key={subject.id} className="bg-dark-600 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="text-primary" size={24} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                    {subject.code}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{subject.name}</h3>
                {subject.description && (
                  <p className="text-sm text-secondary line-clamp-2">{subject.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingSubject ? 'Edit Subject' : 'New Subject'}</h2>
              <button onClick={resetForm} className="text-secondary hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS101"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Introduction to Computer Science"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-2 rounded-lg transition-colors"
                >
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
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
    </div>
  );
};

export default Subjects;
