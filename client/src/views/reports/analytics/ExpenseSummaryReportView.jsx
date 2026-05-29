import { useState, useEffect } from 'react';
import { FileText, DollarSign, BarChart3, Calculator } from 'lucide-react';
import { PageHeader, Btn, Card, StatCard, FilterBar, FilterField, Input } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function ExpenseSummaryReportView({ showToast }) {
    const [vouchers,  setVouchers]  = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');
    const [tick,      setTick]      = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getJson('/expense-vouchers').then(data => {
            if (cancelled) return;
            let result = Array.isArray(data) ? data : [];
            if (dateFrom) result = result.filter(v => String(v.voucher_date || '').slice(0, 10) >= dateFrom);
            if (dateTo)   result = result.filter(v => String(v.voucher_date || '').slice(0, 10) <= dateTo);
            setVouchers(result);
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load vouchers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const count = vouchers.length;
    const sum   = vouchers.reduce((acc, v) => acc + Number(v.total_amount || 0), 0);
    const avg   = count > 0 ? sum / count : 0;

    // Breakdown by status
    const byStatus = vouchers.reduce((acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + Number(v.total_amount || 0);
        return acc;
    }, {});

    // Breakdown by expense type from items
    const byType = {};
    for (const v of vouchers) {
        for (const item of (v.expense_items || [])) {
            byType[item.expense_type] = (byType[item.expense_type] || 0) + Number(item.amount || 0);
        }
    }
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Expense Summary" subtitle="Analyze total value and average of expense vouchers" />
            <FilterBar>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={() => setTick(t => t + 1)} disabled={loading}>
                    <Calculator className="w-4 h-4" /> {loading ? 'Loading…' : 'Calculate'}
                </Btn>
            </FilterBar>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Vouchers (COUNT)" value={count} icon={<FileText size={18} />} sub="Vouchers in period" color="blue" />
                <StatCard label="Total Value (SUM)" value={`฿${sum.toLocaleString()}`} icon={<DollarSign size={18} />} sub="Across all vouchers" color="red" />
                <StatCard label="Average Value (AVG)" value={`฿${avg.toFixed(2)}`} icon={<BarChart3 size={18} />} sub="Per voucher" color="green" />
            </div>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-3 text-lg">Breakdown by Status</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    {['draft', 'submitted', 'approved', 'rejected'].map(status => {
                        const colors = {
                            DRAFT:     { bg: 'bg-slate-50 dark:bg-slate-800/40',   border: 'border-slate-200 dark:border-slate-700',  text: 'text-current/70 dark:text-current/60',  val: 'text-current' },
                            SUBMITTED: { bg: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-100 dark:border-amber-900/30',  text: 'text-amber-600 dark:text-amber-400',  val: 'text-amber-700 dark:text-amber-300' },
                            APPROVED:  { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30',text: 'text-emerald-600 dark:text-emerald-400',val: 'text-emerald-700 dark:text-emerald-300' },
                            REJECTED:  { bg: 'bg-red-50 dark:bg-red-950/20',     border: 'border-red-100 dark:border-red-900/30',    text: 'text-red-600 dark:text-red-400',    val: 'text-red-700 dark:text-red-300' },
                        };
                        const c = colors[status];
                        const cnt = vouchers.filter(v => v.status === status).length;
                        const tot = byStatus[status] || 0;
                        return (
                            <div key={status} className={`flex-1 p-4 rounded-xl ${c.bg} border ${c.border}`}>
                                <p className={`text-xs font-bold uppercase ${c.text}`}>{status}</p>
                                <p className={`text-2xl font-black mt-1 ${c.val}`}>฿{tot.toLocaleString()}</p>
                                <p className={`text-xs ${c.text}`}>{cnt} voucher{cnt !== 1 ? 's' : ''}</p>
                            </div>
                        );
                    })}
                </div>
                {topType && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-current/75 uppercase">Top Expense Type</p>
                        <p className="text-2xl font-black text-current mt-1">{topType[0]}</p>
                        <p className="text-xs text-current/60">
                            ฿{topType[1].toLocaleString()} ({sum > 0 ? ((topType[1] / sum) * 100).toFixed(0) : 0}% of total)
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}
