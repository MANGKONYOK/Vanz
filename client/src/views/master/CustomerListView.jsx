import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Input, Select, Pagination } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';
import CustomerFormView from './CustomerFormView';

export default function CustomerListView({ showToast }) {
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
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/addresses'),
        ]).then(([customers, profiles, addresses]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const addressMap = new Map(addresses.map(a => [a.address_id, a]));
            setRows(customers.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                const addr = addressMap.get(c.address_id) || {};
                return {
                    id:           c.customer_id,
                    customerCode: c.customer_code,
                    profileId:    c.profile_id,
                    addressId:    c.address_id,
                    name:         prof.full_name || '—',
                    phone:        prof.phone || '—',
                    email:        prof.email || '',
                    address:      addr.address_line_1 || '',
                    address2:     addr.address_line_2 || '',
                    city:         addr.city || '',
                    province:     addr.province || '',
                    membership:   c.membership_level || 'Bronze',
                    created:      c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
                };
            }));
        }).catch(err => {
            if (!cancelled) showToast(getApiErrorMessage(err, 'Failed to load customers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);

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
        return <CustomerFormView data={editing} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} showToast={showToast} />;
    }

    const filtered = rows.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
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

    const handleSort = (key) => setSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customers" subtitle="Manage customer profiles and contact information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search ID, name, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-current/50">
                                {start}-{end} of {filtered.length} customers
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    headers={[
                        { label: 'ID',         key: 'customerCode', sortable: true, width: '12%' },
                        { label: 'NAME',        key: 'name',         sortable: true, width: '22%' },
                        { label: 'PHONE',       key: 'phone',        sortable: true, width: '16%' },
                        { label: 'ADDRESS',     key: 'address',                       width: '24%' },
                        { label: 'MEMBERSHIP',  key: 'membership',   sortable: true, width: '12%' },
                        { label: 'JOINED',      key: 'created',      sortable: true, width: '10%' },
                        { label: 'Actions',     right: true,                           width: '14%' },
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                    minWidth="800px"
                >
                    {loading ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">Loading…</Td></Tr>
                    ) : paginated.length === 0 ? (
                        <Tr><Td colSpan={7} className="text-center text-current/40 py-8">No customers found</Td></Tr>
                    ) : paginated.map(c => (
                        <Tr key={c.customerCode}>
                            <Td mono className="text-xs text-current/60 font-bold whitespace-nowrap">{c.customerCode}</Td>
                            <Td bold className="whitespace-nowrap">{c.name}</Td>
                            <Td mono className="text-xs whitespace-nowrap">{c.phone}</Td>
                            <Td className="max-w-[200px] truncate whitespace-nowrap" title={c.address}>{c.address}</Td>
                            <Td className="whitespace-nowrap text-xs">{c.membership}</Td>
                            <Td className="text-xs text-current/60 whitespace-nowrap">{c.created}</Td>
                            <Td right className="whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(c)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Table>
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page} onPageChange={setPage} showSummary={false} itemLabel="customers" />
            </Card>
        </div>
    );
}
