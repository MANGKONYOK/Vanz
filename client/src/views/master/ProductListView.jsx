import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, deleteJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

const STATUS_BADGE = { AVAILABLE: 'green', OUT_OF_STOCK: 'yellow', DISCONTINUED: 'red', UNAVAILABLE: 'gray' };

// ── Form ──────────────────────────────────────────────────────────────────────
function ProductFormInline({ data, storeOptions, onBack, onSaved, showToast }) {
    const isNew = !data.id;
    const [storeLov, setStoreLov] = useState(false);
    const [store,  setStore]  = useState(
        data.storeCode ? `${data.storeCode} – ${data.storeName}` : ''
    );
    const [name,   setName]   = useState(data.name    || '');
    const [price,  setPrice]  = useState(data.price   !== undefined ? String(data.price) : '');
    const [active, setActive] = useState(data.active  !== false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || price === '') return showToast('Name and price are required', 'error');
        if (!isNew && !store)             return showToast('Please select a store', 'error');
        if (Number(price) < 0)           return showToast('Price cannot be negative', 'error');
        setSaving(true);
        try {
            const payload = {
                name:       name.trim(),
                unit_price: Number(price),
                status:     active ? 'AVAILABLE' : 'UNAVAILABLE',
            };
            if (isNew) {
                if (!store) return showToast('Please select a store', 'error');
                const created = await postJson('/store-products', {
                    ...payload,
                    store_code: extractCode(store),
                });
                showToast(`Product #${created.product_id} created!`);
            } else {
                await putJson(`/store-products/${data.productId}`, payload);
                showToast('Product saved!');
            }
            onSaved();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to save product'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // LOV columns for the store picker — live data from parent
    const lovRows = storeOptions.map(s => ({
        id: s.id, name: s.name, category: s.category,
    }));

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeLov} onClose={() => setStoreLov(false)} title="Store"
                columns={[{ key: 'id', label: 'Code' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={lovRows}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setStoreLov(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Products
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-4">{isNew ? 'New Product' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store" required>
                        {isNew ? (
                            <LovInput value={store} onLov={() => setStoreLov(true)} placeholder="Select store…" />
                        ) : (
                            <Input value={data.storeName || data.storeCode || '-'} readOnly className="bg-slate-50 text-slate-500" />
                        )}
                    </FormField>
                    <FormField label="Product Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Menu item name" />
                    </FormField>
                    <FormField label="Unit Price (฿)" required>
                        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" />
                    </FormField>
                    <FormField label="Status">
                        <div className="flex items-center gap-3 mt-1">
                            <button
                                type="button"
                                onClick={() => setActive(v => !v)}
                                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                                style={{ background: active ? '#dc2626' : '#cbd5e1' }}
                            >
                                <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
                                    style={{ left: active ? 'calc(100% - 20px)' : '4px' }} />
                            </button>
                            <span className="text-sm font-semibold" style={{ color: active ? '#16a34a' : '#94a3b8' }}>
                                {active ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                    </FormField>
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
export default function ProductListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows]       = useState([]);
    const [stores, setStores]   = useState([]);  // for LovModal
    const [loading, setLoading] = useState(false);
    const [tick, setTick]       = useState(0);
    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/store-products').catch(() => []),
            getJson('/stores').catch(() => []),
        ]).then(([products, storeList]) => {
            if (cancelled) return;
            const storeMap = new Map(storeList.map(s => [s.store_id, s]));
            const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/_/g, ' ') : '-';
            // Store options for LovModal
            setStores(storeList.map(s => ({
                id: s.store_code, name: s.name, category: capitalize(s.category),
            })));
            setRows(products.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    id:        String(p.product_id),
                    productId: p.product_id,
                    storeId:   p.store_id,
                    storeCode: store.store_code || String(p.store_id),
                    storeName: store.name        || `Store #${p.store_id}`,
                    name:      p.name,
                    price:     Number(p.unit_price ?? 0),
                    active:    String(p.status || '').toUpperCase() === 'AVAILABLE',
                    status:    String(p.status || '').toUpperCase(),
                };
            }));
        }).catch(e => {
            if (cancelled) return;
            showToast(getApiErrorMessage(e, 'Failed to load products'), 'error');
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [tick]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (editing) return (
        <ProductFormInline
            data={editing}
            storeOptions={stores}
            onBack={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
            showToast={showToast}
        />
    );

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete product #${row.id} — ${row.name}?`)) return;
        try {
            await deleteJson(`/store-products/${row.productId}`);
            showToast(`Product ${row.name} deleted`);
            refresh();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Delete failed'), 'error');
        }
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Products" subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>} />
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading products…</div>
                ) : (
                    <Table headers={[
                        { label: '#' }, { label: 'Store' }, { label: 'Product Name' },
                        { label: 'Price', right: true }, { label: 'Status', center: true }, { label: '', right: true }
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No products found</td></tr>
                        ) : rows.map(p => (
                            <Tr key={p.id}>
                                <Td mono className="text-xs text-slate-400">{p.id}</Td>
                                <Td className="text-slate-600">{p.storeName}</Td>
                                <Td bold>{p.name}</Td>
                                <Td right bold className="font-mono">฿{Number(p.price).toLocaleString()}</Td>
                                <Td center>
                                    <Badge color={STATUS_BADGE[p.status] || 'gray'}>
                                        {p.status.replace('_', ' ')}
                                    </Badge>
                                </Td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                        <Btn size="sm" variant="danger"    onClick={() => handleDelete(p)}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
