import { X, AlertCircle, RefreshCw } from 'lucide-react';

const ErrorModal = ({ 
  isOpen, 
  onClose, 
  title = 'Error', 
  message, 
  details = null,
  onRetry = null 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-600 border border-red-500/30 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="text-red-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-red-400">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ml-11 space-y-3">
          <p className="text-secondary">{message}</p>
          
          {details && (
            <div className="bg-dark-700 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400 font-mono break-all">{details}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          {onRetry && (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-dark-900 font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
