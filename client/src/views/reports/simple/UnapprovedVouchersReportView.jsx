import { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, StatCard, FilterBar, FilterField, Input, Select } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function UnapprovedVouchersReportView({ showToast }) {
    const [allVouchers, setAllVouchers] = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [dateFrom,    setDateFrom]    = useState('');
    const [dateTo,      setDateTo]      = useState('');
    const [minAmount,   setMinAmount]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [delivererMap,  setDelivererMap]  = useState(new Map());

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
            const profileMap  = new Map(profiles.map(p => [p.profile_id, p]));
            const deliveryMap = new Map(deliveries.map(d => [d.delivery_id, d]));
            const dlvMap      = new Map(deliverers.map(d => [d.deliverer_id, d]));

            const dm = new Map();
            for (const d of deliverers) {
                const prof = profileMap.get(d.profile_id) || {};
                dm.set(d.deliverer_id, prof.full_name || d.deliverer_code || `Deliverer#${d.deliverer_id}`);
            }
            setDelivererMap(dm);

            setAllVouchers((vouchers || []).map(v => {
                const delivery  = deliveryMap.get(v.delivery_id) || {};
                const name      = dm.get(delivery.deliverer_id) || `Deliverer#${delivery.deliverer_id || '?'}`;
                return {
                    id:            v.voucher_code,
                    delivererName: name,
                    date:          String(v.voucher_date || '').slice(0, 10),
                    items:         (v.expense_items || []).length,
                    total:         Number(v.total_amount || 0),
                    status:        v.status || 'DRAFT',
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load vouchers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const unapproved = allVouchers.filter(v => {
        if (v.status === 'APPROVED' || v.status === 'REJECTED') return false;
        if (statusFilter && v.status !== statusFilter) return false;
        if (dateFrom && v.date < dateFrom) return false;
        if (dateTo   && v.date > dateTo)   return false;
        if (minAmount && v.total < Number(minAmount)) return false;
        return true;
    });

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Unapproved Vouchers" subtitle="Review and manage pending expense vouchers" />
            <FilterBar>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <FilterField label="Min Amount">
                    <Input type="number" placeholder="Amount" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
                </FilterField>
                <FilterField label="Status">
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="DRAFT">Draft</option>
                    </Select>
                </FilterField>
                <Btn onClick={() => { setDateFrom(''); setDateTo(''); setMinAmount(''); setStatusFilter(''); }}>
                    <Search className="w-4 h-4" /> Reset
                </Btn>
            </FilterBar>
            {!loading && (
                <div className="mb-3">
                    <StatCard label="Unapproved Vouchers" value={unapproved.length} icon={<AlertCircle size={18} />} sub="Awaiting approval" color="amber" />
                </div>
            )}
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 dark:text-gray-300 text-sm">Loading vouchers…</div>
                ) : (
                    <Table headers={[
                        { label: 'Voucher ID' }, { label: 'Deliverer' }, { label: 'Voucher Date' },
                        { label: 'Items', center: true }, { label: 'Total Amount', right: true }, { label: 'Status', center: true },
                    ]}>
                        {unapproved.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-500 dark:text-gray-300 text-sm">No unapproved vouchers found</td></tr>
                        ) : unapproved.map(v => (
                            <Tr key={v.id}>
                                <Td bold mono className="text-xs">{v.id}</Td>
                                <Td>{v.delivererName}</Td>
                                <Td>{v.date}</Td>
                                <Td center><Badge color="gray">{v.items}</Badge></Td>
                                <Td right bold>฿{v.total.toLocaleString()}</Td>
                                <Td center><Badge color="amber">{v.status}</Badge></Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
