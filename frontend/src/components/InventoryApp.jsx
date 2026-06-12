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
    <div className="max-w-3xl mx-auto p-4 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Controle de Inventário</h1>
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 w-full sm:w-auto">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary btn-blue text-sm"
          >
            Importar Excel
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary btn-ghost text-sm text-green-700"
          >
            Exportar
          </button>
        </div>
      </header>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <input
            type="text"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            placeholder="Código EAN..."
            className="w-full border-slate-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            autoFocus
          />
          <div className="flex gap-3">
            <button 
              type="submit"
              className="btn-primary btn-gray flex-1 text-center"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="btn-primary btn-ghost flex-1 text-center"
            >
              {showScanner ? 'Fechar Câmera' : 'Ler Código'}
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
