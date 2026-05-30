import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Star, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, ConfirmModal, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import DelivererFormView from './DelivererFormView';

const STATUS_MAP = { AVAILABLE: 'Active', BUSY: 'Busy', OFFLINE: 'Inactive' };
const STATUS_COLOR = { AVAILABLE: 'green', BUSY: 'amber', OFFLINE: 'gray' };

function formatPhone(phone) {
    if (!phone) return '—';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+66')) {
        cleaned = '0' + cleaned.slice(3);
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 9) {
        if (cleaned.startsWith('02')) {
            return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
    }
    return phone;
}

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
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteJson(`/deliverers/${confirmDeleteId}`);
            showToast(`Deliverer ${confirmDeleteId} deleted`);
            setConfirmDeleteId(null);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
            setConfirmDeleteId(null);
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
        { key: 'delivererCode', label: 'ID', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'type', label: 'Vehicle Type', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'currentStatus', label: 'Status', type: 'enum', options: ['AVAILABLE', 'BUSY', 'OFFLINE'] },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'created', label: 'Joined Date', type: 'date' }
    ];

    const sorted = applyFiltersAndSort(rows, search, ['delivererCode', 'name'], filters, sort);
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
                                placeholder="Search ID, name..."
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
                                className="w-28 h-9"
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
                    minWidth="700px"
                    headers={[
                        { label: 'ID',            key: 'delivererCode', sortable: true,  width: '12%' },
                        { label: 'NAME',          key: 'name',          sortable: true,  width: '24%' },
                        { label: 'VEHICLE',       key: 'type',          sortable: true,  width: '16%' },
                        { label: 'PHONE',         key: 'phone',                          width: '18%' },
                        { label: 'STATUS',        key: 'status',        sortable: true, center: true, width: '12%' },
                        { label: 'RATING',        key: 'rating',        sortable: true, center: true, width: '10%' },
                        { label: 'Actions',       right: true,                           width: '14%' },
                    ]}
                >
                    {loading ? (
                        <Tr><Td colSpan={7} center className="text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={7} center className="py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} center className="text-slate-400 py-8">No deliverers found</Td></Tr>
                    ) : paginated.map(d => (
                        <Tr key={d.delivererCode}>
                            <Td mono className="text-xs text-slate-500 dark:text-gray-300 font-bold whitespace-nowrap">{d.delivererCode}</Td>
                            <Td bold className="whitespace-nowrap">{d.name}</Td>
                            <Td className="whitespace-nowrap">{d.type.charAt(0) + d.type.slice(1).toLowerCase()}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{formatPhone(d.phone)}</Td>
                            <Td center className="whitespace-nowrap">
                                <Badge color={STATUS_COLOR[d.currentStatus?.toUpperCase()] || STATUS_COLOR[d.status?.toUpperCase()] || 'gray'}>{d.status}</Badge>
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
                                    <Btn size="sm" variant="danger" onClick={() => setConfirmDeleteId(d.delivererCode)}>
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

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Delete Deliverer"
                message={`Are you sure you want to delete deliverer ${confirmDeleteId}? This action cannot be undone and will permanently remove their profile record.`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
