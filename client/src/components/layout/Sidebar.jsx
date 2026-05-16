import {
    LayoutDashboard, Package, Users, CreditCard, FileText,
    ChevronDown, ShoppingBag, ChevronLeft,
    User, Store, Tag, Receipt, Truck, BarChart3, TrendingUp,
    PackageCheck, Printer, Calculator, Heart, Star, History, List, DollarSign, Box,
    PieChart, AlertCircle, Award
} from 'lucide-react';

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

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, currentView, setCurrentView, expandedNav, setExpandedNav }) {
    return (
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
                    <NavItem icon={<TrendingUp size={16} />} label="Promo Perform" active={currentView === 'report_promo_perf'} onClick={() => setCurrentView('report_promo_perf')} />
                </NavGroup>
            </nav>

            <div className="px-3 py-3 border-t border-red-900/50 w-[240px] shrink-0 bg-red-900/30">
                <div className="flex items-center gap-2.5 px-2 py-2">
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">AD</div>
                    <div className="min-w-0"><p className="text-xs font-semibold text-white truncate">Admin User</p><p className="text-[10px] text-white/60 truncate">admin@vanz.com</p></div>
                </div>
            </div>
        </aside>
    );
}
