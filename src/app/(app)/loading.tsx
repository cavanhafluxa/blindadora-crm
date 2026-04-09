export default function Loading() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background gradients similar to page layout */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Animated Skeleton Layout */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-100/50 flex items-center justify-center p-4 shadow-sm border border-indigo-50/50">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-48 bg-slate-200/60 rounded-full" />
          <div className="h-3 w-32 bg-slate-200/40 rounded-full" />
        </div>
      </div>
    </div>
  )
}
