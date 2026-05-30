export default function Badge({ children, color = 'gray' }) {
    const colors = {
        gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
        bronze: 'bg-gradient-to-r from-amber-100 to-orange-200 text-amber-900 border-amber-300 dark:from-[#6E3A20] dark:to-[#9C5A3C] dark:text-orange-50 dark:border-[#9C5A3C] font-bold shadow-sm',
        silver: 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border-slate-400 dark:from-[#4E5D6C] dark:to-[#7E8E9F] dark:text-slate-50 dark:border-[#7E8E9F] font-bold shadow-sm',
        gold: 'bg-gradient-to-r from-yellow-100 to-amber-200 text-amber-950 border-yellow-400 dark:from-[#8C6D1F] dark:to-[#BFA13F] dark:text-yellow-50 dark:border-[#BFA13F] font-bold shadow-sm',
        platinum: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 dark:from-[#2C3E50] dark:to-[#3E5C76] dark:text-slate-100 dark:border-[#3E5C76] font-bold shadow-sm',
    };

    let content = children;
    if (typeof children === 'string') {
        const str = children.toLowerCase();
        content = str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
    }

    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border border-transparent dark:border-current/10 ${colors[color]}`}>{content}</span>;
}

