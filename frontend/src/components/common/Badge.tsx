import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getColors = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'verified':
      case 'matched':
      case 'passed':
      case 'validation_passed':
      case 'matching_passed':
      case 'active':
      case 'success':
      case 'connected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/20';

      case 'ready_for_payment':
      case 'payment_requested':
      case 'payment_processing':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/20';

      case 'approval_pending':
      case 'pending':
      case 'waiting':
      case 'draft':
      case 'ocr_completed':
      case 'warnings':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/20';

      case 'validation_failed':
      case 'matching_failed':
      case 'failed':
      case 'rejected':
      case 'mismatched':
      case 'inactive':
      case 'critical':
      case 'missing_po':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/20';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (s: string) => {
    if (!s) return 'Unknown';
    return s.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};
