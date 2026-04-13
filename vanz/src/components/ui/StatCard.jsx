import Card from './Card';

export default function StatCard({ label, value, icon, sub, color = 'red' }) {
    const colors = {
        red: 'bg-red-50 text-red-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-700',
    };
    return (
        <Card className="p-5 stat-card">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </Card>
    );
}
