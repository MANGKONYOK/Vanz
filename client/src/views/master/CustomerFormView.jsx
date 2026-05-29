import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { FormField, Input, Card, Btn } from '../../components/ui';
import { customerSchema } from '../../schemas/master';

export default function CustomerFormView({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || '',
            description: data.description || '',
        }
    });

    const onSubmit = (formData) => {
        if (!autoId && !id.trim()) return showToast('Please enter a Customer ID', 'error');
        showToast('Customer saved!'); onBack();
    };

    const displayId = autoId ? (id || 'C-AUTO') : id;

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Customers
            </button>
            <Card className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">{isNew ? 'New Customer' : `Edit: ${data.name}`}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <FormField label="Customer ID" required>
                                    <Input
                                        value={displayId}
                                        onChange={e => setId(e.target.value.toUpperCase())}
                                        placeholder="C-001"
                                        readOnly={autoId}
                                        className={autoId ? 'bg-slate-50 text-slate-500 font-mono' : 'font-mono'}
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
                                    <div className="w-5 h-5 border-2 border-slate-200 rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                        <Check size={12} strokeWidth={4} className={autoId ? 'scale-100' : 'scale-0'} />
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-600">Auto</span>
                            </label>
                        </div>
                        <FormField label="Address" error={errors.address?.message}>
                            <Input {...register('address')} placeholder="Delivery address" />
                        </FormField>
                    </div>

                    <div className="space-y-4">
                        <FormField label="Full Name" required error={errors.name?.message}>
                            <Input {...register('name')} placeholder="Customer name" />
                        </FormField>
                        <FormField label="Phone Number" required error={errors.phone?.message}>
                            <Input {...register('phone')} placeholder="0xx-xxx-xxxx" type="tel" />
                        </FormField>
                    </div>

                    <div className="md:col-span-2 mt-2">
                        <FormField label="Description" error={errors.description?.message}>
                            <Input {...register('description')} placeholder="Enter details or notes about the customer..." />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSubmit(onSubmit)}><Save className="w-4 h-4" /> Save Customer</Btn>
                </div>
            </Card>
        </div>
    );
}
