import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

const Tasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    deadline: '',
    status: 'Pending'
  });

  // Fetch tasks and subjects
  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
      setFilteredTasks(tasksData);
      setLoading(false);
    });

    const subjectsQuery = query(collection(db, 'subjects'));
    const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(subjectsData);
    });

    return () => {
      unsubTasks();
      unsubSubjects();
    };
  }, []);

  // Filter tasks
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterSubject !== 'All') {
      filtered = filtered.filter(task => task.subjectId === filterSubject);
    }

    setFilteredTasks(filtered);
  }, [searchTerm, filterStatus, filterSubject, tasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedSubject = subjects.find(s => s.id === formData.subjectId);
    
    const taskData = {
      title: formData.title,
      description: formData.description,
      subjectId: formData.subjectId,
      subjectCode: selectedSubject?.code || '',
      subjectName: selectedSubject?.name || '',
      deadline: Timestamp.fromDate(new Date(formData.deadline)),
      status: formData.status,
      createdBy: currentUser.uid,
      createdAt: Timestamp.now()
    };

    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      subjectId: task.subjectId,
      deadline: task.deadline?.toDate().toISOString().split('T')[0] || '',
      status: task.status
    });
    setShowModal(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      deadline: '',
      status: 'Pending'
    });
    setEditingTask(null);
    setShowModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    }
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
        <h1 className="text-3xl font-bold">Tasks Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-600 border border-primary/20 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="All">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-8 text-center">
            <p className="text-secondary">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="bg-dark-600 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-secondary mb-3">{task.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-primary">{task.subjectCode}</span> - {task.subjectName}
                    </span>
                    <span>Deadline: {task.deadline ? format(task.deadline.toDate(), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
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
              <h2 className="text-2xl font-bold">{editingTask ? 'Edit Task' : 'New Task'}</h2>
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
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="">Select subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deadline *</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-800 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark-900 font-medium py-2 rounded-lg transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
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

export default Tasks;
