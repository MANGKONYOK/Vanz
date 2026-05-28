import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Input, Select } from '../../components/ui';
import { getJson, getApiErrorMessage } from '../../api/http';

const STATUS_BADGE = { DRAFT: 'gray', SUBMITTED: 'amber', APPROVED: 'green', REJECTED: 'red' };
const ALL_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

export default function ExpenseListView({ onNavigate, showToast }) {
    const [rows,       setRows]       = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [search,     setSearch]     = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tick,       setTick]       = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/expense-vouchers').catch(() => []),
            getJson('/deliveries').catch(() => []),
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([vouchers, deliveries, deliverers, profiles]) => {
            if (cancelled) return;
            const deliveryMap  = new Map((deliveries  || []).map(d => [d.delivery_id,  d]));
            const delivererMap = new Map((deliverers  || []).map(d => [d.deliverer_id, d]));
            const profileMap   = new Map((profiles    || []).map(p => [p.profile_id,   p]));

            setRows((vouchers || []).map(v => {
                const delivery  = deliveryMap.get(v.delivery_id)   || {};
                const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                const prof      = profileMap.get(deliverer.profile_id) || {};
                return {
                    id:            v.voucher_code,
                    voucherId:     v.expense_voucher_id,
                    date:          String(v.voucher_date || '').slice(0, 10),
                    delivererName: prof.full_name || deliverer.deliverer_code || `Deliverer#${delivery.deliverer_id || '?'}`,
                    status:        v.status || 'DRAFT',
                    total:         Number(v.total_amount || 0),
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load vouchers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = rows.filter(v => {
        const matchSearch = !search ||
            v.id.toLowerCase().includes(search.toLowerCase()) ||
            v.delivererName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || v.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Expense Vouchers"
                subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Voucher</Btn>}
            />
            <FilterBar>
                <div className="w-full md:w-72">
                    <FilterField label="Search">
                        <Input icon={Search} placeholder="Voucher code, deliverer…"
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
                    <div className="py-12 text-center text-slate-500 text-sm">Loading vouchers…</div>
                ) : (
                    <Table headers={[
                        { label: 'Voucher Code' }, { label: 'Date' }, { label: 'Deliverer' },
                        { label: 'Status', center: true }, { label: 'Amount', right: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                                {rows.length === 0 ? 'No vouchers found' : 'No vouchers match the current filter'}
                            </td></tr>
                        ) : filtered.map(v => (
                            <Tr key={v.id}>
                                <Td mono className="text-xs font-bold text-red-600">{v.id}</Td>
                                <Td className="text-xs text-slate-500">{v.date}</Td>
                                <Td bold>{v.delivererName}</Td>
                                <Td center><Badge color={STATUS_BADGE[v.status] || 'gray'}>{v.status}</Badge></Td>
                                <Td right bold className="mono">฿{v.total.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
