import React, { useState, useEffect } from 'react';
import { X, Check, Package, Barcode, ShieldCheck } from 'lucide-react';

const ProductInfo = ({ product, onConfirm, onCancel, mode = 'inventory' }) => {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const isAudit = mode === 'audit' || mode === 'proves' || mode === 'prices';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden modal-content transform animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAudit ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
              {isAudit ? <ShieldCheck size={20} /> : <Package size={20} />}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Confirmar Produto
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h2>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Barcode size={16} />
                <span className="text-xs uppercase font-bold tracking-wider">Código EAN</span>
              </div>
              <p className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                {product.ean}
              </p>
            </div>
          </div>

          {!isAudit && (
            <div className="pt-4">
              <label className="block text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Quantidade Física
              </label>
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={() => setQty(Math.max(0, qty - 1))}
                  className="w-14 h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                >
                  -
                </button>
                <input 
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-24 text-center text-4xl font-black text-slate-900 dark:text-white bg-transparent outline-none"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  inputMode="numeric"
                />
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="w-14 h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
            >
              Não
            </button>
            <button 
              onClick={() => onConfirm(product.system_qty, isAudit ? 1 : qty)}
              className={`flex-[2] ${isAudit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700'} text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95`}
            >
              <Check size={20} /> Sim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
