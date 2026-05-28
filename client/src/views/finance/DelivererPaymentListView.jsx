import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';

const INITIAL_PAYMENTS = [
    { id: 'PAY-2026-000456', period: 'Mar 2026', date: '2026-03-24', delivererName: 'Somchai Jaidee', status: 'PAID', amount: 2450 },
    { id: 'PAY-2026-000457', period: 'Mar 2026', date: '2026-03-22', delivererName: 'Kittisak Phromsorn', status: 'PAID', amount: 1500 },
    { id: 'PAY-2026-000458', period: 'Mar 2026', date: '2026-03-20', delivererName: 'Wanchai Boonmee', status: 'PENDING', amount: 450 }
];

export default function DelivererPaymentListView({ onNavigate, showToast }) {
    const [payments, setPayments] = useState(INITIAL_PAYMENTS);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete payment ${id}?`)) {
            setPayments(prev => prev.filter(p => p.id !== id));
            showToast(`Payment ${id} deleted successfully`, 'error');
        }
    };

    // 1. Filter
    const filtered = payments.filter(p =>
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.delivererName.toLowerCase().includes(search.toLowerCase()) ||
        p.period.toLowerCase().includes(search.toLowerCase()) ||
        p.status.toLowerCase().includes(search.toLowerCase())
    );

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Paginate
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = filtered.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, filtered.length);

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
                    search={<Input icon={Search} placeholder="Search ID, deliverer, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-white border-slate-200 h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}-{end} of {filtered.length} payments
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 border-slate-200 bg-white shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    onSort={handleSort}
                    sortConfig={sort}
                    headers={[
                        { label: 'Payment ID', key: 'id', sortable: true, width: '24%' },
                        { label: 'Date', key: 'date', sortable: true, width: '20%' },
                        { label: 'Deliverer', key: 'delivererName', sortable: true, width: '16%' },
                        { label: 'Status', key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Total Payment', key: 'amount', right: true, sortable: true, width: '14%' },
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                >
                    {paginated.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs font-bold text-red-600">{p.id}</Td>
                            <Td>{p.date}</Td>
                            <Td bold>{p.delivererName}</Td>
                            <Td center>
                                <Badge color={p.status === 'PAID' ? 'green' : p.status === 'PENDING' ? 'amber' : 'red'}>
                                    {p.status}
                                </Badge>
                            </Td>
                            <Td right bold>฿{p.amount?.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>

                <Pagination
                    totalItems={filtered.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="payments"
                />
            </Card>
        </div>
    );
}
