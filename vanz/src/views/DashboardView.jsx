import { Package, Truck, TrendingUp, Receipt } from 'lucide-react';
import { StatCard, Card, CardHeader, Btn, Badge } from '../components/ui';
import { MOCK_PREPARED_ORDERS, INITIAL_EXPENSE_VOUCHERS } from '../data/mockData';

export default function DashboardView({ onNavigate }) {
    return (
        <div className="space-y-6 fade-in">
            <div>
                <h2 className="text-2xl font-black text-slate-900">Good morning 👋</h2>
                <p className="text-sm text-slate-600">Here's what's happening on your platform today.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Orders Today" value="24" icon={<Package size={18} />} sub="+8 from yesterday" color="red" />
                <StatCard label="Active Deliverers" value="12" icon={<Truck size={18} />} sub="3 currently dispatched" color="blue" />
                <StatCard label="Revenue Today" value="฿3,480" icon={<TrendingUp size={18} />} sub="฿145 avg per order" color="green" />
                <StatCard label="Pending Vouchers" value="5" icon={<Receipt size={18} />} sub="Awaiting approval" color="amber" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader title="Prepared Queue" action={<Btn size="sm" variant="secondary" onClick={() => onNavigate('dispatch_form')}>Open Dispatch →</Btn>} />
                    <div className="p-4 space-y-2">
                        {MOCK_PREPARED_ORDERS.map(o => (
                            <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{o.id}</p>
                                    <p className="text-xs text-slate-500 truncate">{o.store} · {o.customer}</p>
                                </div>
                                <span className="text-xs text-amber-700 font-semibold shrink-0">{o.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <CardHeader title="Recent Vouchers" action={<Btn size="sm" variant="secondary" onClick={() => onNavigate('expense_list')}>View All →</Btn>} />
                    <div className="p-4 space-y-2">
                        {INITIAL_EXPENSE_VOUCHERS.map(v => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{v.id}</p>
                                    <p className="text-xs text-slate-500">{v.delivererName} · {v.date}</p>
                                </div>
                                <Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>{v.status}</Badge>
                                <span className="text-sm font-bold text-slate-900 shrink-0">฿{v.total}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
