"use client";
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  const actualTotalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    if (actualTotalPages <= 1) return [] as (number | string)[];
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(actualTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < actualTotalPages) {
      if (endPage < actualTotalPages - 1) pages.push('...');
      pages.push(actualTotalPages);
    }
    return pages;
  }, [currentPage, pageSize, actualTotalPages]);

  if (actualTotalPages <= 1) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-t border-slate-200/50 rounded-b-2xl">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white/80 hover:bg-white hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange?.(Math.min(actualTotalPages, currentPage + 1))}
          disabled={currentPage === actualTotalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white/80 hover:bg-white hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-green-600">{startItem}</span> to{' '}
            <span className="font-semibold text-green-600">{endItem}</span> of{' '}
            <span className="font-semibold text-green-600">{totalItems}</span> projects
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex gap-2 rounded-xl" aria-label="Pagination">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 bg-white/80 text-sm font-medium text-slate-600 hover:bg-white hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </button>
            {pageNumbers.map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={clsx(
                    'relative inline-flex items-center justify-center w-10 h-10 rounded-full border text-sm font-medium transition-all duration-200',
                    {
                      'bg-gradient-to-r from-green-600 to-teal-600 border-transparent text-white shadow-md': page === currentPage,
                      'bg-white/80 border-slate-300 text-slate-700 hover:bg-white hover:text-green-600 hover:border-green-300 hover:shadow-sm': page !== currentPage,
                    }
                  )}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center justify-center w-10 h-10 text-slate-400"
                >
                  {page}
                </span>
              )
            ))}
            <button
              onClick={() => onPageChange?.(Math.min(actualTotalPages, currentPage + 1))}
              disabled={currentPage === actualTotalPages}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 bg-white/80 text-sm font-medium text-slate-600 hover:bg-white hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export const MemoPagination = React.memo(Pagination);
