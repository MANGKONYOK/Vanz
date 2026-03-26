
function NavGroup({ icon, label, isOpen, onToggle, children }) {
    return (
        <div className="mb-0.5">
            <button onClick={onToggle} className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-white/80 hover:text-white hover:bg-white/10 ${isOpen ? 'text-white bg-white/5' : ''}`}>
                <div className="flex items-center gap-2.5">
                    <span className="shrink-0 text-white">{icon}</span>
                    <span className="text-sm font-semibold">{label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 text-white ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="pl-6 pr-2 py-1 space-y-0.5 border-l border-white/20 ml-4 mt-1 mb-2">{children}</div>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    LayoutDashboard, Package, Users, CreditCard, FileText, Settings,
    Filter, Calendar, Search, ChevronDown, ShoppingBag, Menu, X,
    Save, User, Clock, AlertCircle, Plus, FileSpreadsheet, Store,
    Tag, MapPin, Receipt, Truck, ArrowLeft, BarChart3, TrendingUp,
    ListFilter, CheckCircle, Trash2, DownloadCloud, FileOutput, MoreVertical,
    PackageCheck, Printer, Calculator, Heart, Star, History, List, DollarSign, Box,
    ChevronLeft, Phone, Home, Car, ToggleLeft, ToggleRight, Award, Target,
    ShoppingCart, Zap, Activity, PieChart, Edit2, Eye, RefreshCw
} from 'lucide-react';

// ==========================================
// 1. MOCK DATA
// ==========================================
const MOCK_CUSTOMERS = [
    { id: 'C-101', name: 'Adisak M.', phone: '081-234-5678', address: '123 Sukhumvit', created: '2025-10-15' },
    { id: 'C-102', name: 'Nattapong K.', phone: '089-876-5432', address: '456 Silom', created: '2025-11-20' },
    { id: 'C-103', name: 'Siriporn L.', phone: '085-111-2222', address: '789 Rama IV', created: '2025-12-01' },
];

const MOCK_DELIVERERS = [
    { id: 'D-001', name: 'Somchai J.', license: '1กข 1234', type: 'Motorcycle', phone: '081-111-2345', status: 'Active', rating: 4.8, deliveries: 342 },
    { id: 'D-045', name: 'Kittisak P.', license: '2คต 5678', type: 'Truck', phone: '089-222-3456', status: 'Active', rating: 4.5, deliveries: 210 },
    { id: 'D-022', name: 'Wanchai B.', license: '3มน 9012', type: 'Motorcycle', phone: '085-333-4567', status: 'Inactive', rating: 4.2, deliveries: 98 },
];

const MOCK_STORES = [
    { id: 'ST-001', name: 'Somchai Kitchen', category: 'Thai Food', address: '123 Rama 9 Rd.', phone: '02-123-4567', open: '09:00-21:00' },
    { id: 'ST-002', name: 'Krapow Station', category: 'Thai Food', address: '456 Sukhumvit Rd.', phone: '02-987-6543', open: '10:00-22:00' },
    { id: 'ST-003', name: 'BKK Cafe', category: 'Cafe & Drinks', address: '789 Silom Rd.', phone: '02-456-7890', open: '08:00-20:00' },
];

const MOCK_PRODUCTS = [
    { id: 'PRD-101', store: 'Somchai Kitchen', storeId: 'ST-001', name: 'Krapow Moo Saap', price: 60, active: true, category: 'Main Dish' },
    { id: 'PRD-105', store: 'Somchai Kitchen', storeId: 'ST-001', name: 'Pad Thai Goong Sod', price: 90, active: true, category: 'Main Dish' },
    { id: 'PRD-203', store: 'BKK Cafe', storeId: 'ST-003', name: 'Thai Iced Tea', price: 40, active: true, category: 'Drinks' },
    { id: 'PRD-204', store: 'BKK Cafe', storeId: 'ST-003', name: 'Americano', price: 55, active: false, category: 'Drinks' },
];

const INITIAL_ORDERS = [
    { id: 'ORD-2026-000123', date: '2026-03-22', fee: 40, bonus: 0, adjustment: 0, status: 'Unpaid', customer: 'Adisak M.', deliverer: 'D-001' },
    { id: 'ORD-2026-000124', date: '2026-03-21', fee: 40, bonus: 0, adjustment: 0, status: 'Unpaid', customer: 'Nattapong K.', deliverer: 'D-001' },
];

const INITIAL_EXPENSE_VOUCHERS = [
    { id: 'EXP-2026-000789', delivererId: 'D-001', delivererName: 'Somchai J.', date: '2026-03-20', status: 'SUBMITTED', total: 150, items: 'Toll' },
    { id: 'EXP-2026-000790', delivererId: 'D-045', delivererName: 'Kittisak P.', date: '2026-03-18', status: 'APPROVED', total: 45, items: 'Parking' },
    { id: 'EXP-2026-000791', delivererId: 'D-022', delivererName: 'Wanchai B.', date: '2026-03-15', status: 'SUBMITTED', total: 320, items: 'Fuel, Toll' },
];

const MOCK_PREPARED_ORDERS = [
    { id: 'ORD-2026-009101', customer: 'Adisak M.', store: 'Krapow Station', time: '10 mins ago', status: 'Prepared' },
    { id: 'ORD-2026-009102', customer: 'Nattapong K.', store: 'BKK Cafe', time: '5 mins ago', status: 'Prepared' },
];

const MOCK_PROMOTIONS = [
    { id: 'PROMO-2026-001', name: 'Summer Sale', store: 'Somchai Kitchen', storeId: 'ST-001', startDate: '2026-04-01', endDate: '2026-04-30', status: 'Active', discountType: 'PERCENTAGE', revenue: 12400, products: 3, orders: 142 },
    { id: 'PROMO-2026-002', name: 'Weekend Special', store: 'BKK Cafe', storeId: 'ST-003', startDate: '2026-03-01', endDate: '2026-03-31', status: 'Active', discountType: 'FIXED_AMOUNT', revenue: 8200, products: 2, orders: 85 },
];

const MOCK_RECEIPT_ITEMS = [
    { id: 'PRD-101', name: 'Krapow Moo Saap', qty: 2, price: 60, total: 120 },
    { id: 'PRD-203', name: 'Thai Iced Tea', qty: 2, price: 40, total: 80 },
];

const MOCK_TOP_PRODUCTS = [
    { rank: 1, store: 'Somchai Kitchen', id: 'PRD-101', name: 'Krapow Moo Saap', category: 'Main Dish', qty: 342, revenue: 20520 },
    { rank: 2, store: 'Somchai Kitchen', id: 'PRD-105', name: 'Pad Thai Goong Sod', category: 'Main Dish', qty: 218, revenue: 19620 },
    { rank: 3, store: 'BKK Cafe', id: 'PRD-203', name: 'Thai Iced Tea', category: 'Drinks', qty: 195, revenue: 7800 },
];

const MOCK_EXPENSE_SUMMARY_STATS = { count: 124, sum: 15600, avg: 125.80 };

const MOCK_DELIVERED_ORDERS = [
    { id: 'ORD-2026-008001', date: '2026-03-21', customer: 'Adisak M.', store: 'Somchai Kitchen', total: 320, deliverer: 'Somchai J.', duration: '35 mins' },
    { id: 'ORD-2026-008002', date: '2026-03-20', customer: 'Nattapong K.', store: 'BKK Cafe', total: 150, deliverer: 'Kittisak P.', duration: '42 mins' },
    { id: 'ORD-2026-008003', date: '2026-03-20', customer: 'Siriporn L.', store: 'Krapow Station', total: 90, deliverer: 'Somchai J.', duration: '28 mins' },
];

const MOCK_FAV_STORES = [
    { customer: 'Adisak M.', store: 'Somchai Kitchen', orders: 24 },
    { customer: 'Nattapong K.', store: 'BKK Cafe', orders: 18 },
    { customer: 'Siriporn L.', store: 'Krapow Station', orders: 12 },
];

const MOCK_TOP_DELIVERERS = [
    { rank: 1, id: 'D-001', name: 'Somchai J.', type: 'Motorcycle', deliveries: 342, earnings: 15390, rating: 4.8 },
    { rank: 2, id: 'D-045', name: 'Kittisak P.', type: 'Truck', deliveries: 210, earnings: 9450, rating: 4.5 },
    { rank: 3, id: 'D-022', name: 'Wanchai B.', type: 'Motorcycle', deliveries: 98, earnings: 4410, rating: 4.2 },
];

const MOCK_REVENUE_PER_TRIP = [
    { id: 1, date: '2026-01-01', revenue: 40, notes: 'Initial rate' },
    { id: 2, date: '2026-03-01', revenue: 45, notes: 'Q1 adjustment' },
];

const MOCK_DELIVERER_HISTORY = [
    { id: 'ORD-2026-008001', date: '2026-03-21', store: 'Somchai Kitchen', customer: 'Adisak M.', time: '14:35', fee: 45, status: 'Delivered' },
    { id: 'ORD-2026-008003', date: '2026-03-20', store: 'Krapow Station', customer: 'Siriporn L.', time: '14:35', fee: 45, status: 'Delivered' },
    { id: 'ORD-2026-007921', date: '2026-03-18', store: 'BKK Cafe', customer: 'Nattapong K.', time: '14:35', fee: 45, status: 'Delivered' },
];

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [expandedNav, setExpandedNav] = useState({ simple: true, analytics: true });
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    const viewTitles = {
        dashboard: 'Dashboard',
        customer_order_form: 'Customer Orders',
        dispatch_form: 'Dispatching',
        payment_form: 'Deliverer Payments',
        expense_list: 'Expense Vouchers',
        expense_form: 'New Expense Voucher',
        revenue_trip: 'Revenue Per Trip',
        store_list: 'Stores',
        product_list: 'Products',
        customer_list: 'Customers',
        deliverer_list: 'Deliverers',
        promotion_list: 'Promotions',
        promotion_form: 'New Promotion',
        report_delivered_orders: 'Delivered Orders',
        report_order_receipt: 'Order Receipt',
        report_deliverer_history: 'Deliverer History',
        report_unapproved_vouchers: 'Unapproved Vouchers',
        report_store_products: 'Store Products',
        report_category_products: 'Category Products',
        report_fav_stores: 'Favorite Stores',
        report_top_products: 'Top Selling Products',
        report_top_deliverers: 'Top Deliverers',
        report_expense_summary: 'Expense Summary',
        report_promo_perf: 'Promotion Performance',
        report_deliverer_ranking: 'Deliverer Ranking',
    };

    return (
        <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-800 overflow-hidden overscroll-none">
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        body, html { overscroll-behavior: none; overflow-x: hidden; }
        .mono { font-family: 'DM Mono', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148,163,184,0.3); border-radius: 10px; }\n        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148,163,184,0.5); }
        .main-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .main-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .main-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148,163,184,0.4); border-radius: 10px; }
        .main-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(100,116,139,0.7); }
        
        /* FIXED: Changed transform:translateY(0) to transform:none to prevent z-index clipping for Modals */
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .fade-in { animation: fadeIn 0.25s ease-out forwards; }
        
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
        .toast-in { animation: toastIn 0.3s ease-out forwards; }
        .nav-active { background: rgba(0,0,0,0.3); border-left: 3px solid #fff; padding-left: calc(0.625rem - 3px); }
        .nav-active .text-slate-400 { color: #fff !important; }
        .nav-item-hover:hover { background: rgba(0,0,0,0.2); }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
      `}} />

            {/* Toast */}
            {toast.visible && (
                <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border toast-in ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-semibold">{toast.message}</span>
                </div>
            )}

            {/* SIDEBAR */}
            <aside className={`shrink-0 bg-red-800 border-r border-red-900 transition-all duration-300 ease-in-out flex flex-col h-full relative z-20 overflow-hidden ${isSidebarOpen ? 'w-[240px]' : 'w-0'}`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-red-900/50 shrink-0 w-[240px] bg-red-900/50 overflow-hidden">
                    <div className="flex items-center gap-2.5 text-white ml-1">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-white fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">Vanz</span>
                        <span className="text-[10px] font-bold text-white/70 bg-white/20 text-white px-1.5 py-0.5 rounded mt-0.5">ADMIN</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 text-sm w-[240px] custom-scrollbar">
                    <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />

                    <Section title="Operations" />
                    <NavItem icon={<Package size={16} />} label="Customer Orders" active={['customer_order_list', 'customer_order_form'].includes(currentView)} onClick={() => setCurrentView('customer_order_list')} />
                    <NavItem icon={<Truck size={16} />} label="Dispatching" active={currentView === 'dispatch_form'} onClick={() => setCurrentView('dispatch_form')} />

                    <Section title="Finance" />
                    <NavItem icon={<CreditCard size={16} />} label="Deliverer Payments" active={['payment_list', 'payment_form'].includes(currentView)} onClick={() => setCurrentView('payment_list')} />
                    <NavItem icon={<Receipt size={16} />} label="Expense Vouchers" active={['expense_list', 'expense_form'].includes(currentView)} onClick={() => setCurrentView('expense_list')} />
                    <NavItem icon={<DollarSign size={16} />} label="Revenue Per Trip" active={currentView === 'revenue_trip'} onClick={() => setCurrentView('revenue_trip')} />

                    <Section title="Master Data" />
                    <NavItem icon={<User size={16} />} label="Customers" active={currentView === 'customer_list'} onClick={() => setCurrentView('customer_list')} />
                    <NavItem icon={<Store size={16} />} label="Stores" active={currentView === 'store_list'} onClick={() => setCurrentView('store_list')} />
                    <NavItem icon={<Box size={16} />} label="Products" active={currentView === 'product_list'} onClick={() => setCurrentView('product_list')} />
                    <NavItem icon={<Users size={16} />} label="Deliverers" active={currentView === 'deliverer_list'} onClick={() => setCurrentView('deliverer_list')} />
                    <NavItem icon={<Tag size={16} />} label="Promotions" active={['promotion_list', 'promotion_form'].includes(currentView)} onClick={() => setCurrentView('promotion_list')} />

                    <Section title="Reports" />
                    <NavGroup icon={<FileText size={16} />} label="Simple Reports" isOpen={expandedNav.simple} onToggle={() => setExpandedNav(p => ({ ...p, simple: !p.simple }))}>
                        <NavItem icon={<PackageCheck size={16} />} label="Delivered Orders" active={currentView === 'report_delivered_orders'} onClick={() => setCurrentView('report_delivered_orders')} />
                        <NavItem icon={<Printer size={16} />} label="Order Receipt" active={currentView === 'report_order_receipt'} onClick={() => setCurrentView('report_order_receipt')} />
                        <NavItem icon={<Store size={16} />} label="Store Products" active={currentView === 'report_store_products'} onClick={() => setCurrentView('report_store_products')} />
                        <NavItem icon={<Heart size={16} />} label="Favorite Stores" active={currentView === 'report_fav_stores'} onClick={() => setCurrentView('report_fav_stores')} />
                        <NavItem icon={<AlertCircle size={16} />} label="Unapproved Vouchers" active={currentView === 'report_unapproved_vouchers'} onClick={() => setCurrentView('report_unapproved_vouchers')} />
                        <NavItem icon={<Star size={16} />} label="Deliverer Ranking" active={currentView === 'report_deliverer_ranking'} onClick={() => setCurrentView('report_deliverer_ranking')} />
                        <NavItem icon={<History size={16} />} label="Deliverer History" active={currentView === 'report_deliverer_history'} onClick={() => setCurrentView('report_deliverer_history')} />
                        <NavItem icon={<List size={16} />} label="Category Products" active={currentView === 'report_category_products'} onClick={() => setCurrentView('report_category_products')} />
                    </NavGroup>

                    <NavGroup icon={<PieChart size={16} />} label="Analytics Reports" isOpen={expandedNav.analytics} onToggle={() => setExpandedNav(p => ({ ...p, analytics: !p.analytics }))}>
                        <NavItem icon={<BarChart3 size={16} />} label="Top Products" active={currentView === 'report_top_products'} onClick={() => setCurrentView('report_top_products')} />
                        <NavItem icon={<Award size={16} />} label="Top Deliverers" active={currentView === 'report_top_deliverers'} onClick={() => setCurrentView('report_top_deliverers')} />
                        <NavItem icon={<Calculator size={16} />} label="Expense Summary" active={currentView === 'report_expense_summary'} onClick={() => setCurrentView('report_expense_summary')} />
                        <NavItem icon={<TrendingUp size={16} />} label="Promo Perf" active={currentView === 'report_promo_perf'} onClick={() => setCurrentView('report_promo_perf')} />
                    </NavGroup>
                </nav>

                <div className="px-3 py-3 border-t border-red-900/50 w-[240px] shrink-0 bg-red-900/30">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">AD</div>
                        <div className="min-w-0"><p className="text-xs font-semibold text-white truncate">Admin User</p><p className="text-[10px] text-white/60 truncate">admin@vanz.com</p></div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
                <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 shrink-0 z-10 shadow-md">
                    {!isSidebarOpen && (
                        <button className="shrink-0 mr-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-2 text-sm min-w-0">
                    </div>
                    <div className="ml-auto flex items-center gap-2 shrink-0">

                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 main-scrollbar">
                    <div className="max-w-5xl mx-auto">

                        {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}

                        {/* Line-Item Forms */}
                        {currentView === 'expense_list' && <ExpenseListView onNavigate={() => setCurrentView('expense_form')} />}
                        {currentView === 'expense_form' && <ExpenseFormView onNavigateBack={() => setCurrentView('expense_list')} showToast={showToast} />}
                        {currentView === 'customer_order_list' && <CustomerOrderListView onNavigate={() => setCurrentView('customer_order_form')} />}
                        {currentView === 'customer_order_form' && <CustomerOrderFormView showToast={showToast} onNavigateBack={() => setCurrentView('customer_order_list')} />}
                        {currentView === 'dispatch_form' && <DelivererDispatchView showToast={showToast} />}
                        {currentView === 'payment_list' && <DelivererPaymentListView onNavigate={() => setCurrentView('payment_form')} />}
                        {currentView === 'payment_form' && <DelivererPaymentView showToast={showToast} onNavigateBack={() => setCurrentView('payment_list')} />}
                        {currentView === 'promotion_list' && <PromotionListView onNavigate={() => setCurrentView('promotion_form')} />}
                        {currentView === 'promotion_form' && <PromotionFormView onNavigateBack={() => setCurrentView('promotion_list')} showToast={showToast} />}

                        {/* Simple Forms / Master Data */}
                        {currentView === 'customer_list' && <CustomerListView showToast={showToast} />}
                        {currentView === 'deliverer_list' && <DelivererListView showToast={showToast} />}
                        {currentView === 'store_list' && <StoreListView showToast={showToast} />}
                        {currentView === 'product_list' && <ProductListView showToast={showToast} />}
                        {currentView === 'revenue_trip' && <RevenueTripView showToast={showToast} />}

                        {/* Operational Reports */}
                        {currentView === 'report_delivered_orders' && <DeliveredOrdersReportView />}
                        {currentView === 'report_order_receipt' && <OrderReceiptView />}
                        {currentView === 'report_deliverer_history' && <DelivererHistoryReportView />}
                        {currentView === 'report_unapproved_vouchers' && <UnapprovedVouchersReportView />}

                        {/* Master Data Reports */}
                        {currentView === 'report_store_products' && <StoreProductsReportView />}
                        {currentView === 'report_category_products' && <CategoryProductsReportView />}
                        {currentView === 'report_fav_stores' && <FavStoresReportView />}

                        {/* Analytics */}
                        {currentView === 'report_top_products' && <ReportTopProductsView />}
                        {currentView === 'report_top_deliverers' && <TopDeliverersReportView />}
                        {currentView === 'report_expense_summary' && <ExpenseSummaryReportView />}
                        {currentView === 'report_promo_perf' && <PromoPerfReportView />}
                        {currentView === 'report_deliverer_ranking' && <DelivererRankingReportView />}
                    </div>
                </div>
            </main>
        </div>
    );
}

// ==========================================
// HELPERS & REUSABLE UI
// ==========================================
function Section({ title }) {
    return (
        <div className="pt-4 pb-1 mt-1">
            <p className="px-2 text-[9px] font-bold text-white/90 uppercase tracking-widest truncate">{title}</p>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (
        <button onClick={onClick} className={`nav-item-hover group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-left ${active ? 'nav-active text-white font-semibold' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
            <div className="shrink-0 text-white">{icon}</div>
            <span className="truncate flex-1 min-w-0 text-sm">{label}</span>
        </button>
    );
}

function NavSub({ label }) {
    return <p className="px-3 pt-2.5 pb-0.5 text-[8px] font-bold text-white/75 uppercase tracking-[0.15em]">{label}</p>;
}

function LovModal({ isOpen, onClose, title, columns, data, onSelect }) {
    const [search, setSearch] = useState('');
    if (!isOpen) return null;
    const filtered = data.filter(row => columns.some(c => String(row[c.key] || '').toLowerCase().includes(search.toLowerCase())));
    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[80vh] overflow-hidden fade-in border border-slate-200">
                <div className="p-4 sm:px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">Select {title}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 sm:px-6 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search to filter..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all" />
                    </div>
                </div>
                <div className="overflow-y-auto main-scrollbar bg-slate-50/50">
                    <table className="w-full text-sm">
                        <thead className="bg-white border-b border-slate-200 sticky top-0 shadow-sm z-10">
                            <tr>{columns.map(c => <th key={c.key} className="p-4 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{c.label}</th>)}<th className="p-4 px-6"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filtered.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50/80 transition-colors cursor-pointer group" onClick={() => onSelect(row)}>
                                    {columns.map(c => <td key={c.key} className="p-4 px-6 text-slate-700 font-medium">{row[c.key]}</td>)}
                                    <td className="p-4 px-6 text-right"><button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all shadow-sm">Select</button></td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-400 text-sm">No results found for "{search}"</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Input helpers
function FormField({ label, required, children }) {
    return (
        <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {children}
        </div>
    );
}

function Input({ ...props }) {
    return <input {...props} className={`w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors bg-white ${props.className || ''}`} />;
}

function Select({ children, ...props }) {
    return <select {...props} className={`w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors bg-white ${props.className || ''}`}>{children}</select>;
}

function LovInput({ value, onLov, placeholder = '' }) {
    return (
        <div className="flex rounded-lg shadow-sm overflow-hidden border border-slate-200 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
            <input readOnly value={value} placeholder={placeholder} className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white" />
            <button onClick={onLov} className="shrink-0 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors">LoV</button>
        </div>
    );
}

function Card({ children, className = '' }) {
    return <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
}

function CardHeader({ title, action }) {
    return (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900">{title}</h3>
            {action}
        </div>
    );
}

function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5">
            <div>
                <h2 className="text-xl font-black text-slate-900">{title}</h2>
                {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function Btn({ children, variant = 'primary', onClick, className = '', disabled = false, size = 'md' }) {
    const variants = {
        primary: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
        secondary: 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold',
        ghost: 'text-slate-700 hover:bg-slate-100 font-medium',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 font-semibold',
    };
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
    return (
        <button onClick={onClick} disabled={disabled} className={`shrink-0 inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            {children}
        </button>
    );
}

function Badge({ children, color = 'gray' }) {
    const colors = {
        gray: 'bg-slate-100 text-slate-700',
        green: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors[color]}`}>{children}</span>;
}

function FilterBar({ children }) {
    return <Card className="p-4 mb-5 bg-white"><div className="flex flex-wrap gap-3 items-end">{children}</div></Card>;
}

function FilterField({ label, children }) {
    return (
        <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1">{label}</label>
            {children}
        </div>
    );
}

function Table({ headers, children, minWidth = '500px' }) {
    return (
        <div className="overflow-x-auto main-scrollbar">
            <table className="w-full text-sm text-left" style={{ minWidth }}>
                <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>{headers.map((h, i) => <th key={i} className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap ${h.right ? 'text-right' : ''} ${h.center ? 'text-center' : ''}`}>{h.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
        </div>
    );
}

function Tr({ children, onClick }) {
    return <tr onClick={onClick} className={`hover:bg-slate-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}>{children}</tr>;
}

function Td({ children, right, center, bold, mono, className = '' }) {
    return <td className={`px-4 py-3 text-slate-800 ${right ? 'text-right' : ''} ${center ? 'text-center' : ''} ${bold ? 'font-bold text-slate-900' : ''} ${mono ? 'mono text-xs' : ''} ${className}`}>{children}</td>;
}

function StatCard({ label, value, icon, sub, color = 'red' }) {
    const colors = {
        red: 'bg-red-50 text-red-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-700',
    };
    return (
        <Card className="p-5 stat-card">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </Card>
    );
}

function RankBadge({ rank }) {
    if (rank === 1) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-amber-400 text-white text-xs font-black">#1</span>;
    if (rank === 2) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-slate-400 text-white text-xs font-black">#2</span>;
    if (rank === 3) return <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-black">#3</span>;
    return <span className="text-slate-500 font-mono text-sm">#{rank}</span>;
}

// ==========================================
// DASHBOARD
// ==========================================
function DashboardView({ onNavigate }) {
    return (
        <div className="space-y-6 fade-in">
            <div>
                <h2 className="text-2xl font-black text-slate-900">Good morning 👋</h2>
                <p className="text-sm text-slate-600">Here's what's happening on your platform today.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Orders Today" value="24" icon={<Package size={18} />} sub="+8 from yesterday" color="red" />
                <StatCard label="Active Deliverers" value="12" icon={<Truck size={18} />} sub="3 currently dispatched" color="blue" />
                <StatCard label="Revenue Today" value="฿3,480" icon={<TrendingUp size={18} />} sub="฿145 avg per order" color="green" />
                <StatCard label="Pending Vouchers" value="5" icon={<Receipt size={18} />} sub="Awaiting approval" color="amber" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader title="Prepared Queue" action={<Btn size="sm" variant="secondary" onClick={() => onNavigate('dispatch_form')}>Open Dispatch →</Btn>} />
                    <div className="p-4 space-y-2">
                        {MOCK_PREPARED_ORDERS.map(o => (
                            <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{o.id}</p>
                                    <p className="text-xs text-slate-500 truncate">{o.store} · {o.customer}</p>
                                </div>
                                <span className="text-xs text-amber-700 font-semibold shrink-0">{o.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <CardHeader title="Recent Vouchers" action={<Btn size="sm" variant="secondary" onClick={() => onNavigate('expense_list')}>View All →</Btn>} />
                    <div className="p-4 space-y-2">
                        {INITIAL_EXPENSE_VOUCHERS.map(v => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{v.id}</p>
                                    <p className="text-xs text-slate-500">{v.delivererName} · {v.date}</p>
                                </div>
                                <Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>{v.status}</Badge>
                                <span className="text-sm font-bold text-slate-900 shrink-0">฿{v.total}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ==========================================
// EXPENSE VOUCHER
// ==========================================
function ExpenseListView({ onNavigate }) {
    return (
        <div className="fade-in">
            <PageHeader title="Expense Vouchers" subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Voucher</Btn>} />
            <Card>
                <Table headers={[{ label: 'Voucher ID' }, { label: 'Date' }, { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Amount', right: true }]}>
                    {INITIAL_EXPENSE_VOUCHERS.map(v => (
                        <Tr key={v.id}>
                            <Td className="font-semibold text-red-600 mono">{v.id}</Td>
                            <Td>{v.date}</Td>
                            <Td bold>{v.delivererName}</Td>
                            <Td center><Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>{v.status}</Badge></Td>
                            <Td right bold>฿{v.total}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function ExpenseFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, type: 'Toll', desc: 'Expressway', amount: 50, receipt: 'RC-9901' }]);
    const [delivererId, setDelivererId] = useState('');
    const [isLovOpen, setIsLovOpen] = useState(false);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const handleSave = () => {
        if (!delivererId) return showToast('Please select a deliverer', 'error');
        if (items.length === 0) return showToast('Voucher must contain at least one expense item', 'error');
        if (items.some(i => i.amount <= 0)) return showToast('All expense amounts must be greater than zero', 'error');
        if (items.some(i => !i.desc.trim())) return showToast('Please provide descriptions for all expense items', 'error');
        showToast('Voucher saved successfully!'); onNavigateBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS} onSelect={r => { setDelivererId(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Vouchers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Voucher Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Voucher Code">
                        <Input readOnly defaultValue="EXP-2026-000792" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Deliverer" required>
                        <LovInput value={delivererId} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                    </FormField>
                    <FormField label="Voucher Date" required>
                        <Input type="date" defaultValue="2026-03-23" />
                    </FormField>
                    <FormField label="Status">
                        <Select><option value="DRAFT">DRAFT</option><option value="SUBMITTED">SUBMITTED</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></Select>
                    </FormField>
                    <FormField label="Approved By" required>
                        <Input placeholder="Manager Name" defaultValue="Admin User" />
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Expense Items" action={
                    <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), type: 'Fuel', desc: '', amount: 0, receipt: '' }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Row
                    </Btn>
                } />
                <Table headers={[{ label: 'Type' }, { label: 'Description' }, { label: 'Receipt Reference' }, { label: 'Amount', right: true }, { label: '', center: true }]} minWidth="650px">
                    {items.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <Td><select value={item.type} onChange={e => { const n = [...items]; n[i].type = e.target.value; setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 bg-white w-full"><option>Toll</option><option>Fuel</option><option>Parking</option><option>MAINTENANCE</option><option>OTHER</option></select></Td>
                            <Td><input defaultValue={item.desc} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full min-w-[120px]" /></Td>
                            <Td><input defaultValue={item.receipt} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full mono" /></Td>
                            <td className="px-4 py-3 text-right"><input type="number" value={item.amount} onChange={e => { const n = [...items]; n[i].amount = Number(e.target.value); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24" /></td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== item.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{totalAmount}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Save Voucher</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// CUSTOMER ORDER FORM
// ==========================================
function CustomerOrderFormView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
    const [activeLov, setActiveLov] = useState(null);
    const [customer, setCustomer] = useState('');
    const [store, setStore] = useState('');
    const total = items.reduce((s, i) => s + (i.qty * i.price), 0);
    const handleSave = () => {
        if (!customer) return showToast('Please select a customer', 'error');
        if (!store) return showToast('Please select a store to order from', 'error');
        if (items.length === 0) return showToast('Order must contain at least one item', 'error');
        if (items.some(i => !i.productName || i.qty <= 0)) return showToast('Please select valid products with positive quantities', 'error');
        showToast('Order saved successfully!'); setItems([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]); setCustomer(''); setStore('');
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov?.type === 'product' ? 'Product' : activeLov?.type === 'store' ? 'Store' : 'Customer'}
                columns={activeLov?.type === 'product' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }] : activeLov?.type === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={activeLov?.type === 'product' ? MOCK_PRODUCTS : activeLov?.type === 'store' ? MOCK_STORES : MOCK_CUSTOMERS}
                onSelect={r => {
                    if (activeLov.type === 'product') { const n = [...items]; n[activeLov.index].productName = r.name; n[activeLov.index].price = r.price || 0; n[activeLov.index].productId = r.id; setItems(n); }
                    else if (activeLov.type === 'store') { setStore(`${r.id} – ${r.name}`); }
                    else { setCustomer(`${r.id} – ${r.name}`); }
                    setActiveLov(null);
                }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium mb-2"><ArrowLeft className="w-4 h-4" /> Back to Orders</button>
            <PageHeader title="Customer Order" subtitle="Create a new order for a customer from a specific store" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Order Code">
                        <Input readOnly defaultValue="ORD-2026-000125" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Customer" required>
                        <LovInput value={customer} onLov={() => setActiveLov({ type: 'customer' })} placeholder="Select customer..." />
                    </FormField>
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setActiveLov({ type: 'store' })} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Delivery Address" required>
                        <Input defaultValue="123 Sukhumvit Road" />
                    </FormField>
                    <FormField label="Delivery Address Snapshot">
                        <textarea readOnly defaultValue="123 Sukhumvit Road" className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none resize-none h-10" />
                    </FormField>
                    <FormField label="Payment Method" required>
                        <Select><option>Cash</option><option>PromptPay</option><option>Credit Card</option></Select>
                    </FormField>
                    <FormField label="Order Date">
                        <Input type="date" defaultValue="2026-03-23" />
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Cart Items" action={
                    <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Item
                    </Btn>
                } />
                <Table headers={[{ label: 'Product' }, { label: 'Qty', center: true }, { label: 'Unit Price', right: true }, { label: 'Extended Price', right: true }, { label: '', center: true }]} minWidth="600px">
                    {items.map((it, i) => (
                        <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 min-w-[200px]">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-red-400">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white" />
                                    <button onClick={() => setActiveLov({ type: 'product', index: i })} className="shrink-0 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors border-l border-slate-700">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center"><input type="number" min="1" value={it.qty} onChange={e => { const n = [...items]; n[i].qty = Math.max(1, Number(e.target.value)); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-red-400 w-16" /></td>
                            <Td right>฿{it.price}</Td>
                            <Td right bold>฿{it.qty * it.price}</Td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Order Total</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{total}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Place Order</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// DISPATCH FORM
// ==========================================
function DelivererDispatchView({ showToast }) {
    const [queue, setQueue] = useState(MOCK_PREPARED_ORDERS);
    const [orderId, setOrderId] = useState('');
    const [delivererId, setDelivererId] = useState('');
    const [lovTarget, setLovTarget] = useState(null);
    const handleDispatch = (id) => { showToast(`Order ${id} dispatched!`); setQueue(queue.filter(q => q.id !== id)); };
    const attemptDispatch = () => {
        if (!orderId) return showToast('Please select a prepared order first', 'error');
        if (!delivererId) return showToast('Please assign a deliverer', 'error');
        handleDispatch(orderId); setOrderId(''); setDelivererId('');
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!lovTarget} onClose={() => setLovTarget(null)} title={lovTarget === 'order' ? 'Order' : 'Deliverer'}
                columns={lovTarget === 'order' ? [{ key: 'id', label: 'Order ID' }, { key: 'store', label: 'Store' }, { key: 'customer', label: 'Customer' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={lovTarget === 'order' ? queue : MOCK_DELIVERERS}
                onSelect={r => { lovTarget === 'order' ? setOrderId(r.id) : setDelivererId(`${r.id} – ${r.name}`); setLovTarget(null); }} />
            <PageHeader title="Dispatching" subtitle="Assign deliverers to prepared customer orders" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Assign Deliverer</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-0">
                        <FormField label="Order ID" required>
                            <LovInput value={orderId} onLov={() => setLovTarget('order')} placeholder="Select prepared order..." />
                        </FormField>
                    </div>
                    <div className="flex-1 min-w-0">
                        <FormField label="Deliverer" required>
                            <LovInput value={delivererId} onLov={() => setLovTarget('deliverer')} placeholder="Assign deliverer..." />
                        </FormField>
                    </div>
                    <div className="flex-1 min-w-0 md:max-w-[150px]"><FormField label="Est. Time (Mins)" required><Input type="number" defaultValue="30" /></FormField></div>
                    <Btn onClick={attemptDispatch} size="lg"><Truck className="w-4 h-4" /> Dispatch</Btn>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Prepared Queue" />
                <Table headers={[{ label: 'Order ID' }, { label: 'Store' }, { label: 'Customer' }, { label: 'Waiting', center: true }, { label: '', right: true }]}>
                    {queue.map(q => (
                        <Tr key={q.id}>
                            <Td bold className="mono text-xs">{q.id}</Td>
                            <Td>{q.store}</Td>
                            <Td>{q.customer}</Td>
                            <Td center><Badge color="amber">{q.time}</Badge></Td>
                            <td className="px-4 py-3 text-right"><Btn size="sm" onClick={() => handleDispatch(q.id)}><Zap className="w-3 h-3" /> Dispatch</Btn></td>
                        </Tr>
                    ))}
                    {queue.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">All orders have been dispatched ✓</td></tr>}
                </Table>
            </Card>
        </div>
    );
}

// ==========================================
// DELIVERER PAYMENT FORM
// ==========================================
function DelivererPaymentView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [selected, setSelected] = useState([]);
    const [deliverer, setDeliverer] = useState('');
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState('2026-03-23');
    const [startDate, setStartDate] = useState('2026-03-01');
    const [endDate, setEndDate] = useState('2026-03-31');
    const handleSave = () => {
        if (!deliverer) return showToast('Please select a deliverer', 'error');
        if (!paymentDate) return showToast('Please specify a payment date', 'error');
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) return showToast('Period end cannot be before period start', 'error');
        if (selected.length === 0) return showToast('Please select at least one unpaid order', 'error');
        showToast('Payment confirmed successfully!'); setSelected([]); setDeliverer(''); onBack();
    };
    const selectedOrders = INITIAL_ORDERS.filter(o => selected.includes(o.id));
    const total = selectedOrders.reduce((s, o) => s + o.fee + o.bonus + o.adjustment, 0);
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS} onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium mb-2"><ArrowLeft className="w-4 h-4" /> Back to Payments</button>
            <PageHeader title="Deliverer Payment" subtitle="Process payments for completed deliverer trips" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Payment Code">
                        <Input readOnly defaultValue="PAY-2026-000456" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Deliverer" required>
                        <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                    </FormField>
                    <FormField label="Payment Date" required>
                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </FormField>
                    <FormField label="Period Start"><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></FormField>
                    <FormField label="Period End"><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></FormField>
                    <FormField label="Status">
                        <Select><option value="PENDING">PENDING</option><option value="PAID">PAID</option><option value="CANCELLED">CANCELLED</option></Select>
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Unpaid Deliveries" action={
                    <Btn size="sm" variant="secondary"><RefreshCw className="w-3.5 h-3.5" /> Load Orders</Btn>
                } />
                <Table headers={[{ label: '', center: true }, { label: 'Order ID' }, { label: 'Date' }, { label: 'Status', center: true }, { label: 'Fee', right: true }, { label: 'Bonus', right: true }, { label: 'Adjustment', right: true }, { label: 'Extended Price', right: true }]} minWidth="700px">
                    {INITIAL_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td center><input type="checkbox" className="rounded accent-red-600" checked={selected.includes(o.id)} onChange={() => setSelected(p => p.includes(o.id) ? p.filter(x => x !== o.id) : [...p, o.id])} /></Td>
                            <Td bold mono>{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td center><Badge color="amber">{o.status}</Badge></Td>
                            <Td right>฿{o.fee}</Td>
                            <Td right>฿{o.bonus}</Td>
                            <Td right>฿{o.adjustment}</Td>
                            <Td right bold>฿{o.fee + o.bonus + o.adjustment}</Td>
                        </Tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">{selected.length} order(s) selected</p>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Payment</p>
                            <p className="text-3xl font-black text-slate-900 mono">฿{total}</p>
                        </div>
                        <Btn onClick={handleSave} size="lg">
                            <CreditCard className="w-4 h-4" /> Confirm Payment
                        </Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// PROMOTION
// ==========================================
function PromotionListView({ onNavigate }) {
    return (
        <div className="fade-in">
            <PageHeader title="Promotions" subtitle="Manage store promotional campaigns"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Promotion</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Campaign Name' }, { label: 'Store' }, { label: 'Period' }, { label: 'Type' }, { label: 'Status', center: true }]}>
                    {MOCK_PROMOTIONS.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs">{p.id}</Td>
                            <Td bold>{p.name}</Td>
                            <Td>{p.store}</Td>
                            <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                            <Td>{p.discountType}</Td>
                            <Td center><Badge color="green">{p.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function PromotionFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', discount: 0 }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [lovIdx, setLovIdx] = useState(null);
    const [store, setStore] = useState('');
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const handleSave = () => {
        if (!store) return showToast('Please select a target store', 'error');
        if (!name.trim()) return showToast('Campaign Name is required', 'error');
        if (!startDate || !endDate) return showToast('Please specify both Start and End Dates', 'error');
        if (new Date(endDate) < new Date(startDate)) return showToast('End Date cannot be before Start Date', 'error');
        if (items.length === 0) return showToast('Must include at least one product in the campaign', 'error');
        if (items.some(i => !i.productName || i.discount <= 0)) return showToast('All products must have valid positive discounts', 'error');
        showToast('Promotion Campaign saved successfully!'); onNavigateBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES} onSelect={r => { setStore(`${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Product"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={MOCK_PRODUCTS} onSelect={r => { if (lovIdx !== null) { const n = [...items]; n[lovIdx].productName = r.name; n[lovIdx].productId = r.id; setItems(n); } setIsLovOpen(false); setLovIdx(null); }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Campaign Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Campaign Code">
                        <Input readOnly defaultValue="PROMO-2026-001" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Campaign Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" /></FormField>
                    <FormField label="Discount Type" required>
                        <Select><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed Amount</option></Select>
                    </FormField>
                    <FormField label="Start Date" required><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></FormField>
                    <FormField label="End Date" required><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></FormField>
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
                        <tr key={it.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-red-400">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white" />
                                    <button onClick={() => { setLovIdx(i); setIsLovOpen(true); }} className="shrink-0 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors border-l border-slate-700">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right"><input type="number" value={it.discount} onChange={e => { const n = [...items]; n[i].discount = Number(e.target.value); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24" /></td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Save Campaign</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// MASTER DATA: CUSTOMERS
// ==========================================
function CustomerListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <CustomerFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Customers" subtitle="Manage customer profiles"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Customer</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Name' }, { label: 'Phone' }, { label: 'Address' }, { label: 'Joined' }, { label: '', right: true }]}>
                    {MOCK_CUSTOMERS.map(c => (
                        <Tr key={c.id}>
                            <Td mono className="text-xs">{c.id}</Td>
                            <Td bold>{c.name}</Td>
                            <Td mono className="text-xs">{c.phone}</Td>
                            <Td>{c.address}</Td>
                            <Td className="text-xs">{c.created}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(c)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Customer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function CustomerFormInline({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [name, setName] = useState(data.name || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [address, setAddress] = useState(data.address || '');
    const handleSave = () => {
        if (!name.trim() || !phone.trim()) return showToast('Please fill all required fields', 'error');
        showToast('Customer saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Customers</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{isNew ? 'New Customer' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" /></FormField>
                    <FormField label="Phone Number" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" type="tel" /></FormField>
                    <div className="md:col-span-2"><FormField label="Address"><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" /></FormField></div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// MASTER DATA: DELIVERERS
// ==========================================
function DelivererListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <DelivererFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Deliverers" subtitle="Manage deliverer profiles"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Deliverer</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Name' }, { label: 'License Plate' }, { label: 'Vehicle' }, { label: 'Phone' }, { label: 'Status', center: true }, { label: 'Rating', center: true }, { label: '', right: true }]}>
                    {MOCK_DELIVERERS.map(d => (
                        <Tr key={d.id}>
                            <Td mono className="text-xs">{d.id}</Td>
                            <Td bold>{d.name}</Td>
                            <Td mono className="text-xs">{d.license}</Td>
                            <Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <Td center><Badge color={d.status === 'Active' ? 'green' : 'gray'}>{d.status}</Badge></Td>
                            <Td center><span className="flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{d.rating}</span></Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(d)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Deliverer deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function DelivererFormInline({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [status, setStatus] = useState(data.status || 'Active');
    const [name, setName] = useState(data.name || '');
    const [license, setLicense] = useState(data.license || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [type, setType] = useState(data.type || 'Motorcycle');

    const handleSave = () => {
        if (!name.trim() || !license.trim() || !phone.trim() || !type) {
            return showToast('Please fill all required fields', 'error');
        }
        showToast('Deliverer saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Deliverers</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer name" /></FormField>
                    <FormField label="License Plate" required><Input value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. 1กข 1234" /></FormField>
                    <FormField label="Phone Number" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" /></FormField>
                    <FormField label="Vehicle Type" required>
                        <Select value={type} onChange={e => setType(e.target.value)}><option>Motorcycle</option><option>Car</option><option>Truck</option></Select>
                    </FormField>
                    <FormField label="Status">
                        <div className="flex items-center gap-3 mt-1">
                            <button onClick={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: status === 'Active' ? '#dc2626' : '#cbd5e1' }}>
                                <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: status === 'Active' ? 'calc(100% - 20px)' : '4px' }}></span>
                            </button>
                            <span className="text-sm font-semibold" style={{ color: status === 'Active' ? '#16a34a' : '#94a3b8' }}>{status}</span>
                        </div>
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// MASTER DATA: STORES
// ==========================================
function StoreListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <StoreFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Stores" subtitle="Manage restaurant & store listings"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Store</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Store Name' }, { label: 'Category' }, { label: 'Address' }, { label: 'Phone' }, { label: 'Hours' }, { label: '', right: true }]}>
                    {MOCK_STORES.map(s => (
                        <Tr key={s.id}>
                            <Td mono className="text-xs">{s.id}</Td>
                            <Td bold>{s.name}</Td>
                            <Td><Badge>{s.category}</Badge></Td>
                            <Td>{s.address}</Td>
                            <Td>{s.phone}</Td>
                            <Td className="text-xs">{s.open}</Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(s)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Store deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function StoreFormInline({ data, onBack, showToast }) {
    const [name, setName] = useState(data.name || '');
    const [category, setCategory] = useState(data.category || 'Thai Food');
    const [phone, setPhone] = useState(data.phone || '');
    const [open, setOpen] = useState(data.open || '');
    const [address, setAddress] = useState(data.address || '');

    const handleSave = () => {
        if (!name.trim() || !category || !phone.trim() || !address.trim()) {
            return showToast('Please fill all required fields', 'error');
        }
        showToast('Store saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Stores</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{data.id ? `Edit: ${data.name}` : 'New Store'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Restaurant name" /></FormField>
                    <FormField label="Category" required>
                        <Select value={category} onChange={e => setCategory(e.target.value)}><option>Thai Food</option><option>Japanese</option><option>Cafe & Drinks</option><option>Fast Food</option><option>Other</option></Select>
                    </FormField>
                    <FormField label="Phone" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="02-xxx-xxxx" /></FormField>
                    <FormField label="Operating Hours"><Input value={open} onChange={e => setOpen(e.target.value)} placeholder="09:00-21:00" /></FormField>
                    <div className="md:col-span-2"><FormField label="Address" required><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" /></FormField></div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// MASTER DATA: PRODUCTS
// ==========================================
function ProductListView({ showToast }) {
    const [editing, setEditing] = useState(null);
    if (editing) return <ProductFormInline data={editing} onBack={() => setEditing(null)} showToast={showToast} />;
    return (
        <div className="fade-in">
            <PageHeader title="Products" subtitle="Manage menu items across all stores"
                action={<Btn onClick={() => setEditing({})}><Plus className="w-4 h-4" /> Add Product</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Store' }, { label: 'Product Name' }, { label: 'Category' }, { label: 'Price', right: true }, { label: 'Status', center: true }, { label: '', right: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs">{p.id}</Td>
                            <Td>{p.store}</Td>
                            <Td bold>{p.name}</Td>
                            <Td>{p.category}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Btn size="sm" variant="secondary" onClick={() => setEditing(p)}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                    <Btn size="sm" variant="danger" onClick={() => showToast('Product deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                                </div>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function ProductFormInline({ data, onBack, showToast }) {
    const [active, setActive] = useState(data.active !== false);
    const [store, setStore] = useState(data.storeId ? `${data.storeId} – ${data.store}` : '');
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [name, setName] = useState(data.name || '');
    const [category, setCategory] = useState(data.category || '');
    const [price, setPrice] = useState(data.price || '');

    const handleSave = () => {
        if (!store || !name.trim() || price === '') {
            return showToast('Please fill all required fields', 'error');
        }
        if (Number(price) < 0) return showToast('Price cannot be negative', 'error');
        showToast('Product saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]} data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back to Products</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{data.id ? `Edit: ${data.name}` : 'New Product'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Product Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Menu item name" /></FormField>
                    <FormField label="Category"><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Main Dish, Drinks" /></FormField>
                    <FormField label="Unit Price (฿)" required><Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Active">
                        <div className="flex items-center gap-3 mt-1">
                            <button onClick={() => setActive(!active)} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: active ? '#dc2626' : '#cbd5e1' }}>
                                <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: active ? 'calc(100% - 20px)' : '4px' }}></span>
                            </button>
                            <span className="text-sm font-semibold" style={{ color: active ? '#16a34a' : '#94a3b8' }}>{active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}

// ==========================================
// REVENUE PER TRIP
// ==========================================
function RevenueTripView({ showToast }) {
    const [rates, setRates] = useState(MOCK_REVENUE_PER_TRIP);
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Revenue Per Trip" subtitle="Track delivery fee rate changes over time"
                action={<Btn onClick={() => setRates([{ id: Date.now(), date: '2026-03-23', revenue: 0, notes: '' }, ...rates])}><Plus className="w-4 h-4" /> Add Rate</Btn>} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <StatCard label="Current Rate" value={`฿${rates[rates.length - 1]?.revenue || 0}`} icon={<DollarSign size={18} />} sub={`Effective ${rates[rates.length - 1]?.date}`} color="green" />
                <StatCard label="Rate Changes" value={rates.length} icon={<History size={18} />} sub="Total adjustments" color="blue" />
            </div>
            <Card>
                <Table headers={[{ label: 'Effective Date' }, { label: 'Rate Per Trip', right: true }, { label: 'Notes' }, { label: '', right: true }]}>
                    {rates.map((r, i) => (
                        <Tr key={r.id}>
                            <td className="px-4 py-3"><input type="date" defaultValue={r.date} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 mono" /></td>
                            <td className="px-4 py-3 text-right"><input type="number" defaultValue={r.revenue} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24 font-bold" /></td>
                            <td className="px-4 py-3"><input defaultValue={r.notes} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full" placeholder="Notes..." /></td>
                            <td className="px-4 py-3 text-right"><Btn size="sm" onClick={() => showToast('Rate saved!')}><Save className="w-3.5 h-3.5" /></Btn></td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// ==========================================
// REPORTS
// ==========================================

// Delivered Orders (Kittiphat – Simple)
function DeliveredOrdersReportView() {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Delivered Orders" subtitle="List of all orders that have been successfully delivered" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Search className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Customer' }, { label: 'Store' }, { label: 'Deliverer' }, { label: 'Duration', right: true }, { label: 'Total', right: true }]}>
                    {MOCK_DELIVERED_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td bold mono className="text-xs">{o.id}</Td>
                            <Td>{o.date}</Td><Td>{o.customer}</Td><Td>{o.store}</Td><Td>{o.deliverer}</Td><Td right className="text-xs text-slate-500 font-bold">{o.duration}</Td>
                            <Td right bold>฿{o.total}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Order Receipt (Kittiphat – Simple)
function OrderReceiptView() {
    const subtotal = MOCK_RECEIPT_ITEMS.reduce((s, i) => s + i.total, 0);
    const delivery = 40;
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [orderId, setOrderId] = useState('ORD-2026-008001');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Order"
                columns={[{ key: 'id', label: 'Order ID' }, { key: 'date', label: 'Date' }, { key: 'customer', label: 'Customer' }, { key: 'store', label: 'Store' }]}
                data={MOCK_DELIVERED_ORDERS}
                onSelect={r => { setOrderId(r.id); setIsLovOpen(false); }} />
            <PageHeader title="Order Receipt" subtitle="View and print customer order receipts" />
            <FilterBar>
                <FilterField label="Order ID">
                    <LovInput value={orderId} onLov={() => setIsLovOpen(true)} placeholder="Select order..." />
                </FilterField>
                <Btn><Eye className="w-4 h-4" /> Load Receipt</Btn>
            </FilterBar>
            <div className="max-w-sm mx-auto">
                <Card className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                            <ShoppingBag className="w-5 h-5 fill-current" /><span className="text-xl font-black">VANz</span>
                        </div>
                        <p className="text-xs text-slate-400 mono">ORD-2026-008001 · 2026-03-21 14:32</p>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                        <p><span className="font-semibold">Customer:</span> Adisak M.</p>
                        <p><span className="font-semibold">Store:</span> Somchai Kitchen</p>
                        <p><span className="font-semibold">Deliverer:</span> Somchai J.</p>
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 mb-3">
                        {MOCK_RECEIPT_ITEMS.map(i => (
                            <div key={i.id} className="flex justify-between items-start py-1.5">
                                <div><p className="text-sm font-semibold text-slate-800">{i.name}</p><p className="text-xs text-slate-400">x{i.qty} @ ฿{i.price}</p></div>
                                <span className="text-sm font-bold text-slate-900 mono">฿{i.total}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="mono">฿{subtotal}</span></div>
                        <div className="flex justify-between text-sm text-slate-600"><span>Delivery Fee</span><span className="mono">฿{delivery}</span></div>
                        <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span className="mono">฿{subtotal + delivery}</span></div>
                    </div>
                    <Btn className="w-full mt-5" onClick={() => { }}><Printer className="w-4 h-4" /> Print Receipt</Btn>
                </Card>
            </div>
        </div>
    );
}

// Top Selling Products (Kittiphat – Analysis)
function ReportTopProductsView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Top Selling Products" subtitle="Analyze top best-selling products by quantity sold" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Top"><Input type="number" defaultValue="10" /></FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><BarChart3 className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Store' }, { label: 'Product' }, { label: 'Category' }, { label: 'Qty Sold', right: true }, { label: 'Revenue', right: true }]}>
                    {MOCK_TOP_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td center><RankBadge rank={p.rank} /></Td>
                            <Td>{p.store}</Td>
                            <Td bold>{p.name}</Td><Td>{p.category}</Td>
                            <Td right bold>{p.qty.toLocaleString()}</Td>
                            <Td right bold className="text-emerald-700">฿{p.revenue.toLocaleString()}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Store Products (Sorawit – Simple)
function StoreProductsReportView() {
    const [activeLov, setActiveLov] = useState(null);
    const [store, setStore] = useState('');
    const [product, setProduct] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov === 'store' ? 'Store' : 'Product'}
                columns={activeLov === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={activeLov === 'store' ? MOCK_STORES : MOCK_PRODUCTS}
                onSelect={r => {
                    if (activeLov === 'store') setStore(`${r.id} – ${r.name}`);
                    else setProduct(r.name);
                    setActiveLov(null);
                }} />
            <PageHeader title="Store Products" subtitle="View comprehensive list of products filtered by store" />
            <FilterBar>
                <FilterField label="Store Name">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Product Name">
                    <LovInput value={product} onLov={() => setActiveLov('product')} placeholder="Select product..." />
                </FilterField>
                <FilterField label="Unit Price"><Input type="number" placeholder="0.00" /></FilterField>
                <FilterField label="Status">
                    <Select><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Store' }, { label: 'Product Name' }, { label: 'Category' }, { label: 'Unit Price', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td>{p.store}</Td><Td bold>{p.name}</Td><Td>{p.category}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Favorite Stores (Sorawit – Simple)
function FavStoresReportView() {
    const [activeLov, setActiveLov] = useState(null);
    const [customer, setCustomer] = useState('');
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov === 'store' ? 'Store' : 'Customer'}
                columns={activeLov === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={activeLov === 'store' ? MOCK_STORES : MOCK_CUSTOMERS}
                onSelect={r => {
                    if (activeLov === 'store') setStore(`${r.id} – ${r.name}`);
                    else setCustomer(`${r.id} – ${r.name}`);
                    setActiveLov(null);
                }} />
            <PageHeader title="Favorite Stores" subtitle="List of stores marked as favorite by customers" />
            <FilterBar>
                <FilterField label="Customer Name">
                    <LovInput value={customer} onLov={() => setActiveLov('customer')} placeholder="Select customer..." />
                </FilterField>
                <FilterField label="Store Name">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="Select store..." />
                </FilterField>
                <Btn><Heart className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Customer Name' }, { label: 'Favorite Store' }, { label: 'Total Orders', right: true }]}>
                    {MOCK_FAV_STORES.map((f, i) => (
                        <Tr key={i}>
                            <Td bold>{f.customer}</Td>
                            <Td><span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />{f.store}</span></Td>
                            <Td right bold>{f.orders}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Top Deliverers (Sorawit – Analysis)
function TopDeliverersReportView() {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Top Deliverers" subtitle="Analyze top deliverers with the most deliveries" />
            <FilterBar>
                <FilterField label="Top"><Input type="number" defaultValue="10" /></FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Award className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Deliverer' }, { label: 'Vehicle' }, { label: 'Deliveries', right: true }, { label: 'Total Earnings', right: true }, { label: 'Rating', right: true }]}>
                    {MOCK_TOP_DELIVERERS.map(d => (
                        <Tr key={d.id}>
                            <Td center><RankBadge rank={d.rank} /></Td>
                            <Td bold>{d.name}</Td><Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <Td right bold>{d.deliveries}</Td>
                            <Td right bold className="text-emerald-600">฿{d.earnings.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right"><span className="flex items-center justify-end gap-1 font-bold text-amber-600"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating}</span></td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Unapproved Vouchers (Piti – Simple)
function UnapprovedVouchersReportView() {
    const unapproved = INITIAL_EXPENSE_VOUCHERS.filter(v => v.status === 'SUBMITTED' || v.status === 'DRAFT');
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Unapproved Vouchers" subtitle="Review and manage pending expense vouchers" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <FilterField label="Total Amount"><Input type="number" placeholder="Amount" /></FilterField>
                <FilterField label="Status">
                    <Select><option value="">All</option><option value="SUBMITTED">Submitted</option><option value="DRAFT">Draft</option></Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <div className="mb-3">
                <StatCard label="Unapproved Vouchers" value={unapproved.length} icon={<AlertCircle size={18} />} sub="Awaiting approval" color="amber" />
            </div>
            <Card>
                <Table headers={[{ label: 'Voucher ID' }, { label: 'Deliverer' }, { label: 'Voucher Date' }, { label: 'Expense Items' }, { label: 'Total Amount', right: true }, { label: 'Status', center: true }]}>
                    {unapproved.map(v => (
                        <Tr key={v.id}>
                            <Td bold mono className="text-xs">{v.id}</Td>
                            <Td>{v.delivererName}</Td><Td>{v.date}</Td>
                            <Td><Badge color="gray">{v.items}</Badge></Td>
                            <Td right bold>฿{v.total}</Td>
                            <Td center><Badge color="amber">{v.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Deliverer Ranking (Piti – Simple)
function DelivererRankingReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [deliverer, setDeliverer] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Deliverer Ranking" subtitle="Rank deliverers based on their average rating" />
            <FilterBar>
                <FilterField label="Deliverer Name">
                    <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Vehicle Type">
                    <Select><option value="">All Types</option><option>Motorcycle</option><option>Car</option><option>Truck</option></Select>
                </FilterField>
                <FilterField label="Rating"><Input type="number" step="0.1" placeholder="Min rating" /></FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Deliverer Name' }, { label: 'Vehicle Type' }, { label: 'Total Deliveries', right: true }, { label: 'Rating', right: true }]}>
                    {[...MOCK_DELIVERERS].sort((a, b) => b.rating - a.rating).map((d, i) => (
                        <Tr key={d.id}>
                            <Td center><RankBadge rank={i + 1} /></Td>
                            <Td bold>{d.name}</Td><Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <td className="px-4 py-3 text-right">
                                <span className="flex items-center justify-end gap-1 font-bold text-amber-600">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating}
                                    <div className="ml-2 h-2 rounded-full bg-amber-100 w-24"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${(d.rating / 5) * 100}%` }}></div></div>
                                </span>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Expense Summary (Piti – Analysis)
function ExpenseSummaryReportView() {
    const count = INITIAL_EXPENSE_VOUCHERS.length;
    const sum = INITIAL_EXPENSE_VOUCHERS.reduce((acc, v) => acc + v.total, 0);
    const avg = count > 0 ? sum / count : 0;

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Expense Summary" subtitle="Analyze total value and average of expense vouchers" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Calculator className="w-4 h-4" /> Calculate</Btn>
            </FilterBar>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Vouchers (COUNT)" value={count} icon={<FileText size={18} />} sub="Vouchers in period" color="blue" />
                <StatCard label="Total Value (SUM)" value={`฿${sum.toLocaleString()}`} icon={<DollarSign size={18} />} sub="Across all vouchers" color="red" />
                <StatCard label="Average Value (AVG)" value={`฿${avg.toFixed(2)}`} icon={<BarChart3 size={18} />} sub="Per voucher" color="green" />
            </div>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-3">Breakdown by Status & Categories</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 uppercase">Submitted</p>
                        <p className="text-2xl font-black text-amber-700 mt-1">฿470</p>
                        <p className="text-xs text-amber-500">2 vouchers</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Approved</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">฿45</p>
                        <p className="text-xs text-emerald-500">1 voucher</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-bold text-slate-600 uppercase">Top Expense</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">Fuel</p>
                        <p className="text-xs text-slate-500">฿320 (62% of total)</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Deliverer History (Panjapong – Simple)
function DelivererHistoryReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [deliverer, setDeliverer] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Deliverer History" subtitle="View delivery history of a specific deliverer" />
            <FilterBar>
                <FilterField label="Deliverer ID">
                    <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><History className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <CardHeader title="Somchai J. (D-001) — Delivery History" />
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Time', center: true }, { label: 'Store' }, { label: 'Customer' }, { label: 'Fee', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_DELIVERER_HISTORY.map(h => (
                        <Tr key={h.id}>
                            <Td bold mono className="text-xs">{h.id}</Td><Td>{h.date}</Td>
                            <Td center className="text-xs font-bold text-slate-500">{h.time}</Td>
                            <Td>{h.store}</Td><Td>{h.customer}</Td>
                            <Td right bold>฿{h.fee}</Td>
                            <Td center><Badge color="green">{h.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Category Products (Panjapong – Simple)
function CategoryProductsReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Category Products" subtitle="List all products within a specific category" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Category Name">
                    <Select>
                        <option value="">All Categories</option>
                        <option>Main Dish</option>
                        <option>Drinks</option>
                        <option>Appetizer</option>
                        <option>Dessert</option>
                        <option>Other</option>
                    </Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Store' }, { label: 'Category' }, { label: 'Product Name' }, { label: 'Price', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td>{p.store}</Td><Td><Badge>{p.category}</Badge></Td>
                            <Td bold>{p.name}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// Promotion Performance (Panjapong – Analysis)
function PromoPerfReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Promotion Performance" subtitle="Measure campaign revenue and conversion impact" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-31" /></FilterField>
                <Btn><TrendingUp className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Total Promo Revenue" value="฿20,600" icon={<TrendingUp size={18} />} sub="Across all campaigns" color="green" />
                <StatCard label="Active Campaigns" value="2" icon={<Target size={18} />} sub="Currently running" color="red" />
            </div>
            <Card>
                <Table headers={[{ label: 'Campaign' }, { label: 'Store' }, { label: 'Period' }, { label: 'Discount Type' }, { label: 'Orders Applied', right: true }, { label: 'Unique Products', right: true }, { label: 'Revenue Generated', right: true }]}>
                    {MOCK_PROMOTIONS.map(p => (
                        <Tr key={p.id}>
                            <Td bold>{p.name}</Td><Td>{p.store}</Td>
                            <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                            <Td>{p.discountType}</Td>
                            <Td right bold className="text-emerald-600">{p.orders}</Td>
                            <Td right bold>{p.products}</Td>
                            <Td right bold className="text-emerald-700">฿{p.revenue.toLocaleString()}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

// ==========================================
// NEW LIST VIEWS
// ==========================================
function CustomerOrderListView({ onNavigate }) {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customer Orders" subtitle="Manage all customer orders"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Order</Btn>} />
            <Card>
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Customer' }, { label: 'Status', center: true }, { label: 'Deliverer' }]}>
                    {INITIAL_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td mono className="text-xs font-bold text-red-600">{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td bold>{o.customer}</Td>
                            <Td center><Badge color={o.status === 'Paid' ? 'green' : 'amber'}>{o.status}</Badge></Td>
                            <Td>{o.deliverer}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}

function DelivererPaymentListView({ onNavigate }) {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverer Payments" subtitle="Process and view deliverer payments"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" />Create Payment</Btn>} />
            <Card>
                <Table headers={[{ label: 'Period' }, { label: 'Date' }, { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Amount', right: true }]}>
                    <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-24</Td><Td bold>Somchai J.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿2,450</Td>
                    </Tr>
                     <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-22</Td><Td bold>Kittisak P.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿1,500</Td>
                    </Tr>
                </Table>
            </Card>
        </div>
    );
}
