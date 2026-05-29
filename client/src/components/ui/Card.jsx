export default function Card({ children, className = '' }) {
    return <div className={`bg-red-50/40 text-red-950 dark:bg-[#5c0f0f] dark:text-red-50 rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm transition-colors duration-300 ${className}`}>{children}</div>;
}
