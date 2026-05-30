import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Select, Pagination, TableSortFilter, applyFiltersAndSort, FilterPills } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import CustomerFormView from './CustomerFormView';

const MEMBERSHIP_COLOR = { GOLD: 'amber', PLATINUM: 'blue', STANDARD: 'gray' };

export default function CustomerListView({ showToast }) {
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
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/addresses'),
        ]).then(([customers, profiles, addresses]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const addressMap = new Map(addresses.map(a => [a.address_id, a]));
            const joined = customers.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                const addr = addressMap.get(c.address_id) || {};
                return {
                    // identity
                    customerCode:    c.customer_code,
                    customerId:      c.customer_id,
                    profileId:       c.profile_id,
                    addressId:       c.address_id,
                    // display
                    name:            prof.full_name || '—',
                    phone:           prof.phone || '—',
                    email:           prof.email || '',
                    address:         addr.address_line_1 || '—',
                    city:            addr.city || '',
                    membership:      c.membership_level || 'STANDARD',
                    created:         c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
                };
            });
            setRows(joined);
        }).catch(err => {
            if (!cancelled) {
                setError(err);
                showToast(getApiErrorMessage(err, 'Failed to load customers'), 'error');
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick, showToast]);

    const handleDelete = async (c) => {
        if (!window.confirm(`Delete customer ${c.customerCode}?`)) return;
        try {
            await deleteJson(`/customers/${c.customerCode}`);
            showToast(`Customer ${c.customerCode} deleted`);
            refresh();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Delete failed'), 'error');
        }
    };

    if (editing !== null) {
        return (
            <CustomerFormView
                data={editing}
                onBack={() => setEditing(null)}
                onSaved={() => { setEditing(null); refresh(); }}
                showToast={showToast}
            />
        );
    }

     const columns = [
        { key: 'customerCode', label: 'Customer Code', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'membership', label: 'Membership', type: 'enum', options: ['GOLD', 'PLATINUM', 'STANDARD'] },
        { key: 'created', label: 'Joined Date', type: 'date' }
    ];

    const sorted = applyFiltersAndSort(rows, search, ['customerCode', 'name', 'phone'], filters, sort);
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
                title="Customers"
                subtitle="Manage customer profiles and contact information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>}
            />

             <Card className="overflow-hidden">
                <CardHeader
                    search={
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                icon={Search}
                                placeholder="Search code, name, phone..."
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
                                {start}–{end} of {sorted.length} customers
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
                    headers={[
                        { label: 'CODE', key: 'customerCode', sortable: true, width: '12%' },
                        { label: 'NAME', key: 'name', sortable: true, width: '22%' },
                        { label: 'PHONE', key: 'phone', sortable: true, width: '16%' },
                        { label: 'ADDRESS', key: 'address', width: '22%' },
                        { label: 'MEMBERSHIP', key: 'membership', sortable: true, width: '14%' },
                        { label: 'JOINED', key: 'created', sortable: true, width: '10%' },
                        { label: 'Actions', right: true, width: '14%' },
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="860px"
                >
                    {loading ? (
                        <Tr><Td colSpan={7} className="text-center text-slate-400 py-8">Loading…</Td></Tr>
                    ) : error ? (
                        <Tr><Td colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                                <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
                                <span className="font-semibold text-sm">Network Error: Failed to fetch data from server</span>
                                <span className="text-xs text-slate-400">{error.message || 'Please check your connection.'}</span>
                                <Btn size="sm" variant="secondary" onClick={refresh} className="mt-2">Retry</Btn>
                            </div>
                        </Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} className="text-center text-slate-400 py-8">No customers found</Td></Tr>
                    ) : paginated.map(c => (
                        <Tr key={c.customerCode}>
                            <Td mono className="text-xs text-slate-500 dark:text-gray-300 font-bold whitespace-nowrap">{c.customerCode}</Td>
                            <Td bold className="whitespace-nowrap">{c.name}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{c.phone}</Td>
                            <Td className="max-w-[180px] truncate whitespace-nowrap" title={c.address}>{c.address}</Td>
                            <Td className="whitespace-nowrap">
                                <Badge color={MEMBERSHIP_COLOR[c.membership] || 'gray'}>
                                    {c.membership}
                                </Badge>
                            </Td>
                            <Td className="text-xs text-slate-500 dark:text-gray-300 whitespace-nowrap">{c.created}</Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}>
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(c)}>
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
                    itemLabel="customers"
                />
            </Card>
        </div>
    );
}
