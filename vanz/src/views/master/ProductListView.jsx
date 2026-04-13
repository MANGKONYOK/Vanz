import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, LovInput, LovModal } from '../../components/ui';
import { MOCK_PRODUCTS, MOCK_STORES } from '../../data/mockData';

function ProductFormInline({ data, onBack, showToast }) {
    const [active, setActive] = useState(data.active !== false);
    const [store, setStore] = useState(data.storeId ? `${data.storeId} – ${data.store}` : '');
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [name, setName] = useState(data.name || '');
    const [category, setCategory] = useState(data.category || '');
    const [price, setPrice] = useState(data.price || '');

    const handleSave = () => {
        if (!store || !name.trim() || price === '') {
            return showToast('Please fill all required fields', 'error');
        }
        if (Number(price) < 0) return showToast('Price cannot be negative', 'error');
        showToast('Product saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]} data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Products</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{data.id ? `Edit: ${data.name}` : 'New Product'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Product Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Menu item name" /></FormField>
                    <FormField label="Category"><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Main Dish, Drinks" /></FormField>
                    <FormField label="Unit Price (฿)" required><Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Active">
                        <div className="flex items-center gap-3 mt-1">
                            <button onClick={() => setActive(!active)} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: active ? '#dc2626' : '#cbd5e1' }}>
                                <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: active ? 'calc(100% - 20px)' : '4px' }}></span>
                            </button>
                            <span className="text-sm font-semibold" style={{ color: active ? '#16a34a' : '#94a3b8' }}>{active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

export default function ProductListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <ProductFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Products" subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Store' }, { label: 'Product Name' }, { label: 'Category' }, { label: 'Price', right: true }, { label: 'Status', center: true }, { label: '', right: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs">{p.id}</Td>
                            <Td>{p.store}</Td>
                            <Td bold>{p.name}</Td>
                            <Td>{p.category}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Product deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
