import { Menu, Moon, Sun } from 'lucide-react';

export default function AppHeader({ isSidebarOpen, setIsSidebarOpen, isDarkMode, setIsDarkMode }) {
    return (
        <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-5 shrink-0 z-10 shadow-sm transition-colors duration-300">
            {!isSidebarOpen && (
                <button className="shrink-0 mr-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="w-5 h-5" />
                </button>
            )}
            
            <div className="flex items-center gap-2 text-sm min-w-0">
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                        isDarkMode 
                            ? 'bg-white text-slate-900 hover:bg-slate-100 hover:scale-105' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105'
                    }`}
                    title="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
            
            <div className="ml-auto flex items-center gap-2 shrink-0">
            </div>
        </header>
    );
}
