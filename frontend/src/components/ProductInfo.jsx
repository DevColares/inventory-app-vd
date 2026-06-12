import React, { useState } from 'react';

const ProductInfo = ({ product, onConfirm, onCancel }) => {
  const [systemQty, setSystemQty] = useState('');
  const [physicalQty, setPhysicalQty] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (systemQty !== '' && physicalQty !== '') {
      onConfirm(parseInt(systemQty, 10), parseInt(physicalQty, 10));
      setSystemQty('');
      setPhysicalQty('');
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirmar Saldos</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <p className="text-gray-600 mb-1"><span className="font-semibold text-gray-700">Código (EAN):</span> {product.ean}</p>
            <p className="text-gray-600"><span className="font-semibold text-gray-700">Nome:</span> {product.name}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="systemQty" className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Loja (Sistema)
              </label>
              <input
                type="number"
                id="systemQty"
                value={systemQty}
                onChange={(e) => setSystemQty(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-3"
                placeholder="Digite o saldo do sistema"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="physicalQty" className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Físico (Contagem)
              </label>
              <input
                type="number"
                id="physicalQty"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-3"
                placeholder="Digite a quantidade contada"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium shadow-sm"
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
