import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import ExpenseFormView from './ExpenseFormView';

const STATUS_COLOR = { draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red' };

export default function ExpenseListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'voucherDate', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/expense-vouchers'),
            getJson('/deliveries'),
            getJson('/deliverers'),
            getJson('/profiles'),
        ]).then(([vouchers, deliveries, deliverers, profiles]) => {
            if (cancelled) return;
            const deliveryMap  = new Map(deliveries.map(d => [d.delivery_id, d]));
            const delivererMap = new Map(deliverers.map(d => [d.deliverer_id, d]));
            const profileMap   = new Map(profiles.map(p => [p.profile_id, p]));
            setRows(vouchers.map(v => {
                const delivery  = deliveryMap.get(v.delivery_id) || {};
                const deliverer = delivererMap.get(delivery.deliverer_id) || {};
                const profile   = profileMap.get(deliverer.profile_id) || {};
                return {
                    id:            v.expense_voucher_id,
                    voucherCode:   v.voucher_code,
                    deliveryId:    v.delivery_id,
                    delivererCode: deliverer.deliverer_code || '',
                    delivererName: profile.full_name || '—',
                    voucherDate:   v.voucher_date,
                    status:        v.status || 'draft',
                    totalAmount:   v.total_amount,
                    expenseItems:  v.expense_items || [],
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load vouchers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (v) => {
        if (v.status !== 'draft') return showToast('Only draft vouchers can be deleted', 'error');
        if (!window.confirm(`Delete voucher ${v.voucherCode}?`)) return;
        try {
            await deleteJson(`/expense-vouchers/${v.voucherCode}`);
            showToast(`Voucher ${v.voucherCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return <ExpenseFormView data={editing} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

    const filtered = rows.filter(v =>
        v.voucherCode.toLowerCase().includes(search.toLowerCase()) ||
        v.delivererName.toLowerCase().includes(search.toLowerCase()) ||
        v.status.toLowerCase().includes(search.toLowerCase())
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
            <PageHeader title="Expense Vouchers" subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Create Voucher</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, deliverer, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} vouchers
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
                        { label: 'Voucher ID',    key: 'voucherCode',  sortable: true, width: '22%' },
                        { label: 'Date',          key: 'voucherDate',  sortable: true, width: '16%' },
                        { label: 'Deliverer',     key: 'delivererName',sortable: true, width: '18%' },
                        { label: 'Status',        key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Total Expense', key: 'totalAmount',  right: true, sortable: true, width: '14%' },
                        { label: 'Actions',       right: true,                           width: '18%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={6} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} className="text-center text-current/40 py-8">No vouchers found</Td></Tr>
                    ) : paginated.map(v => (
                        <Tr key={v.voucherCode}>
                            <Td mono className="text-xs font-bold whitespace-nowrap">{v.voucherCode}</Td>
                            <Td className="whitespace-nowrap">{v.voucherDate}</Td>
                            <Td bold className="whitespace-nowrap">{v.delivererName}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[v.status] || 'gray'}>{v.status}</Badge>
                            </Td>
                            <Td right bold className="whitespace-nowrap">฿{Number(v.totalAmount).toLocaleString()}</Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    {v.status === 'draft' && (
                                        <>
                                            <Btn size="sm" variant="secondary" onClick={() => setEditing(v)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                            <Btn size="sm" variant="danger" onClick={() => handleDelete(v)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                        </>
                                    )}
                                    {v.status !== 'draft' && <span className="text-xs text-current/30">—</span>}
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="vouchers" />
            </Card>
        </div>
    );
}
