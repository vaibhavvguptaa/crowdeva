import React from 'react';

interface ProjectListSkeletonProps {
  viewMode?: 'grid' | 'list';
  items?: number;
}

// Lightweight animated skeleton for projects loading
export const ProjectListSkeleton: React.FC<ProjectListSkeletonProps> = ({ viewMode = 'list', items = 6 }) => {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  const skeletonCard = (
    <div className={`rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-sm p-5 ${shimmer}`}> 
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200/80 rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-slate-200/80 rounded mb-2" />
      <div className="h-3 w-5/6 bg-slate-200/70 rounded mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );

  const skeletonRow = (
    <div className={`p-4 lg:p-5 border-b border-slate-100 ${shimmer}`}> 
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-200/70 rounded hidden lg:block" />
          </div>
        </div>
        <div className="hidden lg:flex lg:col-span-2 justify-center">
          <div className="h-6 w-24 rounded-lg bg-slate-200" />
        </div>
        <div className="hidden lg:flex lg:col-span-2 justify-center">
          <div className="h-4 w-28 rounded bg-slate-200" />
        </div>
        <div className="hidden lg:flex lg:col-span-2 justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-8 h-8 rounded-full bg-slate-200" />
        </div>
        <div className="hidden lg:flex lg:col-span-2 justify-center">
          <div className="h-6 w-20 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: items }).map((_, i) => (
            <React.Fragment key={i}>{skeletonCard}</React.Fragment>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm">
          <div className="hidden lg:grid grid-cols-12 gap-4 bg-slate-50/50 px-6 py-4 rounded-t-2xl border-b border-slate-200/50" />
          {Array.from({ length: items }).map((_, i) => (
            <React.Fragment key={i}>{skeletonRow}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectListSkeleton;
