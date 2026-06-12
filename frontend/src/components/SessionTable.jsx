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
    <div className="overflow-x-auto mt-6 bg-white rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EAN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistema</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Físico</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divergência</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => {
            let divColor = "text-gray-500";
            if (item.divergence < 0) divColor = "text-red-600 font-semibold";
            if (item.divergence > 0) divColor = "text-green-600 font-semibold";
            
            return (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ean}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.system_qty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.physical_qty}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${divColor}`}>
                  {item.divergence > 0 ? `+${item.divergence}` : item.divergence}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SessionTable;
