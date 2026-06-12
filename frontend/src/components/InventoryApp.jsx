import React, { useState, useRef } from 'react';
import { Camera, Download, AlertCircle } from 'lucide-react';
import Scanner from './Scanner';
import ProductInfo from './ProductInfo';
import SessionTable from './SessionTable';
import { getProduct, addSessionItem, uploadProductsExcel, exportSessionExcel, getSessionItems } from '../services/api';

const InventoryApp = () => {
  const [ean, setEan] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [sessionItems, setSessionItems] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    getSessionItems().then(items => setSessionItems(items));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ean) return;
    try {
      setError('');
      const product = await getProduct(ean);
      setCurrentProduct(product);
      setShowScanner(false);
    } catch (err) {
      setCurrentProduct(null);
      setError('Produto não encontrado ou erro na rede.');
    }
  };

  const handleScan = async (decodedText) => {
    setEan(decodedText);
    try {
      setError('');
      setSuccessMsg('');
      const product = await getProduct(decodedText);
      setCurrentProduct(product);
      setShowScanner(false);
    } catch (err) {
      setCurrentProduct(null);
      setError('Produto lido não encontrado.');
      setShowScanner(false);
    }
  };

  const handleConfirmQty = async (systemQty, physicalQty) => {
    if (!currentProduct) return;
    try {
      const result = await addSessionItem(currentProduct.ean, systemQty, physicalQty);
      
      // Update session table
      setSessionItems(prev => {
        const existingIdx = prev.findIndex(item => item.ean === result.ean);
        if (existingIdx >= 0) {
          const newItems = [...prev];
          newItems[existingIdx] = result;
          return newItems;
        }
        return [...prev, result];
      });
      
      // Reset flow
      setCurrentProduct(null);
      setEan('');
    } catch (err) {
      setError('Erro ao registrar item na sessão.');
    }
  };

  const handleCancelModal = () => {
    setCurrentProduct(null);
    setEan('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError('');
      setSuccessMsg('Enviando planilha...');
      const response = await uploadProductsExcel(file);
      setSuccessMsg(response.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Erro ao enviar a planilha.');
      setSuccessMsg('');
    }
  };

  const handleExport = async () => {
    try {
      setError('');
      await exportSessionExcel();
      setSuccessMsg('Excel exportado com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao exportar a planilha.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 py-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center sm:text-left">Controle de Inventário</h1>
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
            >
              Importar
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            placeholder="Código EAN..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-3 text-base"
            autoFocus
          />
          <div className="flex gap-2">
            <button 
              type="submit"
              className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900 transition-colors font-medium"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-3 rounded-md hover:bg-blue-200 transition-colors font-medium"
            >
              <Camera size={20} />
              <span>{showScanner ? 'Fechar' : 'Câmera'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 border border-green-200">
          <p>{successMsg}</p>
        </div>
      )}

      {showScanner && (
        <div className="mb-6">
          <Scanner onScan={handleScan} />
        </div>
      )}

      <SessionTable items={sessionItems} />
      
      <ProductInfo 
        product={currentProduct} 
        onConfirm={handleConfirmQty} 
        onCancel={handleCancelModal}
      />
    </div>
  );
};

export default InventoryApp;
