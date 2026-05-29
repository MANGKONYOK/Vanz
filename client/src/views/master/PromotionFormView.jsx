import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Check } from 'lucide-react';
import { Btn, Card, CardHeader, Table, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_STORES, MOCK_PRODUCTS } from '../../data/mockData';
import { promotionSchema } from '../../schemas/master';

export default function PromotionFormView({ data, onNavigateBack, showToast }) {
    const isNew = !data;
    const editData = data || {};
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', discount: 0 }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [lovIdx, setLovIdx] = useState(null);
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [promoCode, setPromoCode] = useState(editData.id || '');
    const [autoCode, setAutoCode] = useState(isNew);

    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm({
        resolver: zodResolver(promotionSchema),
        defaultValues: {
            store: editData.storeId ? `${editData.storeId} – ${editData.store}` : '',
            name: editData.name || '',
            discountType: editData.discountType || 'PERCENTAGE',
            startDate: editData.startDate || '',
            endDate: editData.endDate || '',
        }
    });

    const store = watch('store');
    const discountType = watch('discountType');

    const displayCode = autoCode ? (promoCode || 'PROMO-AUTO') : promoCode;

    const onSubmit = (formData) => {
        if (!autoCode && !promoCode.trim()) return showToast('Please enter a Campaign Code', 'error');
        if (new Date(formData.endDate) < new Date(formData.startDate)) return showToast('End Date cannot be before Start Date', 'error');
        if (items.length === 0) return showToast('Must include at least one product in the campaign', 'error');
        if (items.some(i => !i.productName || i.discount <= 0)) return showToast('All products must have valid positive discounts', 'error');
        showToast('Promotion Campaign saved successfully!'); onNavigateBack();
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES} onSelect={r => { setValue('store', `${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Product"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={MOCK_PRODUCTS} onSelect={r => { if (lovIdx !== null) { const n = [...items]; n[lovIdx].productName = r.name; n[lovIdx].productId = r.id; setItems(n); } setIsLovOpen(false); setLovIdx(null); }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Promotions</button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4 text-lg">{isNew ? 'New Campaign' : `Edit: ${editData.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <FormField label="Promotion ID" required>
                                <Input
                                    value={displayCode}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="PROMO-001"
                                    readOnly={autoCode}
                                    className={autoCode ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 font-mono' : 'font-mono'}
                                />
                            </FormField>
                        </div>
                        <label className="flex items-center gap-2 mb-2.5 cursor-pointer select-none">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={autoCode}
                                    onChange={e => setAutoCode(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-slate-300 dark:border-white bg-transparent rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={4} color="white" className={autoCode ? 'scale-100' : 'scale-0'} />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200 font-sans">Auto</span>
                        </label>
                    </div>
                    <FormField label="Campaign Name" required error={errors.name?.message}><Input {...register('name')} placeholder="e.g. Summer Sale" /></FormField>
                    <FormField label="Store" required error={errors.store?.message}>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Discount Type" required error={errors.discountType?.message}>
                        <Controller
                            name="discountType"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onChange={field.onChange}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed Amount</option></Select>
                            )}
                        />
                    </FormField>
                    <FormField label="Start Date" required error={errors.startDate?.message}><Input type="date" {...register('startDate')} /></FormField>
                    <FormField label="End Date" required error={errors.endDate?.message}><Input type="date" {...register('endDate')} /></FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Promotion Items" action={
                    <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', discount: 0 }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </Btn>
                } />
                <Table headers={[{ label: 'Product' }, { label: 'Discount Value', right: true }, { label: '', center: true }]} minWidth="500px">
                    {items.map((it, i) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-400 dark:focus-within:border-red-500">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                    <button onClick={() => { setLovIdx(i); setIsLovOpen(true); }} className="shrink-0 px-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors border-l border-slate-700 dark:border-slate-600">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right"><input type="number" value={it.discount} onChange={e => { const n = [...items]; n[i].discount = Number(e.target.value); setItems(n); }} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 text-right w-24" /></td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex justify-end">
                    <Btn onClick={handleSubmit(onSubmit)} size="lg"><Save className="w-4 h-4" /> Save Campaign</Btn>
                </div>
            </Card>
        </div>
    );
}
