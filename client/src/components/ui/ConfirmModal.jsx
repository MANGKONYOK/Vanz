import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Btn from './Btn';

export default function ConfirmModal({ isOpen, onClose, title = 'Are you sure?', message, onConfirm, confirmText = 'Delete', cancelText = 'Cancel' }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden fade-in border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                
                {/* Danger Visual Indicator Header */}
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">Confirmation Required</p>
                    </div>
                </div>

                {/* Message Body */}
                <p className="text-sm text-slate-750 dark:text-slate-200 leading-relaxed">
                    {message}
                </p>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Btn variant="secondary" onClick={onClose}>
                        {cancelText}
                    </Btn>
                    <Btn variant="primary" onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all">
                        {confirmText}
                    </Btn>
                </div>
            </div>
        </div>,
        document.body
    );
}
