import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Input, Select, Pagination } from '../../components/ui';
import { MOCK_CUSTOMERS } from '../../data/mockData';
import CustomerFormView from './CustomerFormView';

export default function CustomerListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (editing) return <CustomerFormView data={editing} onBack={() => setEditing(null)} showToast={showToast} />;

    // 1. Filter
    const filtered = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
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
            <PageHeader title="Customers" subtitle="Manage customer profiles and contact information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, name, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-white border-slate-200 h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}-{end} of {filtered.length} customers
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 border-slate-200 bg-white shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    headers={[
                        { label: 'ID', key: 'id', sortable: true, width: '12%' },
                        { label: 'Name', key: 'name', sortable: true, width: '24%' },
                        { label: 'Phone', key: 'phone', sortable: true, width: '18%' },
                        { label: 'Address', key: 'address', width: '28%' },
                        { label: 'Joined', key: 'created', sortable: true, width: '14%' },
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                >
                    {paginated.map(c => (
                        <Tr key={c.id}>
                            <Td mono className="text-xs text-slate-500 font-bold">{c.id}</Td>
                            <Td bold>{c.name}</Td>
                            <Td mono className="text-xs">{c.phone}</Td>
                            <Td className="max-w-[200px] truncate">{c.address}</Td>
                            <Td className="text-xs text-slate-500">{c.created}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Customer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="customers"
                />
            </Card>
        </div>
    );
}
