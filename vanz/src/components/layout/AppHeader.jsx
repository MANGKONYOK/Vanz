import { Menu } from 'lucide-react';

export default function AppHeader({ isSidebarOpen, setIsSidebarOpen }) {
    return (
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 shrink-0 z-10 shadow-md">
            {!isSidebarOpen && (
                <button className="shrink-0 mr-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="w-5 h-5" />
                </button>
            )}
            <div className="flex items-center gap-2 text-sm min-w-0">
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0">
            </div>
        </header>
    );
}
