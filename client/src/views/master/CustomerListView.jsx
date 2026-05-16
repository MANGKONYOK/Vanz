import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save, Check } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, FormField, Input, Select, Pagination } from '../../components/ui';
import { MOCK_CUSTOMERS } from '../../data/mockData';

function CustomerFormInline({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);
    const [name, setName] = useState(data.name || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [address, setAddress] = useState(data.address || '');

    const handleSave = () => {
        if (!name.trim() || !phone.trim()) return showToast('Please fill all required fields', 'error');
        if (!autoId && !id.trim()) return showToast('Please enter a Customer Code', 'error');
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
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Customer Profile
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <FormField label="Customer Code" required>
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
                        <FormField label="Full Name" required>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" />
                        </FormField>
                    </div>

                    <div className="space-y-4">
                        <FormField label="Phone Number" required>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" type="tel" />
                        </FormField>
                        <FormField label="Address">
                            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save Customer</Btn>
                </div>
            </Card>
        </div>
    );
}

export default function CustomerListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (editing) return <CustomerFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;

    // 1. Filter
    const filtered = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Paginate
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    const start = filtered.length > 0 ? (page - 1) * pageSize + 1 : 0;
    const end = Math.min(page * pageSize, filtered.length);

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customers" subtitle="Manage customer profiles and contact information"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search code, name, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-white border-slate-200 h-10 shadow-sm" />}
                    filter={
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-400">
                                {start}-{end} of {filtered.length} customers
                            </span>
                            <Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 border-slate-200 bg-white shadow-sm w-24">
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
                            </Select>
                        </div>
                    }
                />
                <Table
                    headers={[
                        { label: 'ID', key: 'id', sortable: true },
                        { label: 'Name', key: 'name', sortable: true },
                        { label: 'Phone', key: 'phone', sortable: true },
                        { label: 'Address', key: 'address' },
                        { label: 'Joined', key: 'created', sortable: true },
                        { label: '', right: true }
                    ]}
                    onSort={handleSort}
                    sortConfig={sort}
                >
                    {paginated.map(c => (
                        <Tr key={c.id}>
                            <Td mono className="text-xs text-slate-500 font-bold">{c.id}</Td>
                            <Td bold>{c.name}</Td>
                            <Td mono className="text-xs">{c.phone}</Td>
                            <Td className="max-w-[200px] truncate">{c.address}</Td>
                            <Td className="text-xs text-slate-500">{c.created}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Customer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>

                <Pagination
                    totalItems={filtered.length}
                    itemsPerPage={pageSize}
                    currentPage={page}
                    onPageChange={setPage}
                    showSummary={false}
                    itemLabel="customers"
                />
            </Card>
        </div>
    );
}
