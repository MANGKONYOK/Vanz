import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';
import { nextCode } from '../../api/codeGen';

export default function PromotionFormView({ data, onNavigateBack, showToast }) {
    const isNew = !data;
    const editData = data || {};

    // Header state
    const [store,        setStore]        = useState(editData.storeCode ? `${editData.storeCode} – ${editData.storeName}` : '');
    const [storeCode,    setStoreCode]    = useState(editData.storeCode || '');
    const [storeId,      setStoreId]      = useState(editData.storeId   || null);
    const [name,         setName]         = useState(editData.name      || '');
    const [startDate,    setStartDate]    = useState(editData.startDate || '');
    const [endDate,      setEndDate]      = useState(editData.endDate   || '');
    const [discountType, setDiscountType] = useState(editData.discountType || 'PERCENTAGE');
    const [previewCode,  setPreviewCode]  = useState(editData.promotionCode || '…');

    // Line items
    const [items, setItems] = useState(
        (editData.items || []).length > 0
            ? editData.items.map(it => ({
                uid:         it.promotion_item_id || Date.now() + Math.random(),
                productId:   it.product_id,
                productName: '',      // name resolved from LoV — not stored in promotion_items
                discount:    it.discount_value || 0,
              }))
            : [{ uid: Date.now(), productId: '', productName: '', discount: 0 }]
    );

    // LoV state
    const [storeIsLov,    setStoreIsLov]    = useState(false);
    const [productIsLov,  setProductIsLov]  = useState(false);
    const [lovIdx,        setLovIdx]        = useState(null);

    // Live LoV data
    const [lovStores,    setLovStores]   = useState([]);
    const [lovProducts,  setLovProducts] = useState([]);

    const [saving, setSaving] = useState(false);

    // Fetch stores + code preview on mount
    useEffect(() => {
        getJson('/stores')
            .then(storeList => {
                setLovStores(storeList.map(s => ({
                    id:       s.store_code,
                    storeId:  s.store_id,
                    name:     s.name,
                    category: s.category,
                })));
            })
            .catch(() => {});

        if (isNew) {
            getJson('/promotions')
                .then(promos => {
                    const codes = promos.map(p => p.promotion_code);
                    setPreviewCode(nextCode(codes, 'PROMO-', 4));
                })
                .catch(() => setPreviewCode('PROMO-????'));
        }
    }, [isNew]);

    // Fetch products when a store is selected
    const loadProducts = (sid) => {
        if (!sid) return;
        // find store_code from storeId
        const storeEntry = lovStores.find(s => s.storeId === sid);
        const storeCodeFilter = storeEntry ? storeEntry.id : null;
        const params = storeCodeFilter ? { store_code: storeCodeFilter } : {};
        getJson('/store-products', params)
            .then(products => {
                setLovProducts(products.map(p => ({
                    id:    p.product_id,
                    name:  p.name,
                    price: parseFloat(p.unit_price).toFixed(2),
                })));
            })
            .catch(() => setLovProducts([]));
    };

    const handleSelectStore = (r) => {
        setStoreCode(r.id);
        setStoreId(r.storeId);
        setStore(`${r.id} – ${r.name}`);
        setStoreIsLov(false);
        // Reset items + load products for the chosen store
        setItems([{ uid: Date.now(), productId: '', productName: '', discount: 0 }]);
        loadProducts(r.storeId);
    };

    const handleSelectProduct = (r) => {
        if (lovIdx === null) return;
        const next = [...items];
        next[lovIdx] = { ...next[lovIdx], productId: r.id, productName: r.name };
        setItems(next);
        setProductIsLov(false);
        setLovIdx(null);
    };

    const openProductLov = (i) => {
        if (!storeId) return showToast('Please select a store first', 'error');
        if (lovProducts.length === 0) loadProducts(storeId);
        setLovIdx(i);
        setProductIsLov(true);
    };

    const validate = () => {
        if (!storeCode)       return 'Please select a target store';
        if (!name.trim())     return 'Campaign Name is required';
        if (!startDate || !endDate) return 'Please specify both Start and End Dates';
        if (new Date(endDate) < new Date(startDate)) return 'End Date cannot be before Start Date';
        if (items.length === 0) return 'Must include at least one product';
        if (items.some(i => !i.productId)) return 'All rows must have a product selected';
        if (items.some(i => Number(i.discount) <= 0)) return 'All discount values must be > 0';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            await postJson('/promotions', {
                store_code:    storeCode,
                name:          name.trim(),
                start_date:    startDate,
                end_date:      endDate,
                discount_type: discountType,
                promotion_items: items.map(i => ({
                    product_id:     Number(i.productId),
                    discount_value: Number(i.discount),
                })),
            });
            showToast('Promotion created successfully!');
            onNavigateBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Save failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            {/* Store LoV */}
            <LovModal
                isOpen={storeIsLov}
                onClose={() => setStoreIsLov(false)}
                title="Select Store"
                columns={[
                    { key: 'id',       label: 'Code'     },
                    { key: 'name',     label: 'Store'    },
                    { key: 'category', label: 'Category' },
                ]}
                data={lovStores}
                onSelect={handleSelectStore}
            />
            {/* Product LoV */}
            <LovModal
                isOpen={productIsLov}
                onClose={() => { setProductIsLov(false); setLovIdx(null); }}
                title="Select Product"
                columns={[
                    { key: 'id',    label: 'ID'      },
                    { key: 'name',  label: 'Product' },
                    { key: 'price', label: 'Price'   },
                ]}
                data={lovProducts}
                onSelect={handleSelectProduct}
            />

            <button
                onClick={onNavigateBack}
                className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Promotions
            </button>

            {/* Campaign Details Card */}
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">
                    {isNew ? 'New Campaign' : `Edit: ${editData.name}`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Promotion Code — read-only preview */}
                    <FormField label="Promotion Code">
                        <Input
                            value={previewCode}
                            readOnly
                            className="bg-slate-50 text-slate-500 font-mono"
                            title="Code is assigned by server on save"
                        />
                    </FormField>

                    <FormField label="Campaign Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" />
                    </FormField>

                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store…" />
                    </FormField>

                    <FormField label="Discount Type" required>
                        <Select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED_AMOUNT">Fixed Amount (฿)</option>
                        </Select>
                    </FormField>

                    <FormField label="Start Date" required>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </FormField>

                    <FormField label="End Date" required>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </FormField>
                </div>
            </Card>

            {/* Promotion Items Card */}
            <Card className="overflow-hidden">
                <CardHeader
                    title="Promotion Items"
                    action={
                        <Btn
                            size="sm"
                            variant="secondary"
                            onClick={() => setItems([...items, { uid: Date.now(), productId: '', productName: '', discount: 0 }])}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Product
                        </Btn>
                    }
                />
                <Table
                    headers={[
                        { label: 'Product' },
                        { label: `Discount Value ${discountType === 'PERCENTAGE' ? '(%)' : '(฿)'}`, right: true },
                        { label: '', center: true },
                    ]}
                    minWidth="500px"
                >
                    {items.map((it, i) => (
                        <tr key={it.uid} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-red-400">
                                    <input
                                        readOnly
                                        value={it.productName || (it.productId ? `Product #${it.productId}` : '')}
                                        placeholder="Select product…"
                                        className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white"
                                    />
                                    <button
                                        onClick={() => openProductLov(i)}
                                        className="shrink-0 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors border-l border-slate-700"
                                    >
                                        LoV
                                    </button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={it.discount}
                                    onChange={e => {
                                        const next = [...items];
                                        next[i] = { ...next[i], discount: e.target.value };
                                        setItems(next);
                                    }}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24"
                                />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => setItems(items.filter(x => x.uid !== it.uid))}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Btn onClick={handleSave} size="lg" disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Campaign'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
