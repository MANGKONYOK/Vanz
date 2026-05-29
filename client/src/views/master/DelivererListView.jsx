import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import DelivererFormView from './DelivererFormView';

const STATUS_MAP = { available: 'Active', busy: 'Busy', offline: 'Inactive' };
const STATUS_COLOR = { available: 'green', busy: 'amber', offline: 'gray' };

export default function DelivererListView({ showToast }) {
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
            getJson('/deliverers'),
            getJson('/profiles'),
        ]).then(([deliverers, profiles]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const joined = deliverers.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return {
                    delivererCode: d.deliverer_code,
                    delivererId:   d.deliverer_id,
                    profileId:     d.profile_id,
                    name:          prof.full_name || '—',
                    phone:         prof.phone || '—',
                    email:         prof.email || '',
                    license:       d.license_plate || '—',
                    type:          d.vehicle_type || '—',
                    currentStatus: d.current_status || 'offline',
                    status:        STATUS_MAP[d.current_status] || d.current_status,
                    rating:        d.rating != null ? parseFloat(d.rating).toFixed(1) : '—',
                    created:       d.created_at ? new Date(d.created_at).toLocaleDateString() : '—',
                };
            });
            setRows(joined);
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load deliverers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

    const handleDelete = async (d) => {
        if (!window.confirm(`Delete deliverer ${d.delivererCode}?`)) return;
        try {
            await deleteJson(`/deliverers/${d.delivererCode}`);
            showToast(`Deliverer ${d.delivererCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return (
            <DelivererFormView
                data={editing}
                onBack={() => setEditing(null)}
                onSaved={() => { setEditing(null); refresh(); }}
                showToast={showToast}
            />
        );
    }

    const filtered = rows.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.delivererCode.toLowerCase().includes(search.toLowerCase()) ||
        d.license.toLowerCase().includes(search.toLowerCase())
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
                title="Deliverers"
                subtitle="Manage deliverer profiles and vehicle information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>}
            />

            <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <Input
                            icon={Search}
                            placeholder="Search code, name, license..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="bg-white border-slate-200 h-10 shadow-sm"
                        />
                    }
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}–{end} of {filtered.length} deliverers
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
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="960px"
                    headers={[
                        { label: 'CODE',          key: 'delivererCode', sortable: true,  width: '10%' },
                        { label: 'NAME',          key: 'name',          sortable: true,  width: '18%' },
                        { label: 'LICENSE PLATE', key: 'license',       sortable: true,  width: '14%' },
                        { label: 'VEHICLE',       key: 'type',          sortable: true,  width: '12%' },
                        { label: 'PHONE',         key: 'phone',                          width: '14%' },
                        { label: 'STATUS',        key: 'status',        sortable: true, center: true, width: '10%' },
                        { label: 'RATING',        key: 'rating',        sortable: true, center: true, width: '8%' },
                        { label: 'Actions',       right: true,                           width: '14%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={8} className="text-center text-slate-400 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={8} className="text-center text-slate-400 py-8">No deliverers found</Td></Tr>
                    ) : paginated.map(d => (
                        <Tr key={d.delivererCode}>
                            <Td mono className="text-xs text-slate-500 font-bold whitespace-nowrap">{d.delivererCode}</Td>
                            <Td bold className="whitespace-nowrap">{d.name}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.license}</Td>
                            <Td className="whitespace-nowrap">{d.type}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.phone}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[d.currentStatus] || 'gray'}>{d.status}</Badge>
                            </Td>
                            <Td center className="whitespace-nowrap">
                                <span className="flex items-center justify-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    {d.rating}
                                </span>
                            </Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(d)}>
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(d)}>
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
                    itemLabel="deliverers"
                />
            </Card>
        </div>
    );
}
