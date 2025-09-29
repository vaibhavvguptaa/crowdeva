import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, retryLabel = 'Try Again' }) => {
  return (
    <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-700 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};
