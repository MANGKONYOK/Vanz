import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { MOCK_PROMOTIONS } from '../../data/mockData';

export default function PromotionListView({ onNavigate, showToast }) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 1. Filter
    const filtered = MOCK_PROMOTIONS.filter(p =>
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.store.toLowerCase().includes(search.toLowerCase()) ||
        p.discountType.toLowerCase().includes(search.toLowerCase())
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
            <PageHeader title="Promotions" subtitle="Manage store promotional campaigns"
                action={<Btn onClick={() => onNavigate()}><Plus className="w-4 h-4" /> Create Promotion</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, campaign, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} promotions
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
                        { label: 'ID', key: 'id', sortable: true, width: '16%' },
                        { label: 'CAMPAIGN', key: 'name', sortable: true, width: '20%' },
                        { label: 'STORE', key: 'store', sortable: true, width: '16%' },
                        { label: 'PERIOD', width: '18%' },
                        { label: 'TYPE', key: 'discountType', sortable: true, width: '12%' },
                        { label: 'STATUS', center: true, key: 'status', sortable: true, width: '8%' },
                        { label: 'Actions', right: true, width: '10%' }
                    ]}
                >
                    {paginated.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap">{p.id}</Td>
                            <Td bold className="whitespace-nowrap">{p.name}</Td>
                            <Td className="whitespace-nowrap">{p.store}</Td>
                            <Td className="text-xs whitespace-nowrap">{p.startDate} → {p.endDate}</Td>
                            <Td className="whitespace-nowrap"><Badge>{p.discountType}</Badge></Td>
                            <Td center className="whitespace-nowrap"><Badge color={p.status === 'Active' ? 'green' : 'gray'}>{p.status}</Badge></Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Promotion deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    itemLabel="promotions"
                />
            </Card>
        </div>
    );
}
