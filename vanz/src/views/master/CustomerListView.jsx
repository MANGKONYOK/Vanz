import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FormField, Input } from '../../components/ui';
import { MOCK_CUSTOMERS } from '../../data/mockData';

function CustomerFormInline({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [name, setName] = useState(data.name || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [address, setAddress] = useState(data.address || '');
    const handleSave = () => {
        if (!name.trim() || !phone.trim()) return showToast('Please fill all required fields', 'error');
        showToast('Customer saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Customers</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{isNew ? 'New Customer' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" /></FormField>
                    <FormField label="Phone Number" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" type="tel" /></FormField>
                    <div className="md:col-span-2"><FormField label="Address"><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" /></FormField></div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

export default function CustomerListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <CustomerFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Customers" subtitle="Manage customer profiles"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Name' }, { label: 'Phone' }, { label: 'Address' }, { label: 'Joined' }, { label: '', right: true }]}>
                    {MOCK_CUSTOMERS.map(c => (
                        <Tr key={c.id}>
                            <Td mono className="text-xs">{c.id}</Td>
                            <Td bold>{c.name}</Td>
                            <Td mono className="text-xs">{c.phone}</Td>
                            <Td>{c.address}</Td>
                            <Td className="text-xs">{c.created}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Customer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
