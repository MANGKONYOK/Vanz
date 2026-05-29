import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import StoreFormView from './StoreFormView';

const STATUS_COLOR = { ACTIVE: 'green', INACTIVE: 'gray', SUSPENDED: 'red' };

function toTitleCase(str = '') {
    return str.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export default function StoreListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/stores'),
            getJson('/addresses'),
        ]).then(([stores, addresses]) => {
            if (cancelled) return;
            const addressMap = new Map(addresses.map(a => [a.address_id, a]));
            const joined = stores.map(s => {
                const addr = addressMap.get(s.address_id) || {};
                return {
                    storeCode:  s.store_code,
                    storeId:    s.store_id,
                    addressId:  s.address_id,
                    name:       s.name,
                    category:   s.category || '—',
                    status:     s.status || 'ACTIVE',
                    address:    addr.address_line_1 || '—',
                    city:       addr.city || '',
                    rating:     s.rating != null ? parseFloat(s.rating).toFixed(1) : '—',
                    updatedAt:  s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—',
                };
            });
            setRows(joined);
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load stores'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (s) => {
        if (!window.confirm(`Delete store ${s.storeCode}?`)) return;
        try {
            await deleteJson(`/stores/${s.storeCode}`);
            showToast(`Store ${s.storeCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return (
            <StoreFormView
                data={editing}
                onBack={() => setEditing(null)}
                onSaved={() => { setEditing(null); refresh(); }}
                showToast={showToast}
            />
        );
    }

    const filtered = rows.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.storeCode.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase())
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

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader
                title="Stores"
                subtitle="Manage restaurant & store listings"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Store</Btn>}
            />

            <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <Input
                            icon={Search}
                            placeholder="Search code, name, category..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="bg-white border-slate-200 h-10 shadow-sm"
                        />
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}–{end} of {filtered.length} stores
                            </span>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="h-9 border-slate-200 bg-white shadow-sm w-24"
                            >
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />

                <Table
                    headers={[
                        { label: 'CODE',     key: 'storeCode', sortable: true, width: '10%' },
                        { label: 'NAME',     key: 'name',      sortable: true, width: '22%' },
                        { label: 'CATEGORY', key: 'category',  sortable: true, width: '14%' },
                        { label: 'ADDRESS',  key: 'address',                   width: '28%' },
                        { label: 'STATUS',   key: 'status',    sortable: true, center: true, width: '12%' },
                        { label: 'Actions',  right: true,                       width: '14%' },
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="860px"
                >
                    {loading ? (
                        <Tr><Td colSpan={6} className="text-center text-slate-400 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={6} className="text-center text-slate-400 py-8">No stores found</Td></Tr>
                    ) : paginated.map(s => (
                        <Tr key={s.storeCode}>
                            <Td mono className="text-xs text-slate-500 font-bold whitespace-nowrap">{s.storeCode}</Td>
                            <Td bold className="whitespace-nowrap">{s.name}</Td>
                            <Td className="whitespace-nowrap">
                                <Badge color="gray">{toTitleCase(s.category)}</Badge>
                            </Td>
                            <Td className="max-w-[220px] truncate whitespace-nowrap text-slate-500" title={s.address}>
                                {s.address}{s.city ? `, ${s.city}` : ''}
                            </Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[s.status] || 'gray'}>{s.status}</Badge>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(s)}>
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(s)}>
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </Btn>
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
                    itemLabel="stores"
                />
            </Card>
        </div>
    );
}
