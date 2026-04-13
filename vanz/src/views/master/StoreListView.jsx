import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, Select } from '../../components/ui';
import { MOCK_STORES } from '../../data/mockData';

function StoreFormInline({ data, onBack, showToast }) {
    const [name, setName] = useState(data.name || '');
    const [category, setCategory] = useState(data.category || 'Thai Food');
    const [phone, setPhone] = useState(data.phone || '');
    const [open, setOpen] = useState(data.open || '');
    const [address, setAddress] = useState(data.address || '');

    const handleSave = () => {
        if (!name.trim() || !category || !phone.trim() || !address.trim()) {
            return showToast('Please fill all required fields', 'error');
        }
        showToast('Store saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Stores</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{data.id ? `Edit: ${data.name}` : 'New Store'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Restaurant name" /></FormField>
                    <FormField label="Category" required>
                        <Select value={category} onChange={e => setCategory(e.target.value)}><option>Thai Food</option><option>Japanese</option><option>Cafe & Drinks</option><option>Fast Food</option><option>Other</option></Select>
                    </FormField>
                    <FormField label="Phone" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="02-xxx-xxxx" /></FormField>
                    <FormField label="Operating Hours"><Input value={open} onChange={e => setOpen(e.target.value)} placeholder="09:00-21:00" /></FormField>
                    <div className="md:col-span-2"><FormField label="Address" required><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" /></FormField></div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

export default function StoreListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <StoreFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Stores" subtitle="Manage restaurant & store listings"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Store</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Store Name' }, { label: 'Category' }, { label: 'Address' }, { label: 'Phone' }, { label: 'Hours' }, { label: '', right: true }]}>
                    {MOCK_STORES.map(s => (
                        <Tr key={s.id}>
                            <Td mono className="text-xs">{s.id}</Td>
                            <Td bold>{s.name}</Td>
                            <Td><Badge>{s.category}</Badge></Td>
                            <Td>{s.address}</Td>
                            <Td>{s.phone}</Td>
                            <Td className="text-xs">{s.open}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(s)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Store deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
