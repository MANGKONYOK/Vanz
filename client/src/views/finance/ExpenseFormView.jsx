import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import { Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';

const EXPENSE_TYPES = ['toll', 'fuel', 'parking', 'maintenance', 'other'];

export default function ExpenseFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.id;

    // Header fields
    const [delivererLabel, setDelivererLabel] = useState(
        data.delivererCode && data.delivererName ? `${data.delivererCode} – ${data.delivererName}` : ''
    );
    const [deliveryId,   setDeliveryId]   = useState(data.deliveryId   || null);
    const [deliveryLabel, setDeliveryLabel] = useState(data.deliveryId ? `Delivery #${data.deliveryId}` : '');
    const [voucherDate,  setVoucherDate]  = useState(data.voucherDate  || new Date().toISOString().slice(0, 10));
    const [status,       setStatus]       = useState(data.status       || 'draft');

    const [items, setItems] = useState(() =>
        isNew ? [{ id: 1, type: 'toll', desc: '', amount: 0, receipt: '' }]
              : (data.expenseItems || []).map((it, idx) => ({
                    id:      idx + 1,
                    type:    it.expense_type || 'toll',
                    desc:    it.description  || '',
                    amount:  Number(it.amount || 0),
                    receipt: it.receipt_reference_code || '',
                }))
    );

    // LoV data
    const [deliverers,  setDeliverers]  = useState([]);
    const [deliveries,  setDeliveries]  = useState([]);
    const [profiles,    setProfiles]    = useState([]);
    const [delivLovOpen, setDelivLovOpen] = useState(false);
    const [deliveryLovOpen, setDeliveryLovOpen] = useState(false);
    const [loadingDels, setLoadingDels] = useState(false);
    const [itemSearch,  setItemSearch]  = useState('');
    const [saving,      setSaving]      = useState(false);

    useEffect(() => {
        Promise.all([getJson('/deliverers'), getJson('/profiles')])
            .then(([dels, profs]) => {
                const profMap = new Map(profs.map(p => [p.profile_id, p]));
                setDeliverers(dels.map(d => ({
                    ...d,
                    full_name: profMap.get(d.profile_id)?.full_name || '—',
                })));
                setProfiles(profs);
            }).catch(() => {});
    }, []);

    const loadDeliveries = async (delivererCode) => {
        if (!delivererCode) return;
        setLoadingDels(true);
        try {
            const dels = await getJson('/deliveries');
            const deliverer = deliverers.find(d => d.deliverer_code === delivererCode);
            if (deliverer) {
                setDeliveries(dels.filter(d => d.deliverer_id === deliverer.deliverer_id));
            }
        } catch (e) {
            showToast('Failed to load deliveries', 'error');
        } finally {
            setLoadingDels(false);
        }
    };

    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const validate = () => {
        if (!deliveryId)           return 'Delivery is required';
        if (!voucherDate)          return 'Voucher Date is required';
        if (items.length === 0)    return 'Must have at least one expense item';
        if (items.some(i => i.amount <= 0)) return 'All expense amounts must be > 0';
        if (items.some(i => !i.desc.trim())) return 'All items need a description';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            const body = {
                voucher_date:  voucherDate,
                total_amount:  totalAmount,
                expense_items: items.map(i => ({
                    expense_type:           i.type,
                    description:            i.desc.trim(),
                    amount:                 i.amount,
                    receipt_reference_code: i.receipt.trim(),
                })),
            };
            if (isNew) {
                await postJson('/expense-vouchers', { ...body, delivery_id: deliveryId });
                showToast('Voucher created successfully!');
            } else {
                await putJson(`/expense-vouchers/${data.voucherCode}`, { ...body, status });
                showToast('Voucher updated successfully!');
            }
            onSaved();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Save failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const addItem    = () => setItems([...items, { id: Date.now(), type: 'toll', desc: '', amount: 0, receipt: '' }]);
    const removeItem = (id) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    const filteredItems = items.filter(i =>
        i.desc.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.type.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.receipt.toLowerCase().includes(itemSearch.toLowerCase())
    );

    return (
        <div className="fade-in space-y-5">
            {/* Deliverer LoV */}
            <LovModal isOpen={delivLovOpen} onClose={() => setDelivLovOpen(false)} title="Deliverer"
                columns={[{ key: 'deliverer_code', label: 'Code' }, { key: 'full_name', label: 'Name' }, { key: 'vehicle_type', label: 'Vehicle' }]}
                data={deliverers}
                onSelect={r => {
                    setDelivererLabel(`${r.deliverer_code} – ${r.full_name}`);
                    setDeliveryId(null);
                    setDeliveryLabel('');
                    setDelivLovOpen(false);
                    loadDeliveries(r.deliverer_code);
                }} />

            {/* Delivery LoV */}
            <LovModal isOpen={deliveryLovOpen} onClose={() => setDeliveryLovOpen(false)} title="Delivery"
                columns={[{ key: 'delivery_id', label: 'ID' }, { key: 'delivery_type', label: 'Type' }, { key: 'delivery_fee', label: 'Fee' }]}
                data={deliveries}
                onSelect={r => {
                    setDeliveryId(r.delivery_id);
                    setDeliveryLabel(`Delivery #${r.delivery_id} (${r.delivery_type})`);
                    setDeliveryLovOpen(false);
                }} />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>

            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Voucher Code">
                        <Input value={isNew ? '(assigned on save)' : data.voucherCode} readOnly
                            className="bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono" />
                    </FormField>

                    {isNew ? (
                        <>
                            <FormField label="Deliverer" required>
                                <LovInput value={delivererLabel} onLov={() => setDelivLovOpen(true)} placeholder="Select deliverer..." />
                            </FormField>
                            <FormField label="Delivery" required>
                                <div className="flex gap-2">
                                    <LovInput value={deliveryLabel} onLov={() => setDeliveryLovOpen(true)} placeholder="Select delivery..." />
                                    {delivererLabel && (
                                        <button onClick={() => loadDeliveries(delivererLabel.split(' – ')[0])}
                                            className="shrink-0 p-2 text-current/60 hover:text-current transition-colors" title="Reload deliveries">
                                            <RefreshCw className={`w-4 h-4 ${loadingDels ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </FormField>
                        </>
                    ) : (
                        <>
                            <FormField label="Deliverer">
                                <Input value={`${data.delivererCode} – ${data.delivererName}`} readOnly
                                    className="bg-slate-50 dark:bg-slate-800/50 text-current/60" />
                            </FormField>
                            <FormField label="Status">
                                <Select value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="draft">draft</option>
                                    <option value="submitted">submitted</option>
                                </Select>
                            </FormField>
                        </>
                    )}

                    <FormField label="Date" required>
                        <Input type="date" value={voucherDate} onChange={e => setVoucherDate(e.target.value)} />
                    </FormField>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search description, receipt..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={<Btn size="sm" variant="secondary" onClick={addItem}><Plus className="w-3.5 h-3.5" /> Add Row</Btn>}
                />
                <Table
                    headers={[
                        { label: 'Receipt',     width: '22%' },
                        { label: 'Type',        width: '18%' },
                        { label: 'Description', width: '38%' },
                        { label: 'Expense',     right: true, width: '14%' },
                        { label: '',            center: true, width: '8%'  },
                    ]}
                    minWidth="650px"
                >
                    {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <Td>
                                <input value={item.receipt} onChange={e => updateItem(item.id, 'receipt', e.target.value)}
                                    placeholder="RC-1234"
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 w-full font-mono" />
                            </Td>
                            <Td>
                                <select value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value)}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full">
                                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Td>
                            <Td>
                                <input value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)}
                                    placeholder="e.g. Expressway Toll"
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 w-full min-w-[120px]" />
                            </Td>
                            <Td right>
                                <input type="number" min="0" value={item.amount}
                                    onChange={e => updateItem(item.id, 'amount', Number(e.target.value))}
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 text-right w-full min-w-[80px]" />
                            </Td>
                            <Td center>
                                <button onClick={() => removeItem(item.id)}
                                    className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-current/60 font-bold uppercase tracking-wide">Total Expense</p>
                        <p className="text-3xl font-black text-current mono">฿{totalAmount.toLocaleString()}</p>
                    </div>
                    <Btn onClick={handleSave} disabled={saving} size="lg">
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Voucher'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
