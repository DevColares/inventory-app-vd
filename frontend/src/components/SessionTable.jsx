import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SessionTable = ({ items, onUpdate, onToggle, session }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isPriceTab = session?.type === 'prices';

  if (items.length === 0) {
    return (
      <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 mt-6 transition-colors">
        <p className="text-slate-400 font-medium">Nenhum item registrado nesta sessão.</p>
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Comece bipando um produto acima.</p>
      </div>
    );
  }

  const handleQtyChange = (item, field, value) => {
    const numValue = parseInt(value, 10) || 0;
    const updatedItem = { ...item, [field]: numValue };
    onUpdate(updatedItem.ean, updatedItem.system_qty, updatedItem.physical_qty);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.ean.includes(searchTerm)
  );

  return (
    <div className="space-y-4 transition-colors">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar por nome ou SKU..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-11 pr-4 py-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden session-table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 session-table">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                {isPriceTab && <th className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider w-10">OK</th>}
                <th style={{ width: isPriceTab ? '60%' : '70%' }} className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</th>
                <th style={{ width: '30%' }} className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Físico</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
              {filteredItems.map((item, index) => {
                const isChecked = item.checked;
                return (
                  <tr key={item.ean + item.timestamp} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${index === 0 ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''} ${isChecked ? 'opacity-50' : ''}`}>
                    {isPriceTab && (
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => onToggle(item.ean)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className={`block font-bold text-slate-900 dark:text-slate-100 text-sm truncate product-name-cell ${isChecked ? 'line-through' : ''}`}>{item.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">{item.ean}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        value={item.physical_qty}
                        onChange={(e) => handleQtyChange(item, 'physical_qty', e.target.value)}
                        className="w-16 text-center text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum resultado para "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionTable;
