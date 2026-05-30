import { useState, useEffect, useRef } from 'react';
import { Package, Truck, TrendingUp, Receipt, ArrowRight, Clock, Users, Store, CreditCard, Activity, ChevronRight, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { Card, CardHeader, Btn, Badge } from '../components/ui';
import { getJson } from '../api/http';

/* ── Animated counter ── */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const num = typeof value === 'number' ? value : parseInt(value) || 0;
        if (num === 0) { setDisplay(0); return; }
        const duration = 800;
        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * num));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [value]);
    return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

/* ── Stat Card (redesigned inline) ── */
function DashStatCard({ label, value, icon, trend, trendLabel, gradient, loading, delay = 0 }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-[#5c0f0f] text-red-950 dark:text-red-50 backdrop-blur-sm p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/10 shadow-sm group stat-card ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient}`} />
            {/* Subtle glow */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${gradient}`} />

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
                    {icon}
                </div>
                {trend !== undefined && !loading && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trendLabel || `${Math.abs(trend)}%`}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[32px] font-black tracking-tight text-red-950 dark:text-red-50 leading-none mb-1">
                    {loading ? (
                        <span className="inline-block w-16 h-8 rounded-lg bg-red-200/50 dark:bg-red-800/30 animate-pulse" />
                    ) : value}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider mt-2">{label}</p>
            </div>
        </div>
    );
}

/* ── Quick Action Button ── */
function QuickAction({ icon, label, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] hover:bg-white/[0.08] dark:hover:bg-white/[0.05] transition-all duration-200 hover:scale-[1.02] group text-left flex-1 min-w-[180px]`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${color} shadow-md group-hover:shadow-lg transition-shadow`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{label}</p>
            </div>
            <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
        </button>
    );
}

/* ── Status Dot ── */
function StatusDot({ status }) {
    const colors = {
        SUBMITTED: 'bg-amber-400 shadow-amber-400/50',
        APPROVED: 'bg-emerald-400 shadow-emerald-400/50',
        REJECTED: 'bg-red-400 shadow-red-400/50',
        DRAFT: 'bg-slate-400 shadow-slate-400/50',
        CONFIRMED: 'bg-blue-400 shadow-blue-400/50',
        PREPARING: 'bg-amber-400 shadow-amber-400/50',
    };
    return <div className={`w-2 h-2 rounded-full shadow-sm ${colors[status] || colors.DRAFT}`} />;
}

export default function DashboardView({ onNavigate }) {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [recentVouchers, setRecentVouchers] = useState([]);
    const [stats, setStats] = useState({ orders: 0, deliverers: 0, revenue: 0, pendingVouchers: 0, totalCustomers: 0, totalStores: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);

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
            const todayOrders  = (orders || []).filter(o => String(o.order_date || '').slice(0, 10) === today);
            const activeDeliverersCount = (deliverers || []).filter(d => d.current_status !== 'OFFLINE').length;
            const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
            const pendingVouchersCount = (vouchers || []).filter(v => v.status === 'SUBMITTED').length;

            setStats({
                orders: todayOrders.length,
                deliverers: activeDeliverersCount,
                revenue: todayRevenue,
                pendingVouchers: pendingVouchersCount,
                totalCustomers: (customers || []).length,
                totalStores: (stores || []).length,
                totalOrders: (orders || []).length,
            });

            // Dispatch queue: CONFIRMED or PREPARING orders
            const queueOrders = (orders || [])
                .filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING')
                .slice(0, 5)
                .map(o => {
                    const cust  = custMap.get(o.customer_id) || {};
                    const prof  = profileMap.get(cust.profile_id) || {};
                    const store = storeMap.get(o.store_id) || {};
                    return {
                        id: o.order_code,
                        store: store.name || '-',
                        customer: prof.full_name || cust.customer_code || '-',
                        time: String(o.order_date || '').slice(11, 16) || '—',
                        status: o.status,
                        total: Number(o.total_price || 0),
                    };
                });
            setPendingOrders(queueOrders);

            // Recent vouchers (last 5)
            const deliveryMap  = new Map((deliveries || []).map(d => [d.delivery_id, d]));
            const delivererMap = new Map((deliverers || []).map(d => [d.deliverer_id, d]));
            const recent = [...(vouchers || [])]
                .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
                .slice(0, 5)
                .map(v => {
                    const delivery  = deliveryMap.get(v.delivery_id) || {};
                    const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                    const prof      = profileMap.get(deliverer.profile_id) || {};
                    return {
                        id: v.voucher_code,
                        delivererName: prof.full_name || deliverer.deliverer_code || '—',
                        date: String(v.voucher_date || '').slice(0, 10),
                        status: v.status || 'DRAFT',
                        total: Number(v.total_amount || 0),
                    };
                });
            setRecentVouchers(recent);

            // Build recent activity from latest orders
            const activityItems = [...(orders || [])]
                .sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0))
                .slice(0, 4)
                .map(o => {
                    const cust = custMap.get(o.customer_id) || {};
                    const prof = profileMap.get(cust.profile_id) || {};
                    return {
                        id: o.order_code,
                        action: o.status === 'DELIVERED' ? 'Order delivered' : o.status === 'CONFIRMED' ? 'Order confirmed' : o.status === 'PREPARING' ? 'Order preparing' : 'Order placed',
                        name: prof.full_name || o.order_code,
                        time: String(o.order_date || '').slice(11, 16) || '—',
                        status: o.status,
                        icon: o.status === 'DELIVERED' ? 'check' : o.status === 'CONFIRMED' ? 'package' : 'clock',
                    };
                });
            setRecentActivity(activityItems);
        }).catch(() => {}).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6 fade-in">
            {/* ── Header bar ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">Dashboard</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock size={13} className="text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-700 dark:text-red-400 font-semibold">{today} · {timeNow}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">System Online</span>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashStatCard
                    label="Orders Today"
                    value={loading ? null : <AnimatedNumber value={stats.orders} />}
                    icon={<Package size={18} className="text-white" />}
                    gradient="from-red-500 to-rose-600"
                    loading={loading}
                    delay={0}
                />
                <DashStatCard
                    label="Active Deliverers"
                    value={loading ? null : <AnimatedNumber value={stats.deliverers} />}
                    icon={<Truck size={18} className="text-white" />}
                    gradient="from-blue-500 to-indigo-600"
                    loading={loading}
                    delay={80}
                />
                <DashStatCard
                    label="Revenue Today"
                    value={loading ? null : <AnimatedNumber value={stats.revenue} prefix="฿" />}
                    icon={<TrendingUp size={18} className="text-white" />}
                    gradient="from-emerald-500 to-teal-600"
                    loading={loading}
                    delay={160}
                />
                <DashStatCard
                    label="Pending Vouchers"
                    value={loading ? null : <AnimatedNumber value={stats.pendingVouchers} />}
                    icon={<Receipt size={18} className="text-white" />}
                    gradient="from-amber-500 to-orange-600"
                    loading={loading}
                    delay={240}
                />
            </div>



            {/* ── Dispatch Queue + Recent Vouchers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dispatch Queue */}
                <div className="rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-[#5c0f0f] text-red-950 dark:text-red-50 shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="px-5 py-4 border-b border-red-100/50 dark:border-red-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                                <Zap size={14} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-950 dark:text-red-50 text-sm">Dispatch Queue</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-300">{pendingOrders.length} pending</p>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('dispatch_form')} className="text-xs font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                            Open <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {loading ? (
                            <div className="space-y-3 py-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-14 rounded-xl bg-red-100/50 dark:bg-red-800/20 animate-pulse" />
                                ))}
                            </div>
                        ) : pendingOrders.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-2xl bg-red-100/50 dark:bg-red-800/20 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={20} className="text-red-500 dark:text-red-300" />
                                </div>
                                <p className="text-sm font-medium text-red-800/60 dark:text-red-200/80">All clear!</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">No orders awaiting dispatch</p>
                            </div>
                        ) : pendingOrders.map((o, i) => (
                            <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-100/30 dark:bg-red-900/20 border border-red-200/40 dark:border-red-800/30 hover:border-red-300/60 dark:hover:border-red-700/40 transition-all duration-200 group"
                                 style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className="relative">
                                    <StatusDot status={o.status} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-red-950 dark:text-red-50">{o.id}</p>
                                        <Badge color={
                                            o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'green' :
                                            o.status === 'CANCELLED' || o.status === 'FAILED' ? 'red' :
                                            o.status === 'PENDING' ? 'gray' :
                                            o.status === 'CONFIRMED' ? 'blue' :
                                            'amber'
                                        }>{o.status}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-300 truncate mt-0.5">{o.store} · {o.customer}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-red-950 dark:text-red-100 mono">฿{o.total.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">{o.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Vouchers */}
                <div className="rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-[#5c0f0f] text-red-950 dark:text-red-50 shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="px-5 py-4 border-b border-red-100/50 dark:border-red-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Receipt size={14} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-950 dark:text-red-50 text-sm">Recent Vouchers</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-300">{stats.pendingVouchers} awaiting approval</p>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('expense_list')} className="text-xs font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                            View All <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {loading ? (
                            <div className="space-y-3 py-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-14 rounded-xl bg-red-100/50 dark:bg-red-800/20 animate-pulse" />
                                ))}
                            </div>
                        ) : recentVouchers.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-2xl bg-red-100/50 dark:bg-red-800/20 flex items-center justify-center mx-auto mb-3">
                                    <Receipt size={20} className="text-red-500 dark:text-red-300" />
                                </div>
                                <p className="text-sm font-medium text-red-800/60 dark:text-red-200/60">No vouchers yet</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Create your first expense voucher</p>
                            </div>
                        ) : recentVouchers.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-100/30 dark:bg-red-900/20 border border-red-200/40 dark:border-red-800/30 hover:border-red-300/60 dark:hover:border-red-700/40 transition-all duration-200"
                                 style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <StatusDot status={v.status} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-red-950 dark:text-red-50">{v.id}</p>
                                        <Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>{v.status}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-300 truncate mt-0.5">{v.delivererName} · {v.date}</p>
                                </div>
                                <span className="text-sm font-bold text-red-950 dark:text-red-100 shrink-0 mono">฿{v.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Activity & Overview ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Activity Timeline */}
                <div className="lg:col-span-2 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-[#5c0f0f] text-red-950 dark:text-red-50 shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="px-5 py-4 border-b border-red-100/50 dark:border-red-800/30 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
                            <Activity size={14} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-950 dark:text-red-50 text-sm">Recent Activity</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-300">Latest order updates</p>
                        </div>
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <div className="space-y-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-red-100/50 dark:bg-red-800/20 animate-pulse shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-40 rounded bg-red-100/50 dark:bg-red-800/20 animate-pulse" />
                                            <div className="h-2.5 w-24 rounded bg-red-100/50 dark:bg-red-800/20 animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm font-medium text-red-800/60 dark:text-red-200/80">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {recentActivity.map((a, i) => (
                                    <div key={a.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-red-100/30 dark:hover:bg-red-900/20 transition-colors group">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            a.icon === 'check' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                                            : a.icon === 'package' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                                        }`}>
                                            {a.icon === 'check' ? <CheckCircle2 size={14} /> : a.icon === 'package' ? <Package size={14} /> : <Clock size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-red-950 dark:text-red-100">
                                                <span className="font-bold">{a.action}</span>
                                                <span className="text-slate-500 dark:text-gray-300"> · {a.name}</span>
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{a.id} · {a.time}</p>
                                        </div>
                                        <Badge color={
                                            a.status === 'DELIVERED' || a.status === 'COMPLETED' ? 'green' :
                                            a.status === 'CANCELLED' || a.status === 'FAILED' ? 'red' :
                                            a.status === 'PENDING' ? 'gray' :
                                            a.status === 'CONFIRMED' ? 'blue' :
                                            'amber'
                                        }>{a.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Platform Overview */}
                <div className="rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-[#5c0f0f] text-red-950 dark:text-red-50 shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="px-5 py-4 border-b border-red-100/50 dark:border-red-800/30 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
                            <TrendingUp size={14} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-950 dark:text-red-50 text-sm">Platform Overview</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-300">All-time statistics</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: 'Total Orders', value: stats.totalOrders, icon: <Package size={15} />, color: 'text-red-500 bg-red-50 dark:bg-red-500/10' },
                            { label: 'Customers', value: stats.totalCustomers, icon: <Users size={15} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
                            { label: 'Stores', value: stats.totalStores, icon: <Store size={15} />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-red-100/30 dark:bg-red-900/20 border border-red-200/40 dark:border-red-800/30">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 dark:text-gray-300 font-medium">{item.label}</p>
                                    <p className="text-lg font-black text-red-950 dark:text-red-50 leading-tight">
                                        {loading ? '…' : <AnimatedNumber value={item.value} />}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
