import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, Search, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (!db) {
      setError('Database connection unavailable.');
      setLoading(false);
      return;
    }

    const reportsQuery = query(collection(db, 'reports'), orderBy('reportedAt', 'desc'));
    const unsubscribe = onSnapshot(
      reportsQuery, 
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);
        setFilteredReports(reportsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching reports:', err);
        if (err.code === 'permission-denied') {
          setError('Access denied. Admin privileges required to view reports.');
        } else {
          setError(`Failed to load reports: ${err.message}`);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter reports
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    setFilteredReports(filtered);
  }, [searchTerm, filterStatus, reports]);

  const updateStatus = async (reportId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus
      });
      toast.success(`Report marked as ${newStatus.toLowerCase()}!`);
    } catch (error) {
      console.error('Error updating report status:', error);
      if (error.code === 'permission-denied') {
        toast.error('Access denied. Admin privileges required to update reports.');
      } else {
        toast.error('Failed to update report status. Please try again.');
      }
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        toast.success('Report deleted successfully!');
      } catch (error) {
        console.error('Error deleting report:', error);
        if (error.code === 'permission-denied') {
          toast.error('Access denied. Admin privileges required to delete reports.');
        } else {
          toast.error('Failed to delete report. Please try again.');
        }
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
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
        <h1 className="text-3xl font-bold">Reports Management</h1>
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full">
            {reports.filter(r => r.status === 'Pending').length} Pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-600 border border-primary/20 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search reports..."
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
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-dark-600 border border-primary/20 rounded-xl p-8 text-center">
            <p className="text-secondary">No reports found</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="bg-dark-600 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3 flex-wrap">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                      {report.reportType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-secondary mb-3">{report.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-secondary">
                    <span>Reported by: {report.reportedBy}</span>
                    <span>Date: {report.reportedAt ? format(report.reportedAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                    {report.postId && (
                      <span className="text-primary">Post ID: {report.postId}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.status === 'Pending' && (
                    <button
                      onClick={() => updateStatus(report.id, 'Reviewed')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                    >
                      <Eye size={16} />
                      <span>Mark Reviewed</span>
                    </button>
                  )}
                  {report.status === 'Reviewed' && (
                    <button
                      onClick={() => updateStatus(report.id, 'Resolved')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
                    >
                      <CheckCircle size={16} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.id)}
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
    </div>
  );
};

export default Reports;
