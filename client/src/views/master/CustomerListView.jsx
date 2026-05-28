import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save, Check } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FormField, Input, FilterBar, FilterField, Pagination } from '../../components/ui';
import { getJson, postJson, putJson, deleteJson, getApiErrorMessage } from '../../api/http';

function inferCity(addressText) {
    if (!addressText) return 'Bangkok';
    const chunks = String(addressText).split(',').map(p => p.trim()).filter(Boolean);
    return chunks[1] || chunks[0] || 'Bangkok';
}

function inferEmail(name) {
    const base = String(name || 'customer').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/, '');
    return `${base || 'customer'}.${Date.now()}@vanz.local`;
}

// ── Form ──────────────────────────────────────────────────────────────────────
function CustomerFormInline({ data, onBack, onSaved, showToast }) {
    const isNew = !data.id;
    const [name, setName]       = useState(data.name    || '');
    const [phone, setPhone]     = useState(data.phone   || '');
    const [address, setAddress] = useState(data.address || '');
    const [level, setLevel]     = useState(data.membership || 'STANDARD');
    const [saving, setSaving]   = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !phone.trim()) return showToast('Name and phone are required', 'error');
        setSaving(true);
        try {
            if (isNew) {
                const profile = await postJson('/profiles', {
                    full_name: name.trim(),
                    phone: phone.trim(),
                    email: inferEmail(name),
                });
                const addressRow = await postJson('/addresses', {
                    address_name: `Customer ${name.trim()}`,
                    address_type: 'HOME',
                    address_line_1: (address || '-').trim(),
                    city: inferCity(address),
                    country_code: 'TH',
                });
                const created = await postJson('/customers', {
                    profile_id: profile.profile_id,
                    address_id: addressRow.address_id,
                    membership_level: level,
                });
                showToast(`Customer ${created.customer_code} created!`);
            } else {
                // update profile
                await putJson(`/profiles/${data.profileId}`, {
                    full_name: name.trim(),
                    phone: phone.trim(),
                    email: data.email || inferEmail(name),
                });
                // update address if exists
                if (data.addressId) {
                    await putJson(`/addresses/${data.addressId}`, {
                        address_name: data.addressName || `Customer ${name.trim()}`,
                        address_type: 'HOME',
                        address_line_1: address.trim() || '-',
                        city: inferCity(address),
                        country_code: 'TH',
                    });
                }
                await putJson(`/customers/${data.id}`, { membership_level: level });
                showToast('Customer saved!');
            }
            onSaved();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to save customer'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Customers
            </button>
            <Card className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">{isNew ? 'New Customer' : `Edit: ${data.name}`}</h3>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Profile</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Full Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" />
                    </FormField>
                    <FormField label="Phone Number" required>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" type="tel" />
                    </FormField>
                    <FormField label="Membership Level">
                        <select value={level} onChange={e => setLevel(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white">
                            <option value="STANDARD">Standard</option>
                            <option value="GOLD">Gold</option>
                            <option value="PLATINUM">Platinum</option>
                        </select>
                    </FormField>
                    <FormField label="Address">
                        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" />
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Customer'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}

// ── List ──────────────────────────────────────────────────────────────────────
export default function CustomerListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch]   = useState('');
    const [sort, setSort]       = useState({ key: 'name', direction: 'asc' });
    const [page, setPage]       = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [tick, setTick]       = useState(0);  // increment to refresh

    const refresh = () => setTick(t => t + 1);

    // Load from API
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/addresses').catch(() => []),
        ]).then(([customers, profiles, addresses]) => {
            if (cancelled) return;
            const profileMap  = new Map(profiles.map(p => [p.profile_id, p]));
            const addressMap  = new Map(addresses.map(a => [a.address_id, a]));
            setRows(customers.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                const addr = addressMap.get(c.address_id) || {};
                return {
                    id:          c.customer_code,
                    customerId:  c.customer_id,
                    profileId:   c.profile_id,
                    addressId:   c.address_id,
                    addressName: addr.address_name,
                    email:       prof.email,
                    name:        prof.full_name || '-',
                    phone:       prof.phone     || '-',
                    address:     [addr.address_line_1, addr.city].filter(Boolean).join(', ') || '-',
                    membership:  c.membership_level,
                    created:     String(c.created_at || '').slice(0, 10),
                };
            }));
        }).catch(e => {
            if (cancelled) return;
            showToast(getApiErrorMessage(e, 'Failed to load customers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (editing) return (
        <CustomerFormInline
            data={editing}
            onBack={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
            showToast={showToast}
        />
    );

    const filtered = rows.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );
    const sorted = [...filtered].sort((a, b) => {
        const va = a[sort.key] ?? '', vb = b[sort.key] ?? '';
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.direction === 'asc' ? cmp : -cmp;
    });
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const handleSort = key => setSort(prev => ({
        key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete customer ${row.id} — ${row.name}?`)) return;
        try {
            await deleteJson(`/customers/${row.id}`);
            showToast(`Customer ${row.id} deleted`);
            refresh();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Delete failed'), 'error');
        }
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customers" subtitle="Manage customer profiles and contact information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />
            <FilterBar>
                <div className="w-full md:w-80">
                    <FilterField label="Search">
                        <Input icon={Search} placeholder="Code, name, phone…"
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </FilterField>
                </div>
            </FilterBar>
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading customers…</div>
                ) : (
                    <Table
                        headers={[
                            { label: 'Code',       key: 'id',         sortable: true },
                            { label: 'Name',       key: 'name',       sortable: true },
                            { label: 'Phone',      key: 'phone',      sortable: true },
                            { label: 'Membership', key: 'membership', sortable: true },
                            { label: 'Address',    key: 'address' },
                            { label: 'Joined',     key: 'created',    sortable: true },
                            { label: '',           right: true },
                        ]}
                        onSort={handleSort} sortConfig={sort}
                    >
                        {paginated.length === 0 ? (
                            <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No customers found</td></tr>
                        ) : paginated.map(c => (
                            <Tr key={c.id}>
                                <Td mono className="text-xs text-slate-500 font-bold">{c.id}</Td>
                                <Td bold>{c.name}</Td>
                                <Td mono className="text-xs">{c.phone}</Td>
                                <Td><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{c.membership}</span></Td>
                                <Td className="max-w-[180px] truncate text-slate-500">{c.address}</Td>
                                <Td className="text-xs text-slate-400">{c.created}</Td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                        <Btn size="sm" variant="danger"    onClick={() => handleDelete(c)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                    </div>
                                </td>
                            </Tr>
                        ))}
                    </Table>
                )}
                <Pagination totalItems={filtered.length} itemsPerPage={pageSize} currentPage={page}
                    onPageChange={setPage}
                    onItemsPerPageChange={v => { setPageSize(v); setPage(1); }}
                    itemLabel="customers" />
            </Card>
        </div>
    );
}
