import { useState, useEffect } from 'react';
import { Package, Truck, TrendingUp, Receipt } from 'lucide-react';
import { StatCard, Card, CardHeader, Btn, Badge } from '../components/ui';
import { getJson } from '../api/http';

export default function DashboardView({ onNavigate }) {
    const [pendingOrders,   setPendingOrders]   = useState([]);
    const [recentVouchers,  setRecentVouchers]  = useState([]);
    const [stats,           setStats]           = useState({ orders: 0, deliverers: 0, revenue: 0, pendingVouchers: 0 });
    const [loading,         setLoading]         = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        Promise.all([
            getJson('/orders').catch(() => []),
            getJson('/deliverers').catch(() => []),
            getJson('/expense-vouchers').catch(() => []),
            getJson('/deliveries').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([orders, deliverers, vouchers, deliveries, stores, customers, profiles]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap    = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap   = new Map(stores.map(s => [s.store_id, s]));

            // Stats
            const todayOrders   = (orders || []).filter(o => String(o.order_date || '').slice(0, 10) === today);
            const activeDeliverersCount = (deliverers || []).filter(d => d.current_status !== 'offline').length;
            const todayRevenue  = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
            const pendingVouchersCount = (vouchers || []).filter(v => v.status === 'submitted').length;

            setStats({
                orders:     todayOrders.length,
                deliverers: activeDeliverersCount,
                revenue:    todayRevenue,
                pendingVouchers: pendingVouchersCount,
            });

            // Dispatch queue: CONFIRMED or PREPARING orders
            const queueOrders = (orders || [])
                .filter(o => o.status === 'confirmed' || o.status === 'preparing')
                .slice(0, 5)
                .map(o => {
                    const cust  = custMap.get(o.customer_id) || {};
                    const prof  = profileMap.get(cust.profile_id) || {};
                    const store = storeMap.get(o.store_id) || {};
                    return {
                        id:       o.order_code,
                        store:    store.name || '-',
                        customer: prof.full_name || cust.customer_code || '-',
                        time:     String(o.order_date || '').slice(11, 16) || '—',
                    };
                });
            setPendingOrders(queueOrders);

            // Recent vouchers (last 5)
            const deliveryMap  = new Map((deliveries  || []).map(d => [d.delivery_id, d]));
            const delivererMap = new Map((deliverers  || []).map(d => [d.deliverer_id, d]));
            const recent = [...(vouchers || [])]
                .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
                .slice(0, 5)
                .map(v => {
                    const delivery  = deliveryMap.get(v.delivery_id) || {};
                    const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                    const prof      = profileMap.get(deliverer.profile_id) || {};
                    return {
                        id:            v.voucher_code,
                        delivererName: prof.full_name || deliverer.deliverer_code || '—',
                        date:          String(v.voucher_date || '').slice(0, 10),
                        status:        v.status || 'draft',
                        total:         Number(v.total_amount || 0),
                    };
                });
            setRecentVouchers(recent);
        }).catch(() => {}).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h2 className="text-2xl font-black text-slate-900">Good morning 👋</h2>
                <p className="text-sm text-slate-600">{today} · Here's what's happening on your platform today.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Orders Today"     value={loading ? '…' : stats.orders}                         icon={<Package  size={18} />} sub="Placed today"          color="red"   />
                <StatCard label="Active Deliverers" value={loading ? '…' : stats.deliverers}                    icon={<Truck    size={18} />} sub="Not offline"           color="blue"  />
                <StatCard label="Revenue Today"     value={loading ? '…' : `฿${stats.revenue.toLocaleString()}`} icon={<TrendingUp size={18} />} sub="From today's orders" color="green" />
                <StatCard label="Pending Vouchers"  value={loading ? '…' : stats.pendingVouchers}               icon={<Receipt  size={18} />} sub="Awaiting approval"     color="amber" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader title="Dispatch Queue" action={<Btn size="sm" variant="secondary" onClick={() => onNavigate('dispatch_form')}>Open Dispatch →</Btn>} />
                    <div className="p-4 space-y-2">
                        {loading ? (
                            <p className="text-sm text-slate-400 text-center py-4">Loading…</p>
                        ) : pendingOrders.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No orders awaiting dispatch</p>
                        ) : pendingOrders.map(o => (
                            <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
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
                        {loading ? (
                            <p className="text-sm text-slate-400 text-center py-4">Loading…</p>
                        ) : recentVouchers.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No vouchers yet</p>
                        ) : recentVouchers.map(v => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{v.id}</p>
                                    <p className="text-xs text-slate-500">{v.delivererName} · {v.date}</p>
                                </div>
                                <Badge color={v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'amber'}>{v.status}</Badge>
                                <span className="text-sm font-bold text-slate-900 shrink-0">฿{v.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
