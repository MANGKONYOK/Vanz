import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { FormField, Input, Card, Btn, LovInput, LovModal } from '../../components/ui';
import { MOCK_STORES } from '../../data/mockData';
import { productSchema } from '../../schemas/master';

export default function ProductFormView({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);
    const [storeIsLov, setStoreIsLov] = useState(false);

    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            store: data.storeId ? `${data.storeId} – ${data.store}` : '',
            name: data.name || '',
            price: data.price || '',
            category: data.category || 'Main Dish',
            active: data.active !== false,
        }
    });

    const store = watch('store');
    const category = watch('category');
    const active = watch('active');

    const onSubmit = (formData) => {
        if (!autoId && !id.trim()) return showToast('Please enter a Product ID', 'error');
        showToast('Product saved!'); onBack();
    };

    const displayId = autoId ? (id || 'PRD-AUTO') : id;

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]} data={MOCK_STORES}
                onSelect={r => { setValue('store', `${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Products</button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-6 text-lg">{data.id ? `Edit: ${data.name}` : 'New Product'}</h3>
                
                <div className="space-y-6">
                    {/* Row 1: Product ID | Product Name | Unit Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <FormField label="Product ID" required>
                                    <Input
                                        value={displayId}
                                        onChange={e => setId(e.target.value.toUpperCase())}
                                        placeholder="PRD-001"
                                        readOnly={autoId}
                                        className={autoId ? 'bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono' : 'font-mono'}
                                    />
                                </FormField>
                            </div>
                            <label className="flex items-center gap-2 mb-2.5 cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={autoId}
                                        onChange={e => setAutoId(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                        <Check size={12} strokeWidth={4} className={autoId ? 'scale-100' : 'scale-0'} />
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-current/75 font-sans">Auto</span>
                            </label>
                        </div>
                        <FormField label="Product Name" required error={errors.name?.message}>
                            <Input {...register('name')} placeholder="Menu item name" />
                        </FormField>
                        <FormField label="Unit Price" required error={errors.price?.message}>
                            <Input type="number" {...register('price')} placeholder="0" />
                        </FormField>
                    </div>

                    {/* Row 2: Store (LoV) | Category (toggle list) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Store" required error={errors.store?.message}>
                            <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                        </FormField>
                        <FormField label="Category" required error={errors.category?.message}>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {['Main Dish', 'Drinks', 'Appetizer', 'Dessert', 'Other'].map(cat => {
                                    const isSelected = category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setValue('category', cat)}
                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                                                isSelected
                                                    ? 'bg-red-500 border-red-500 text-white shadow-sm font-extrabold'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-current/75 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-650'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </FormField>
                    </div>

                    {/* Row 3: Active tab switch */}
                    <div className="grid grid-cols-1 gap-5">
                        <FormField label="Status">
                            <div className="bg-slate-100 dark:bg-black/20 p-1 rounded-xl flex w-full max-w-[240px] border border-slate-200/50 dark:border-red-900/30 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setValue('active', true)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        active
                                            ? 'bg-red-500 text-white shadow-sm font-extrabold'
                                            : 'text-current/60 hover:text-current'
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('active', false)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        !active
                                            ? 'bg-slate-400 dark:bg-slate-600 text-white shadow-sm font-extrabold'
                                            : 'text-current/60 hover:text-current'
                                    }`}
                                >
                                    Inactive
                                </button>
                            </div>
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-current/10">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSubmit(onSubmit)}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}
