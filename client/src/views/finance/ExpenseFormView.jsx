import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

const EXPENSE_TYPES = ['FUEL', 'MAINTENANCE', 'TOLL', 'OTHER'];

export default function ExpenseFormView({ onNavigateBack, showToast }) {
    const onBack = onNavigateBack || (() => {});

    const [deliverers,   setDeliverers]   = useState([]);
    const [delivererId,  setDelivererId]  = useState('');
    const [isLovOpen,    setIsLovOpen]    = useState(false);
    const [voucherDate,  setVoucherDate]  = useState(() => new Date().toISOString().slice(0, 10));
    const [items,        setItems]        = useState([{ id: 1, type: 'TOLL', desc: '', amount: 0, receipt: '' }]);
    const [saving,       setSaving]       = useState(false);

    const totalAmount = items.reduce((s, i) => s + Number(i.amount || 0), 0);

    // Load deliverers from API
    useEffect(() => {
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([delivererList, profiles]) => {
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            setDeliverers(delivererList.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return {
                    id:   d.deliverer_code,
                    name: prof.full_name || d.deliverer_code,
                    type: d.vehicle_type || '-',
                };
            }));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const updateItem = (i, field, value) => {
        setItems(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
    };

    const handleSave = async () => {
        if (!delivererId)              return showToast('Please select a deliverer', 'error');
        if (items.length === 0)        return showToast('Voucher must have at least one expense item', 'error');
        if (items.some(i => Number(i.amount) <= 0))  return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim()))         return showToast('Please provide a description for each item', 'error');
        setSaving(true);
        try {
            const delivererCode = extractCode(delivererId);
            // Look up the latest delivery for this deliverer to link the voucher
            const deliveries = await getJson('/deliveries', { deliverer_code: delivererCode });
            const delivery = Array.isArray(deliveries) ? deliveries[deliveries.length - 1] : null;
            if (!delivery) {
                showToast('Selected deliverer has no delivery record — voucher cannot be linked', 'error');
                return;
            }
            await postJson('/expense-vouchers', {
                delivery_id:  delivery.delivery_id,
                voucher_date: voucherDate,
                total_amount: totalAmount,
                expense_items: items.map(i => ({
                    expense_type:           i.type,
                    description:            i.desc.trim(),
                    amount:                 Number(i.amount),
                    receipt_reference_code: i.receipt.trim() || undefined,
                })),
            });
            showToast('Voucher saved successfully!');
            onBack();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to save voucher'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal
                isOpen={isLovOpen}
                onClose={() => setIsLovOpen(false)}
                title="Deliverer"
                columns={[{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={deliverers}
                onSelect={r => { setDelivererId(`${r.id} – ${r.name}`); setIsLovOpen(false); }}
            />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>

            {/* ── Voucher Header ──────────────────────────────────────────── */}
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Deliverer" required>
                        <LovInput value={delivererId} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer…" />
                    </FormField>
                    <FormField label="Voucher Date" required>
                        <Input type="date" value={voucherDate} onChange={e => setVoucherDate(e.target.value)} />
                    </FormField>
                </div>
            </Card>

            {/* ── Expense Items ───────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                <CardHeader title="Expense Items" action={
                    <Btn size="sm" variant="secondary"
                        onClick={() => setItems(prev => [...prev, { id: Date.now(), type: 'TOLL', desc: '', amount: 0, receipt: '' }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Row
                    </Btn>
                } />
                <Table
                    headers={[
                        { label: 'Type' }, { label: 'Description' },
                        { label: 'Receipt Ref.' }, { label: 'Amount (฿)', right: true }, { label: '', center: true },
                    ]}
                    minWidth="650px"
                >
                    {items.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <Td>
                                <select
                                    value={item.type}
                                    onChange={e => updateItem(i, 'type', e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 bg-white w-full"
                                >
                                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Td>
                            <Td>
                                <input
                                    value={item.desc}
                                    onChange={e => updateItem(i, 'desc', e.target.value)}
                                    placeholder="e.g. Expressway Toll"
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full min-w-[120px]"
                                />
                            </Td>
                            <Td>
                                <input
                                    value={item.receipt}
                                    onChange={e => updateItem(i, 'receipt', e.target.value)}
                                    placeholder="RC-XXXX"
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full mono"
                                />
                            </Td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number" min="0" value={item.amount}
                                    onChange={e => updateItem(i, 'amount', Number(e.target.value))}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24"
                                />
                            </td>
                            <Td center>
                                <button
                                    onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{totalAmount.toLocaleString()}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg" disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Voucher'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
