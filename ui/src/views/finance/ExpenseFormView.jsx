import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_DELIVERERS } from '../../data/mockData';

export default function ExpenseFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, type: 'Toll', desc: 'Expressway', amount: 50, receipt: 'RC-9901' }]);
    const [delivererId, setDelivererId] = useState('');
    const [isLovOpen, setIsLovOpen] = useState(false);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const handleSave = () => {
        if (!delivererId) return showToast('Please select a deliverer', 'error');
        if (items.length === 0) return showToast('Voucher must contain at least one expense item', 'error');
        if (items.some(i => i.amount <= 0)) return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim())) return showToast('Please provide descriptions for all expense items', 'error');
        showToast('Voucher saved successfully!'); onNavigateBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS} onSelect={r => { setDelivererId(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Voucher Code">
                        <Input readOnly defaultValue="EXP-2026-000792" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Deliverer" required>
                        <LovInput value={delivererId} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                    </FormField>
                    <FormField label="Voucher Date" required>
                        <Input type="date" defaultValue="2026-03-23" />
                    </FormField>
                    <FormField label="Status">
                        <Select><option value="DRAFT">DRAFT</option><option value="SUBMITTED">SUBMITTED</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></Select>
                    </FormField>
                    <FormField label="Approved By" required>
                        <Input placeholder="Manager Name" defaultValue="Admin User" />
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Expense Items" action={
                    <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), type: 'Fuel', desc: '', amount: 0, receipt: '' }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Row
                    </Btn>
                } />
                <Table headers={[{ label: 'Type' }, { label: 'Description' }, { label: 'Receipt Reference' }, { label: 'Amount', right: true }, { label: '', center: true }]} minWidth="650px">
                    {items.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <Td><select value={item.type} onChange={e => { const n = [...items]; n[i].type = e.target.value; setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 bg-white w-full"><option>Toll</option><option>Fuel</option><option>Parking</option><option>MAINTENANCE</option><option>OTHER</option></select></Td>
                            <Td><input defaultValue={item.desc} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full min-w-[120px]" /></Td>
                            <Td><input defaultValue={item.receipt} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full mono" /></Td>
                            <td className="px-4 py-3 text-right"><input type="number" value={item.amount} onChange={e => { const n = [...items]; n[i].amount = Number(e.target.value); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24" /></td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== item.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{totalAmount}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Save Voucher</Btn>
                </div>
            </Card>
        </div>
    );
}
