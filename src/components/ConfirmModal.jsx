import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400',
          buttonBg: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-500/20',
          iconColor: 'text-orange-400',
          buttonBg: 'bg-orange-500 hover:bg-orange-600'
        };
      default:
        return {
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-400',
          buttonBg: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-600 border border-primary/20 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${styles.iconBg} rounded-lg`}>
              <AlertTriangle className={styles.iconColor} size={24} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-secondary mb-6 ml-11">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-800 text-white rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 ${styles.buttonBg} text-white rounded-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
