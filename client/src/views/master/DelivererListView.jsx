import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { MOCK_DELIVERERS } from '../../data/mockData';
import DelivererFormView from './DelivererFormView';

export default function DelivererListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (editing) return <DelivererFormView data={editing} onBack={() => setEditing(null)} showToast={showToast} />;

    const filtered = MOCK_DELIVERERS.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.license.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

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
            <PageHeader title="Deliverers" subtitle="Manage deliverer profiles"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>} />
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search ID, name, license..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} deliverers
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
                    minWidth="900px"
                    headers={[
                        { label: 'ID', key: 'id', sortable: true, width: '10%' }, 
                        { label: 'NAME', key: 'name', sortable: true, width: '20%' }, 
                        { label: 'LICENSE PLATE', key: 'license', sortable: true, width: '16%' }, 
                        { label: 'VEHICLE', key: 'type', sortable: true, width: '12%' }, 
                        { label: 'PHONE', key: 'phone', width: '14%' }, 
                        { label: 'STATUS', center: true, key: 'status', sortable: true, width: '10%' }, 
                        { label: 'RATING', center: true, key: 'rating', sortable: true, width: '10%' }, 
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                >
                    {paginated.map(d => (
                        <Tr key={d.id}>
                            <Td mono className="text-xs text-current/60 font-bold whitespace-nowrap">{d.id}</Td>
                            <Td bold className="whitespace-nowrap">{d.name}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.license}</Td>
                            <Td className="whitespace-nowrap">{d.type}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.phone}</Td>
                            <Td center className="whitespace-nowrap"><Badge color={d.status === 'Active' ? 'green' : 'gray'}>{d.status}</Badge></Td>
                            <Td center className="whitespace-nowrap"><span className="flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{d.rating}</span></Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(d)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Deliverer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="deliverers"
                />
            </Card>
        </div>
    );
}
