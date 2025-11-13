import { X, CheckCircle } from 'lucide-react';

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title = 'Success', 
  message,
  autoClose = false,
  autoCloseDelay = 2000
}) => {
  if (!isOpen) return null;

  if (autoClose) {
    setTimeout(() => {
      onClose();
    }, autoCloseDelay);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-600 border border-green-500/30 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-green-400">{title}</h2>
          </div>
                    <button
            onClick={onClose}
            className="absolute top-3 right-3 text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-secondary ml-11 mb-6">{message}</p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
