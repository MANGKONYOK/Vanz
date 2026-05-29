import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import DelivererPaymentView from './DelivererPaymentView';

const STATUS_COLOR = { pending: 'amber', paid: 'green', cancelled: 'red' };

export default function DelivererPaymentListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'paymentCode', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/payments'),
            getJson('/deliveries'),
            getJson('/deliverers'),
            getJson('/profiles'),
        ]).then(([payments, deliveries, deliverers, profiles]) => {
            if (cancelled) return;
            const deliveryMap  = new Map(deliveries.map(d => [d.delivery_id, d]));
            const delivererMap = new Map(deliverers.map(d => [d.deliverer_id, d]));
            const profileMap   = new Map(profiles.map(p => [p.profile_id, p]));
            setRows(payments.map(p => {
                const delivery  = deliveryMap.get(p.delivery_id) || {};
                const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                const profile   = profileMap.get(deliverer.profile_id) || {};
                return {
                    id:            p.payment_id,
                    paymentCode:   p.payment_code,
                    deliveryId:    p.delivery_id,
                    delivererCode: deliverer.deliverer_code || '',
                    delivererName: profile.full_name || '—',
                    periodStart:   p.payment_period_start,
                    periodEnd:     p.payment_period_end,
                    totalPayment:  p.total_payment,
                    status:        p.status || 'pending',
                    paymentDate:   p.payment_datetime
                        ? new Date(p.payment_datetime).toLocaleDateString() : '—',
                    paymentItems:  p.payment_items || [],
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load payments'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (p) => {
        if (p.status !== 'pending') return showToast('Only pending payments can be deleted', 'error');
        if (!window.confirm(`Delete payment ${p.paymentCode}?`)) return;
        try {
            await deleteJson(`/payments/${p.paymentCode}`);
            showToast(`Payment ${p.paymentCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return <DelivererPaymentView data={editing} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

    const filtered = rows.filter(p =>
        p.paymentCode.toLowerCase().includes(search.toLowerCase()) ||
        p.delivererName.toLowerCase().includes(search.toLowerCase()) ||
        p.status.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key] ?? '';
        const valB = b[sort.key] ?? '';
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = filtered.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, filtered.length);

    const handleSort = (key) => setSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverer Payments" subtitle="Process and view deliverer payments"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Create Payment</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, deliverer, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} payments
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    headers={[
                        { label: 'Payment ID',    key: 'paymentCode',   sortable: true, width: '22%' },
                        { label: 'Date',          key: 'paymentDate',   sortable: true, width: '14%' },
                        { label: 'Deliverer',     key: 'delivererName', sortable: true, width: '18%' },
                        { label: 'Total Payment', key: 'totalPayment',  right: true, sortable: true, width: '14%' },
                        { label: 'Status',        key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Actions',       right: true,                           width: '20%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={6} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} className="text-center text-current/40 py-8">No payments found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.paymentCode}>
                            <Td mono className="text-xs font-bold whitespace-nowrap">{p.paymentCode}</Td>
                            <Td className="whitespace-nowrap">{p.paymentDate}</Td>
                            <Td bold className="whitespace-nowrap">{p.delivererName}</Td>
                            <Td right bold className="whitespace-nowrap">฿{Number(p.totalPayment).toLocaleString()}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    {p.status === 'pending' ? (
                                        <>
                                            <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                            <Btn size="sm" variant="danger" onClick={() => handleDelete(p)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                        </>
                                    ) : (
                                        <span className="text-xs text-current/30">—</span>
                                    )}
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="payments" />
            </Card>
        </div>
    );
}
