import React from 'react';

const SessionTable = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-md mt-6">
        <p className="text-gray-500">Nenhum item registrado na sessão atual.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">EAN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Sistema</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Físico</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Div.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {items.map((item, index) => {
              let divColor = "text-slate-600";
              if (item.divergence < 0) divColor = "text-red-600 font-bold";
              if (item.divergence > 0) divColor = "text-emerald-600 font-bold";
              
              return (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">{item.ean}</td>
                  <td className="px-4 py-4 text-sm text-slate-600 truncate max-w-[120px]">{item.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-500 hidden sm:table-cell">{item.system_qty}</td>
                  <td className="px-4 py-4 text-sm text-slate-900 font-medium">{item.physical_qty}</td>
                  <td className={`px-4 py-4 text-sm ${divColor}`}>
                    {item.divergence > 0 ? `+${item.divergence}` : item.divergence}
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
