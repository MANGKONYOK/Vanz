import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, Select } from '../../components/ui';
import { getJson, postJson, putJson, deleteJson, getApiErrorMessage } from '../../api/http';

const BADGE_COLOR = { ACTIVE: 'green', INACTIVE: 'gray', SUSPENDED: 'red' };

function inferCity(addressText) {
    if (!addressText) return 'Bangkok';
    const chunks = String(addressText).split(',').map(p => p.trim()).filter(Boolean);
    return chunks[1] || chunks[0] || 'Bangkok';
}

const CATEGORIES = ['Thai Food', 'Japanese', 'Chinese', 'Western', 'Cafe & Drinks', 'Fast Food', 'Bakery', 'Grocery', 'Other'];

// ── Form ──────────────────────────────────────────────────────────────────────
function StoreFormInline({ data, onBack, onSaved, showToast }) {
    const isNew = !data.id;
    const [name,     setName]     = useState(data.name     || '');
    const [category, setCategory] = useState(data.category || 'Thai Food');
    const [address,  setAddress]  = useState(data.address  || '');
    const [status,   setStatus]   = useState(data.status   || 'ACTIVE');
    const [saving,   setSaving]   = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !address.trim())
            return showToast('Name and address are required', 'error');
        setSaving(true);
        try {
            if (isNew) {
                const addressRow = await postJson('/addresses', {
                    address_name: `${name.trim()} Address`,
                    address_type: 'STORE',
                    address_line_1: address.trim(),
                    city: inferCity(address),
                    country_code: 'TH',
                });
                const created = await postJson('/stores', {
                    name: name.trim(),
                    address_id: addressRow.address_id,
                    category: category.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
                    status,
                });
                showToast(`Store ${created.store_code} created!`);
            } else {
                if (data.addressId) {
                    await putJson(`/addresses/${data.addressId}`, {
                        address_name: data.addressName || `${name.trim()} Address`,
                        address_type: 'STORE',
                        address_line_1: address.trim(),
                        city: data.city || inferCity(address),
                        country_code: 'TH',
                    });
                }
                await putJson(`/stores/${data.id}`, {
                    name: name.trim(),
                    category: category.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
                    status,
                });
                showToast('Store saved!');
            }
            onSaved();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to save store'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Stores
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-4">{isNew ? 'New Store' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Restaurant name" />
                    </FormField>
                    <FormField label="Category" required>
                        <Select value={category} onChange={e => setCategory(e.target.value)}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="Status">
                        <Select value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                        </Select>
                    </FormField>
                    <div className="md:col-span-2">
                        <FormField label="Address" required>
                            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full store address" />
                        </FormField>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}

// ── List ──────────────────────────────────────────────────────────────────────
export default function StoreListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [tick, setTick]       = useState(0);
    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/stores').catch(() => []),
            getJson('/addresses').catch(() => []),
        ]).then(([stores, addresses]) => {
            if (cancelled) return;
            const addressMap = new Map(addresses.map(a => [a.address_id, a]));
            setRows(stores.map(s => {
                const addr = addressMap.get(s.address_id) || {};
                const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/_/g, ' ') : '-';
                return {
                    id:          s.store_code,
                    storeId:     s.store_id,
                    addressId:   s.address_id,
                    addressName: addr.address_name,
                    city:        addr.city,
                    name:        s.name,
                    category:    capitalize(s.category),
                    status:      s.status || 'ACTIVE',
                    address:     [addr.address_line_1, addr.city].filter(Boolean).join(', ') || '-',
                    rating:      s.rating ?? null,
                };
            }));
        }).catch(e => {
            if (cancelled) return;
            showToast(getApiErrorMessage(e, 'Failed to load stores'), 'error');
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [tick]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (editing) return (
        <StoreFormInline
            data={editing}
            onBack={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
            showToast={showToast}
        />
    );

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete store ${row.id} — ${row.name}?`)) return;
        try {
            await deleteJson(`/stores/${row.id}`);
            showToast(`Store ${row.id} deleted`);
            refresh();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Delete failed'), 'error');
        }
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Stores" subtitle="Manage restaurant & store listings"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Store</Btn>} />
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading stores…</div>
                ) : (
                    <Table headers={[
                        { label: 'Code' }, { label: 'Store Name' }, { label: 'Category' },
                        { label: 'Address' }, { label: 'Status', center: true }, { label: '', right: true }
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No stores found</td></tr>
                        ) : rows.map(s => (
                            <Tr key={s.id}>
                                <Td mono className="text-xs">{s.id}</Td>
                                <Td bold>{s.name}</Td>
                                <Td><Badge>{s.category}</Badge></Td>
                                <Td className="max-w-[200px] truncate text-slate-500">{s.address}</Td>
                                <Td center><Badge color={BADGE_COLOR[s.status] || 'gray'}>{s.status}</Badge></Td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Btn size="sm" variant="secondary" onClick={() => setEditing(s)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                        <Btn size="sm" variant="danger"    onClick={() => handleDelete(s)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                    </div>
                                </td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
