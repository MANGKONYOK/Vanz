import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, ConfirmModal, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';

export default function DelivererPaymentListView({ onNavigate, showToast }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
     const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: '', direction: 'asc' });
    const [filters, setFilters] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const refresh = () => {
        setLoading(true);
        setError(null);
        setTick(t => t + 1);
    };

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getJson('/payments'),
            getJson('/deliverers'),
            getJson('/profiles'),
            getJson('/deliveries'),
        ]).then(([paymentsList, deliverersList, profilesList, deliveriesList]) => {
            if (cancelled) return;
            const delivererMap = new Map(deliverersList.map(d => [d.deliverer_id, d]));
            const profileMap = new Map(profilesList.map(p => [p.profile_id, p]));
            const deliveryMap = new Map(deliveriesList.map(dl => [dl.delivery_id || dl.id, dl]));

            const joined = paymentsList.map(p => {
                const deliv = deliveryMap.get(p.delivery_id) || {};
                const dlv = delivererMap.get(deliv.deliverer_id) || {};
                const prof = profileMap.get(dlv.profile_id) || {};
                return {
                    id: p.payment_code,
                    period: `${p.payment_period_start} to ${p.payment_period_end}`,
                    date: p.payment_datetime ? new Date(p.payment_datetime).toLocaleDateString() : '—',
                    rawDate: p.payment_datetime,
                    delivererCode: dlv.code || '—',
                    delivererId: dlv.deliverer_id,
                    delivererName: prof.full_name || '—',
                    amount: parseFloat(p.total_payment || 0),
                    status: p.status || 'PENDING',
                    rawItems: p.payment_items || [],
                    delivery_id: p.delivery_id,
                    payment_period_start: p.payment_period_start,
                    payment_period_end: p.payment_period_end
                };
            });
            setPayments(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load payments'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await deleteJson(`/payments/${confirmDeleteId}`);
                showToast(`Payment record ${confirmDeleteId} deleted successfully`);
                setConfirmDeleteId(null);
                refresh();
            } catch (err) {
                showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
                setConfirmDeleteId(null);
            }
        }
    };

     const columns = [
        { key: 'id', label: 'Payment ID', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'delivererName', label: 'Deliverer', type: 'text' },
        { key: 'amount', label: 'Total Payment', type: 'number' },
        { key: 'status', label: 'Status', type: 'enum', options: ['PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'FAILED'] }
    ];

    const sorted = applyFiltersAndSort(payments, search, ['id', 'delivererName', 'period', 'status'], filters, sort);
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = sorted.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, sorted.length);

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverer Payments" subtitle="Process and view deliverer payments"
                action={<Btn onClick={() => onNavigate()}><Plus className="w-4 h-4" /> Create Payment</Btn>} />

             <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                icon={Search}
                                placeholder="Search ID, deliverer, status..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="h-10 shadow-sm"
                            />
                            <TableSortFilter
                                columns={columns}
                                sort={sort}
                                onSortChange={s => { setSort(s); setPage(1); }}
                                filters={filters}
                                onFiltersChange={f => { setFilters(f); setPage(1); }}
                            />
                        </div>
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-300">
                                {start}-{end} of {sorted.length} payments
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 shadow-sm w-28">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />

                {filters.length > 0 && (
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        <FilterPills
                            columns={columns}
                            filters={filters}
                            onRemoveFilter={i => {
                                const newFilters = filters.filter((_, idx) => idx !== i);
                                setFilters(newFilters);
                                setPage(1);
                            }}
                            onClearAll={() => {
                                setFilters([]);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    headers={[
                        { label: 'Payment ID', key: 'id', sortable: true, width: '24%' },
                        { label: 'Date', key: 'date', sortable: true, width: '20%' },
                        { label: 'Deliverer', key: 'delivererName', sortable: true, width: '16%' },
                        { label: 'Total Payment', key: 'amount', right: true, sortable: true, width: '14%' },
                        { label: 'Status', key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={6} center className="text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={6} center className="py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} center className="text-slate-400 py-8">No payments found</Td></Tr>
                    ) : paginated.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs font-bold text-slate-950 dark:text-slate-100">{p.id}</Td>
                            <Td>{p.date}</Td>
                            <Td bold>{p.delivererName}</Td>
                            <Td right bold>฿{p.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                            <Td center>
                                <Badge color={p.status?.toUpperCase() === 'PAID' || p.status?.toUpperCase() === 'COMPLETED' ? 'green' : p.status?.toUpperCase() === 'PENDING' || p.status?.toUpperCase() === 'PROCESSING' ? 'amber' : 'red'}>
                                    {p.status}
                                </Badge>
                            </Td>
                            <Td right>
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => setConfirmDeleteId(p.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>

                <Pagination
                    totalItems={sorted.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="payments"
                />
            </Card>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Deliverer Payment"
                message={`Are you sure you want to delete payment record ${confirmDeleteId}? This action will permanently remove the payment log from the system.`}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
