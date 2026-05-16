import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, Input, Pagination } from '../../components/ui';
import { INITIAL_ORDERS } from '../../data/mockData';

export default function CustomerOrderListView({ onNavigate, showToast }) {
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete order ${id}?`)) {
            setOrders(prev => prev.filter(o => o.id !== id));
            showToast(`Order ${id} deleted successfully`, 'error');
        }
    };

    // 1. Filter
    const filtered = orders.filter(o => 
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.store.toLowerCase().includes(search.toLowerCase())
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

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customer Orders" subtitle="Manage all customer orders and tracking"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Order</Btn>} />
            
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search ID, customer, store..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-white border-slate-200 h-10 shadow-sm" />}
                />
                <Table 
                    onSort={handleSort}
                    sortConfig={sort}
                    headers={[
                        { label: 'Order ID', key: 'id', sortable: true, width: '16%' }, 
                        { label: 'Date', key: 'date', sortable: true, width: '16%' }, 
                        { label: 'Customer', key: 'customer', sortable: true, width: '20%' }, 
                        { label: 'Store', key: 'store', sortable: true, width: '20%' }, 
                        { label: 'Order Total', key: 'total', right: true, sortable: true, width: '14%' }, 
                        { label: 'Actions', right: true, width: '14%' }
                    ]}
                >
                    {paginated.map(o => (
                        <Tr key={o.id}>
                            <Td mono className="text-xs font-bold text-red-600">{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td bold>{o.customer}</Td>
                            <Td>{o.store}</Td>
                            <Td right bold>฿{o.total?.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => onNavigate(o)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(o.id)}><Trash2 className="w-3 h-3" /> Delete</Btn>
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
                    onItemsPerPageChange={(val) => { setPageSize(val); setPage(1); }}
                    itemLabel="orders"
                />
            </Card>
        </div>
    );
}
