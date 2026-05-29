import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { delivererSchema } from '../../schemas/master';

export default function DelivererFormView({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);

    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm({
        resolver: zodResolver(delivererSchema),
        defaultValues: {
            name: data.name || '',
            license: data.license || '',
            phone: data.phone || '',
            type: data.type || 'Motorcycle',
            status: data.status || 'Active',
        }
    });

    const status = watch('status');

    const onSubmit = (formData) => {
        if (!autoId && !id.trim()) return showToast('Please enter a Deliverer ID', 'error');
        showToast('Deliverer saved!'); onBack();
    };

    const displayId = autoId ? (id || 'D-AUTO') : id;

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Deliverers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-6 text-lg">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>
                
                <div className="space-y-5">
                    {/* Row 1: Deliverer ID | Full Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <FormField label="Deliverer ID" required>
                                    <Input
                                        value={displayId}
                                        onChange={e => setId(e.target.value.toUpperCase())}
                                        placeholder="D-001"
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
                                <span className="text-sm font-bold text-current/75">Auto</span>
                            </label>
                        </div>
                        <FormField label="Full Name" required error={errors.name?.message}>
                            <Input {...register('name')} placeholder="Deliverer name" />
                        </FormField>
                    </div>

                    {/* Row 2: License Plate | Phone Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="License Plate" required error={errors.license?.message}>
                            <Input {...register('license')} placeholder="e.g. 1กข 1234" />
                        </FormField>
                        <FormField label="Phone Number" required error={errors.phone?.message}>
                            <Input {...register('phone')} placeholder="08x-xxx-xxxx" />
                        </FormField>
                    </div>

                    {/* Row 3: Vehicle Type | Status Switch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Vehicle Type" required error={errors.type?.message}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onChange={field.onChange}>
                                        <option>Motorcycle</option>
                                        <option>Car</option>
                                        <option>Truck</option>
                                    </Select>
                                )}
                            />
                        </FormField>
                        <FormField label="Status" error={errors.status?.message}>
                            <div className="bg-slate-100 dark:bg-black/20 p-1 rounded-xl flex w-full max-w-[240px] border border-slate-200/50 dark:border-red-900/30 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setValue('status', 'Active')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        status === 'Active'
                                            ? 'bg-red-500 text-white shadow-sm font-extrabold'
                                            : 'text-current/60 hover:text-current'
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('status', 'Inactive')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        status === 'Inactive'
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

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-current/10">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSubmit(onSubmit)}><Save className="w-4 h-4" /> Save Deliverer</Btn>
                </div>
            </Card>
        </div>
    );
}
