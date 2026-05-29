import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { storeSchema } from '../../schemas/master';

export default function StoreFormView({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);

    const { register, handleSubmit, formState: { errors }, control } = useForm({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: data.name || '',
            category: data.category || 'Thai Food',
            phone: data.phone || '',
            address: data.address || '',
            open: data.open || '',
            description: data.description || '',
        }
    });

    const onSubmit = (formData) => {
        if (!autoId && !id.trim()) return showToast('Please enter a Store ID', 'error');
        showToast('Store saved!'); onBack();
    };

    const displayId = autoId ? (id || 'ST-AUTO') : id;

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Stores</button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-6 text-lg">{data.id ? `Edit: ${data.name}` : 'New Store'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <FormField label="Store ID" required>
                                <Input
                                    value={displayId}
                                    onChange={e => setId(e.target.value.toUpperCase())}
                                    placeholder="ST-001"
                                    readOnly={autoId}
                                    className={autoId ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 font-mono' : 'font-mono'}
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
                                <div className="w-5 h-5 border-2 border-slate-300 dark:border-white bg-transparent rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={4} color="white" className={autoId ? 'scale-100' : 'scale-0'} />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Auto</span>
                        </label>
                    </div>
                    <FormField label="Store Name" required error={errors.name?.message}><Input {...register('name')} placeholder="Restaurant name" /></FormField>
                    <FormField label="Category" required error={errors.category?.message}>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onChange={field.onChange}><option>Thai Food</option><option>Japanese</option><option>Cafe & Drinks</option><option>Fast Food</option><option>Other</option></Select>
                            )}
                        />
                    </FormField>
                    <FormField label="Phone Number" required error={errors.phone?.message}><Input {...register('phone')} placeholder="02-xxx-xxxx" /></FormField>
                    <FormField label="Address" required error={errors.address?.message}><Input {...register('address')} placeholder="Full address" /></FormField>
                    <FormField label="Operating Hours" error={errors.open?.message}><Input {...register('open')} placeholder="09:00-21:00" /></FormField>
                    <div className="md:col-span-2 mt-2">
                        <FormField label="Description" error={errors.description?.message}>
                            <Input {...register('description')} placeholder="Enter details or notes about the store..." />
                        </FormField>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-current/10">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSubmit(onSubmit)}><Save className="w-4 h-4" /> Save Store</Btn>
                </div>
            </Card>
        </div>
    );
}
