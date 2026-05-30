import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, ConfirmModal, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';

export default function ExpenseListView({ onNavigate, showToast }) {
    const [vouchers, setVouchers] = useState([]);
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
            getJson('/expense-vouchers'),
            getJson('/deliverers'),
            getJson('/profiles'),
            getJson('/deliveries'),
        ]).then(([vouchersList, deliverersList, profilesList, deliveriesList]) => {
            if (cancelled) return;
            const delivererMap = new Map(deliverersList.map(d => [d.deliverer_id, d]));
            const profileMap = new Map(profilesList.map(p => [p.profile_id, p]));
            const deliveryMap = new Map(deliveriesList.map(dl => [dl.delivery_id || dl.id, dl]));

            const joined = vouchersList.map(v => {
                const deliv = deliveryMap.get(v.delivery_id) || {};
                const dlv = delivererMap.get(deliv.deliverer_id) || {};
                const prof = profileMap.get(dlv.profile_id) || {};
                return {
                    id: v.voucher_code,
                    delivererId: dlv.deliverer_code || '—',
                    delivererName: prof.full_name || '—',
                    date: v.voucher_date || '—',
                    status: v.status || 'DRAFT',
                    total: parseFloat(v.total_amount || 0),
                    items: (v.expense_items || []).map(i => i.expense_type).join(', ') || '—'
                };
            });
            setVouchers(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load expense vouchers'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

    const confirmDelete = async () => {
        if (confirmDeleteId) {
            try {
                await deleteJson(`/expense-vouchers/${confirmDeleteId}`);
                showToast(`Voucher ${confirmDeleteId} deleted successfully`);
                setConfirmDeleteId(null);
                refresh();
            } catch (err) {
                showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
                setConfirmDeleteId(null);
            }
        }
    };

     const columns = [
        { key: 'id', label: 'Voucher ID', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'delivererName', label: 'Deliverer', type: 'text' },
        { key: 'status', label: 'Status', type: 'enum', options: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED'] },
        { key: 'total', label: 'Total Expense', type: 'number' }
    ];

    const sorted = applyFiltersAndSort(vouchers, search, ['id', 'delivererName', 'status', 'items'], filters, sort);
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
            <PageHeader title="Expense Vouchers" subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={() => onNavigate()}><Plus className="w-4 h-4" /> Create Voucher</Btn>} />

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
                                {start}-{end} of {sorted.length} vouchers
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
                        { label: 'Voucher ID', key: 'id', sortable: true, width: '24%' },
                        { label: 'Date', key: 'date', sortable: true, width: '20%' },
                        { label: 'Deliverer', key: 'delivererName', sortable: true, width: '16%' },
                        { label: 'Status', key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Total Expense', key: 'total', right: true, sortable: true, width: '14%' },
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
                        <Tr><Td colSpan={6} center className="text-slate-400 py-8">No vouchers found</Td></Tr>
                    ) : paginated.map(v => (
                        <Tr key={v.id}>
                            <Td mono className="text-xs font-bold text-slate-950 dark:text-slate-100">{v.id}</Td>
                            <Td>{v.date}</Td>
                            <Td bold>{v.delivererName}</Td>
                            <Td center>
                                <Badge color={v.status?.toUpperCase() === 'APPROVED' || v.status?.toUpperCase() === 'COMPLETED' ? 'green' : v.status?.toUpperCase() === 'REJECTED' || v.status?.toUpperCase() === 'FAILED' ? 'red' : 'amber'}>
                                    {v.status}
                                </Badge>
                            </Td>
                            <Td right bold>฿{v.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Td>
                            <Td right>
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(v)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => setConfirmDeleteId(v.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="vouchers"
                />
            </Card>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Expense Voucher"
                message={`Are you sure you want to delete expense voucher ${confirmDeleteId}? This action will permanently remove the voucher record from the system.`}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
