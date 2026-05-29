import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { INITIAL_EXPENSE_VOUCHERS } from '../../data/mockData';

export default function ExpenseListView({ onNavigate, showToast }) {
    const [vouchers, setVouchers] = useState(INITIAL_EXPENSE_VOUCHERS);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete voucher ${id}?`)) {
            setVouchers(prev => prev.filter(v => v.id !== id));
            showToast(`Voucher ${id} deleted successfully`, 'error');
        }
    };

    // 1. Filter
    const filtered = vouchers.filter(v =>
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        v.delivererName.toLowerCase().includes(search.toLowerCase()) ||
        v.status.toLowerCase().includes(search.toLowerCase()) ||
        (v.items && v.items.toLowerCase().includes(search.toLowerCase()))
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
            <PageHeader title="Expense Vouchers" subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={() => onNavigate()}><Plus className="w-4 h-4" /> Create Voucher</Btn>} />

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
                        { label: 'Voucher ID', key: 'id', sortable: true, width: '24%' },
                        { label: 'Date', key: 'date', sortable: true, width: '20%' },
                        { label: 'Deliverer', key: 'delivererName', sortable: true, width: '16%' },
                        { label: 'Status', key: 'status', center: true, sortable: true, width: '12%' },
                        { label: 'Total Expense', key: 'total', right: true, sortable: true, width: '14%' },
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                >
                    {paginated.map(v => (
                        <Tr key={v.id}>
                            <Td mono className="text-xs font-bold text-slate-900 dark:text-slate-100">{v.id}</Td>
                            <Td>{v.date}</Td>
                            <Td bold>{v.delivererName}</Td>
                            <Td center>
                                <Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>
                                    {v.status}
                                </Badge>
                            </Td>
                            <Td right bold>฿{v.total?.toLocaleString()}</Td>
                            <Td right>
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(v)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(v.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>

                <Pagination
                    totalItems={filtered.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="vouchers"
                />
            </Card>
        </div>
    );
}
