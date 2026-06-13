import React from 'react';

const SessionTable = ({ items, onUpdate }) => {
  if (items.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-100 mt-6">
        <p className="text-slate-400 font-medium">Nenhum item registrado nesta sessão.</p>
        <p className="text-xs text-slate-300 mt-1">Comece bipando um produto acima.</p>
      </div>
    );
  }

  const handleQtyChange = (item, field, value) => {
    const numValue = parseInt(value, 10) || 0;
    const updatedItem = { ...item, [field]: numValue };
    onUpdate(updatedItem.ean, updatedItem.system_qty, updatedItem.physical_qty);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden session-table-container">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 session-table">
          <thead className="bg-slate-50/50">
            <tr>
              <th style={{ width: '45%' }} className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Produto</th>
              <th style={{ width: '18%' }} className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Loja</th>
              <th style={{ width: '19%' }} className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Físico</th>
              <th style={{ width: '18%' }} className="px-4 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Div.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {items.map((item, index) => {
              let divBg = "bg-slate-100 text-slate-600";
              if (item.divergence < 0) divBg = "bg-red-100 text-red-700";
              if (item.divergence > 0) divBg = "bg-emerald-100 text-emerald-700";
              
              return (
                <tr key={item.ean + item.timestamp} className={`hover:bg-blue-50/30 transition-colors ${index === 0 ? 'bg-blue-50/20' : ''}`}>
                  <td className="px-4 py-4">
                    <span className="block font-bold text-slate-900 text-sm truncate product-name-cell">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{item.ean}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      value={item.system_qty}
                      onChange={(e) => handleQtyChange(item, 'system_qty', e.target.value)}
                      className="w-10 text-center text-sm font-medium text-slate-400 bg-transparent hover:bg-slate-100 rounded-lg py-1 transition-colors outline-none"
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input
                      type="number"
                      value={item.physical_qty}
                      onChange={(e) => handleQtyChange(item, 'physical_qty', e.target.value)}
                      className="w-12 text-center text-sm font-bold text-slate-900 bg-slate-100 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold min-w-[32px] text-center ${divBg}`}>
                      {item.divergence > 0 ? `+${item.divergence}` : item.divergence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionTable;
