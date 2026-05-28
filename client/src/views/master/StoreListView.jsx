import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { MOCK_STORES } from '../../data/mockData';
import StoreFormView from './StoreFormView';

export default function StoreListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (editing) return <StoreFormView data={editing} onBack={() => setEditing(null)} showToast={showToast} />;

    // 1. Filter
    const filtered = MOCK_STORES.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase())
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
            <PageHeader title="Stores" subtitle="Manage restaurant & store listings"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Store</Btn>} />
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search ID, name, category..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-white border-slate-200 h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}-{end} of {filtered.length} stores
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 border-slate-200 bg-white shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table 
                    headers={[
                        { label: 'ID', key: 'id', sortable: true, width: '10%' }, 
                        { label: 'NAME', key: 'name', sortable: true, width: '20%' }, 
                        { label: 'CATEGORY', key: 'category', sortable: true, width: '14%' }, 
                        { label: 'PHONE', key: 'phone', width: '14%' }, 
                        { label: 'ADDRESS', key: 'address', width: '24%' }, 
                        { label: 'HOURS', key: 'open', width: '8%' }, 
                        { label: 'Actions', right: true, width: '10%' }
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="900px"
                >
                    {paginated.map(s => (
                        <Tr key={s.id}>
                            <Td mono className="text-xs text-slate-900 font-bold whitespace-nowrap">{s.id}</Td>
                            <Td bold className="whitespace-nowrap">{s.name}</Td>
                            <Td className="whitespace-nowrap"><Badge>{s.category}</Badge></Td>
                            <Td mono className="text-xs whitespace-nowrap">{s.phone}</Td>
                            <Td className="truncate max-w-[250px] whitespace-nowrap" title={s.address}>{s.address}</Td>
                            <Td className="text-xs text-slate-500 whitespace-nowrap">{s.open}</Td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(s)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Store deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="stores"
                />
            </Card>
        </div>
    );
}

