import React, { useState, useEffect } from 'react';

const ProductInfo = ({ product, onConfirm, onCancel }) => {
  const [systemQty, setSystemQty] = useState('');
  const [physicalQty, setPhysicalQty] = useState('');

  useEffect(() => {
    if (product) {
      setSystemQty('');
      setPhysicalQty('');
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (physicalQty !== '' && systemQty !== '') {
      onConfirm(parseInt(systemQty, 10), parseInt(physicalQty, 10));
      setSystemQty('');
      setPhysicalQty('');
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Contagem</h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wider">Produto</p>
            <p className="text-gray-900 font-bold text-lg mb-1">{product.name}</p>
            <p className="text-gray-600 text-sm"><span className="font-medium">SKU:</span> {product.ean}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="systemQty" className="block text-sm font-semibold text-gray-700 mb-2">
                Saldo Loja (Sistema)
              </label>
              <input
                type="number"
                id="systemQty"
                value={systemQty}
                onChange={(e) => setSystemQty(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-xl font-bold text-center focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Digite o saldo"
                required
                autoFocus
                inputMode="numeric"
              />
            </div>

            <div>
              <label htmlFor="physicalQty" className="block text-sm font-semibold text-gray-700 mb-2">
                Saldo Físico (Contado)
              </label>
              <input
                type="number"
                id="physicalQty"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-xl font-bold text-center focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Digite a contagem"
                required
                inputMode="numeric"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-slate-100 text-slate-600 px-4 py-4 rounded-xl hover:bg-slate-200 focus:outline-none transition-colors font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-bold shadow-lg shadow-blue-500/20"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
