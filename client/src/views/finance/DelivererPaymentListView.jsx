import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Input, Select } from '../../components/ui';
import { getJson, getApiErrorMessage } from '../../api/http';

const STATUS_BADGE = { PENDING: 'amber', PAID: 'green', CANCELLED: 'red' };
const ALL_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];

export default function DelivererPaymentListView({ onNavigate, showToast }) {
    const [rows,         setRows]         = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [search,       setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tick,         setTick]         = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/payments').catch(() => []),
            getJson('/deliveries').catch(() => []),
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([payments, deliveries, deliverers, profiles]) => {
            if (cancelled) return;
            const deliveryMap  = new Map((deliveries  || []).map(d => [d.delivery_id,  d]));
            const delivererMap = new Map((deliverers  || []).map(d => [d.deliverer_id, d]));
            const profileMap   = new Map((profiles    || []).map(p => [p.profile_id,   p]));

            setRows((payments || []).map(p => {
                const delivery  = deliveryMap.get(p.delivery_id)          || {};
                const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                const prof      = profileMap.get(deliverer.profile_id)    || {};
                const periodStart = String(p.payment_period_start || '').slice(0, 10);
                const periodEnd   = String(p.payment_period_end   || '').slice(0, 10);
                return {
                    id:            p.payment_code,
                    paymentId:     p.payment_id,
                    period:        periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : periodStart || '—',
                    date:          String(p.payment_datetime || '').slice(0, 10),
                    delivererName: prof.full_name || deliverer.deliverer_code || `Deliverer#${delivery.deliverer_id || '?'}`,
                    status:        p.status || 'PENDING',
                    total:         Number(p.total_payment || 0),
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load payments'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = rows.filter(p => {
        const matchSearch = !search ||
            p.id.toLowerCase().includes(search.toLowerCase()) ||
            p.delivererName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Deliverer Payments"
                subtitle="Process and view deliverer payments"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Payment</Btn>}
            />
            <FilterBar>
                <div className="w-full md:w-72">
                    <FilterField label="Search">
                        <Input icon={Search} placeholder="Payment code, deliverer…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </FilterField>
                </div>
                <FilterField label="Status">
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </FilterField>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading payments…</div>
                ) : (
                    <Table headers={[
                        { label: 'Payment Code' }, { label: 'Period' }, { label: 'Date' },
                        { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Total', right: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                                {rows.length === 0 ? 'No payments found' : 'No payments match the current filter'}
                            </td></tr>
                        ) : filtered.map(p => (
                            <Tr key={p.id}>
                                <Td mono className="text-xs font-bold text-red-600">{p.id}</Td>
                                <Td className="text-xs text-slate-500 mono">{p.period}</Td>
                                <Td className="text-xs text-slate-500">{p.date || '—'}</Td>
                                <Td bold>{p.delivererName}</Td>
                                <Td center><Badge color={STATUS_BADGE[p.status] || 'gray'}>{p.status}</Badge></Td>
                                <Td right bold className="mono">฿{p.total.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
