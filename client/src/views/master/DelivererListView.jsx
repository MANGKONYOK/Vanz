import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Star, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import DelivererFormView from './DelivererFormView';

const STATUS_MAP = { AVAILABLE: 'Active', BUSY: 'Busy', OFFLINE: 'Inactive' };
const STATUS_COLOR = { AVAILABLE: 'green', BUSY: 'amber', OFFLINE: 'gray' };

export default function DelivererListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
     const [tick, setTick] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: '', direction: 'asc' });
    const [filters, setFilters] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const refresh = () => {
        setLoading(true);
        setError(null);
        setTick(t => t + 1);
    };

    useEffect(() => {
        let cancelled = false;
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
                    currentStatus: d.current_status || 'OFFLINE',
                    status:        STATUS_MAP[d.current_status] || d.current_status,
                    rating:        d.rating != null ? parseFloat(d.rating).toFixed(1) : '—',
                    created:       d.created_at ? new Date(d.created_at).toLocaleDateString() : '—',
                };
            });
            setRows(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load deliverers'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

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

     const columns = [
        { key: 'delivererCode', label: 'Deliverer Code', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'license', label: 'License Plate', type: 'text' },
        { key: 'type', label: 'Vehicle Type', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'currentStatus', label: 'Status', type: 'enum', options: ['AVAILABLE', 'BUSY', 'OFFLINE'] },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'created', label: 'Joined Date', type: 'date' }
    ];

    const sorted = applyFiltersAndSort(rows, search, ['delivererCode', 'name', 'license'], filters, sort);
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
            <PageHeader
                title="Deliverers"
                subtitle="Manage deliverer profiles and vehicle information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>}
            />

             <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                icon={Search}
                                placeholder="Search code, name, license..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="bg-white border-slate-200 h-10 shadow-sm"
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
                                {start}–{end} of {sorted.length} deliverers
                            </span>
                            <Select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="h-9 border-slate-200 bg-white shadow-sm w-28"
                            >
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
                    ) : error ? (
                        <Tr><Td colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={8} className="text-center text-slate-400 py-8">No deliverers found</Td></Tr>
                    ) : paginated.map(d => (
                        <Tr key={d.delivererCode}>
                            <Td mono className="text-xs text-slate-500 dark:text-gray-300 font-bold whitespace-nowrap">{d.delivererCode}</Td>
                            <Td bold className="whitespace-nowrap">{d.name}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.license}</Td>
                            <Td className="whitespace-nowrap">{d.type}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{d.phone}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[d.currentStatus?.toUpperCase()] || STATUS_COLOR[d.status?.toUpperCase()] || 'gray'}>{d.currentStatus}</Badge>
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
                    totalItems={sorted.length}
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
