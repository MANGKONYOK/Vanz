import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, StatCard } from '../../components/ui';
import { getJson, getApiErrorMessage } from '../../api/http';

function computeMonthlyAverages(deliveries) {
    const byMonth = new Map();
    for (const d of deliveries) {
        const raw = d.delivery_time || d.pickup_time;
        if (!raw) continue;
        const month = String(raw).slice(0, 7); // "YYYY-MM"
        const fee = Number(d.delivery_fee || 0);
        const cur = byMonth.get(month) || { total: 0, count: 0 };
        cur.total += fee;
        cur.count += 1;
        byMonth.set(month, cur);
    }
    return [...byMonth.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, agg]) => ({
            month,
            avgFee:  agg.count ? Number((agg.total / agg.count).toFixed(2)) : 0,
            count:   agg.count,
            total:   Number(agg.total.toFixed(2)),
        }));
}

export default function RevenueTripView({ showToast }) {
    const [rates,   setRates]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [tick,    setTick]    = useState(0);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getJson('/deliveries').then(deliveries => {
            if (cancelled) return;
            setRates(computeMonthlyAverages(Array.isArray(deliveries) ? deliveries : []));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load delivery data'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const latestRate  = rates[rates.length - 1]?.avgFee ?? 0;
    const overallAvg  = rates.length
        ? Number((rates.reduce((s, r) => s + r.avgFee, 0) / rates.length).toFixed(2))
        : 0;

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Revenue Per Trip"
                subtitle="Monthly average delivery fee computed from completed deliveries"
                action={
                    <Btn variant="secondary" onClick={refresh} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Btn>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Latest Month Avg"
                    value={`฿${latestRate.toLocaleString()}`}
                    icon={<DollarSign size={18} />}
                    sub={rates[rates.length - 1]?.month || '—'}
                    color="green"
                />
                <StatCard
                    label="Overall Avg Fee"
                    value={`฿${overallAvg.toLocaleString()}`}
                    icon={<TrendingUp size={18} />}
                    sub="All months"
                    color="blue"
                />
                <StatCard
                    label="Months Recorded"
                    value={rates.length}
                    icon={<RefreshCw size={18} />}
                    sub="Active months"
                    color="amber"
                />
            </div>

            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading delivery data…</div>
                ) : (
                    <Table headers={[
                        { label: 'Month' },
                        { label: 'Deliveries', center: true },
                        { label: 'Total Fee', right: true },
                        { label: 'Avg Fee / Trip', right: true },
                    ]}>
                        {rates.length === 0 ? (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No delivery data available</td></tr>
                        ) : [...rates].reverse().map(r => (
                            <Tr key={r.month}>
                                <Td mono className="font-semibold text-slate-700">{r.month}</Td>
                                <Td center className="text-slate-600">{r.count}</Td>
                                <Td right className="mono text-slate-600">฿{r.total.toLocaleString()}</Td>
                                <Td right bold className="mono text-slate-900">฿{r.avgFee.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
