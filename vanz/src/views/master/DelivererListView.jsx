import { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, Select } from '../../components/ui';
import { MOCK_DELIVERERS } from '../../data/mockData';

function DelivererFormInline({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [status, setStatus] = useState(data.status || 'Active');
    const [name, setName] = useState(data.name || '');
    const [license, setLicense] = useState(data.license || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [type, setType] = useState(data.type || 'Motorcycle');

    const handleSave = () => {
        if (!name.trim() || !license.trim() || !phone.trim() || !type) {
            return showToast('Please fill all required fields', 'error');
        }
        showToast('Deliverer saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Deliverers</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer name" /></FormField>
                    <FormField label="License Plate" required><Input value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. 1กข 1234" /></FormField>
                    <FormField label="Phone Number" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" /></FormField>
                    <FormField label="Vehicle Type" required>
                        <Select value={type} onChange={e => setType(e.target.value)}><option>Motorcycle</option><option>Car</option><option>Truck</option></Select>
                    </FormField>
                    <FormField label="Status">
                        <div className="flex items-center gap-3 mt-1">
                            <button onClick={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: status === 'Active' ? '#dc2626' : '#cbd5e1' }}>
                                <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: status === 'Active' ? 'calc(100% - 20px)' : '4px' }}></span>
                            </button>
                            <span className="text-sm font-semibold" style={{ color: status === 'Active' ? '#16a34a' : '#94a3b8' }}>{status}</span>
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

export default function DelivererListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <DelivererFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Deliverers" subtitle="Manage deliverer profiles"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Name' }, { label: 'License Plate' }, { label: 'Vehicle' }, { label: 'Phone' }, { label: 'Status', center: true }, { label: 'Rating', center: true }, { label: '', right: true }]}>
                    {MOCK_DELIVERERS.map(d => (
                        <Tr key={d.id}>
                            <Td mono className="text-xs">{d.id}</Td>
                            <Td bold>{d.name}</Td>
                            <Td mono className="text-xs">{d.license}</Td>
                            <Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <Td center><Badge color={d.status === 'Active' ? 'green' : 'gray'}>{d.status}</Badge></Td>
                            <Td center><span className="flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{d.rating}</span></Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(d)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Deliverer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
