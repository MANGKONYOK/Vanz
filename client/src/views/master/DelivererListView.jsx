import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, Save, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FormField, Input, Select } from '../../components/ui';
import { getJson, postJson, putJson, deleteJson, getApiErrorMessage } from '../../api/http';

const STATUS_MAP = { AVAILABLE: 'Active', BUSY: 'Busy', OFFLINE: 'Inactive' };
const toApiStatus = s => s === 'Active' ? 'AVAILABLE' : s === 'Busy' ? 'BUSY' : 'OFFLINE';
const BADGE_COLOR = { Active: 'green', Busy: 'yellow', Inactive: 'gray' };

function inferEmail(name) {
    const base = String(name || 'deliverer').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/, '');
    return `${base || 'deliverer'}.${Date.now()}@vanz.local`;
}

// ── Form ──────────────────────────────────────────────────────────────────────
function DelivererFormInline({ data, onBack, onSaved, showToast }) {
    const isNew = !data.id;
    const [name,    setName]    = useState(data.name    || '');
    const [phone,   setPhone]   = useState(data.phone   || '');
    const [license, setLicense] = useState(data.license || '');
    const [type,    setType]    = useState(data.type    || 'MOTORCYCLE');
    const [status,  setStatus]  = useState(data.status  || 'Active');
    const [saving,  setSaving]  = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !license.trim() || !phone.trim() || !type)
            return showToast('Please fill all required fields', 'error');
        setSaving(true);
        try {
            if (isNew) {
                const profile = await postJson('/profiles', {
                    full_name: name.trim(),
                    phone: phone.trim(),
                    email: inferEmail(name),
                });
                const created = await postJson('/deliverers', {
                    profile_id: profile.profile_id,
                    vehicle_type: type,
                    license_plate: license.trim(),
                    current_status: toApiStatus(status),
                });
                showToast(`Deliverer ${created.deliverer_code} created!`);
            } else {
                await putJson(`/profiles/${data.profileId}`, {
                    full_name: name.trim(),
                    phone: phone.trim(),
                    email: data.email || inferEmail(name),
                });
                await putJson(`/deliverers/${data.id}`, {
                    vehicle_type: type,
                    license_plate: license.trim(),
                    current_status: toApiStatus(status),
                });
                showToast('Deliverer saved!');
            }
            onSaved();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to save deliverer'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Deliverers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-4">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer name" />
                    </FormField>
                    <FormField label="License Plate" required>
                        <Input value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. 1กข 1234" />
                    </FormField>
                    <FormField label="Phone Number" required>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
                    </FormField>
                    <FormField label="Vehicle Type" required>
                        <Select value={type} onChange={e => setType(e.target.value)}>
                            <option value="MOTORCYCLE">Motorcycle</option>
                            <option value="CAR">Car</option>
                            <option value="BICYCLE">Bicycle</option>
                            <option value="SCOOTER">Scooter</option>
                            <option value="VAN">Van</option>
                            <option value="TRUCK">Truck</option>
                        </Select>
                    </FormField>
                    <FormField label="Status">
                        <Select value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="Active">Active (Available)</option>
                            <option value="Busy">Busy</option>
                            <option value="Inactive">Inactive (Offline)</option>
                        </Select>
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}

// ── List ──────────────────────────────────────────────────────────────────────
export default function DelivererListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [tick, setTick]       = useState(0);
    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([deliverers, profiles]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            setRows(deliverers.map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                const dispStatus = STATUS_MAP[d.current_status] || d.current_status || 'Unknown';
                return {
                    id:          d.deliverer_code,
                    delivererId: d.deliverer_id,
                    profileId:   d.profile_id,
                    email:       prof.email,
                    name:        prof.full_name    || '-',
                    phone:       prof.phone        || '-',
                    license:     d.license_plate   || '-',
                    type:        d.vehicle_type    || '-',
                    status:      dispStatus,
                    rating:      d.rating          ?? 0,
                };
            }));
        }).catch(e => {
            if (cancelled) return;
            showToast(getApiErrorMessage(e, 'Failed to load deliverers'), 'error');
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [tick]);  // eslint-disable-line react-hooks/exhaustive-deps

    if (editing) return (
        <DelivererFormInline
            data={editing}
            onBack={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
            showToast={showToast}
        />
    );

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete deliverer ${row.id} — ${row.name}?`)) return;
        try {
            await deleteJson(`/deliverers/${row.id}`);
            showToast(`Deliverer ${row.id} deleted`);
            refresh();
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Delete failed'), 'error');
        }
    };

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverers" subtitle="Manage deliverer profiles and vehicle details"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>} />
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading deliverers…</div>
                ) : (
                    <Table headers={[
                        { label: 'Code' }, { label: 'Name' }, { label: 'License Plate' },
                        { label: 'Vehicle' }, { label: 'Phone' },
                        { label: 'Status', center: true }, { label: 'Rating', center: true }, { label: '', right: true }
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No deliverers found</td></tr>
                        ) : rows.map(d => (
                            <Tr key={d.id}>
                                <Td mono className="text-xs">{d.id}</Td>
                                <Td bold>{d.name}</Td>
                                <Td mono className="text-xs">{d.license}</Td>
                                <Td>{d.type}</Td>
                                <Td mono className="text-xs">{d.phone}</Td>
                                <Td center><Badge color={BADGE_COLOR[d.status] || 'gray'}>{d.status}</Badge></Td>
                                <Td center>
                                    <span className="flex items-center justify-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{Number(d.rating).toFixed(1)}
                                    </span>
                                </Td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Btn size="sm" variant="secondary" onClick={() => setEditing(d)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                        <Btn size="sm" variant="danger"    onClick={() => handleDelete(d)}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                    </div>
                                </td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
