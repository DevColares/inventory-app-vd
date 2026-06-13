import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, AlertCircle, Plus, ChevronRight, History, Trash2, Send, Save, Settings, X } from 'lucide-react';
import Scanner from './Scanner';
import ProductInfo from './ProductInfo';
import SessionTable from './SessionTable';
import { 
  getProduct, 
  addSessionItem, 
  uploadProductsExcel, 
  exportSessionExcel, 
  getSessionItems, 
  updateSessionItem,
  getSessions,
  createSession,
  deleteSession,
  sendToGoogleSheets
} from '../services/api';

const InventoryApp = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [ean, setEan] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [sessionItems, setSessionItems] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(localStorage.getItem('google_sheets_url') || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  useEffect(() => {
    if (activeSession) {
      getSessionItems(activeSession.id).then(items => setSessionItems(items));
    }
  }, [activeSession]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('google_sheets_url', googleUrl);
    setShowConfig(false);
    setSuccessMsg('Configurações salvas!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreateSession = () => {
    const name = prompt('Nome do novo inventário:', `Inventário ${new Date().toLocaleDateString()}`);
    if (name) {
      const newSession = createSession(name);
      setSessions(getSessions());
      setActiveSession(newSession);
    }
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este inventário permanentemente?')) {
      deleteSession(id);
      setSessions(getSessions());
    }
  };

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
    if (!currentProduct || !activeSession) return;
    try {
      await addSessionItem(activeSession.id, currentProduct.ean, systemQty, physicalQty);
      const updatedItems = await getSessionItems(activeSession.id);
      setSessionItems(updatedItems);
      setCurrentProduct(null);
      setEan('');
    } catch (err) {
      setError('Erro ao registrar item na sessão.');
    }
  };

  const handleUpdateItem = async (ean, systemQty, physicalQty) => {
    try {
      await updateSessionItem(activeSession.id, ean, systemQty, physicalQty);
      const updatedItems = await getSessionItems(activeSession.id);
      setSessionItems(updatedItems);
    } catch (err) {
      setError('Erro ao atualizar item.');
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
      setIsLoading(true);
      setError('');
      setSuccessMsg('Enviando planilha de produtos...');
      const response = await uploadProductsExcel(file);
      setSuccessMsg(response.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Erro ao enviar a planilha.');
      setSuccessMsg('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    try {
      setIsLoading(true);
      setError('');
      
      const webAppUrl = localStorage.getItem('google_sheets_url');
      if (webAppUrl) {
        await sendToGoogleSheets(activeSession.id, webAppUrl);
        setSuccessMsg('Inventário finalizado e enviado para o Google Sheets!');
      } else {
        await exportSessionExcel(activeSession.id);
        setSuccessMsg('Inventário exportado para Excel (URL do Google Sheets não configurada)');
      }
    } catch (err) {
      setError('Erro ao finalizar inventário: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeSession) {
    return (
      <div className="max-w-xl mx-auto p-4 min-h-screen flex flex-col justify-center relative main-container">
        <button 
          onClick={() => setShowConfig(true)}
          className="absolute top-4 right-4 p-3 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-blue-600 hover:shadow-lg transition-all"
        >
          <Settings size={20} />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">InveStory</h1>
          <p className="text-slate-500 font-medium">Gestão simplificada de inventário</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleCreateSession}
            className="w-full flex items-center justify-between p-6 bg-blue-600 text-white rounded-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-lg">Criar Inventário</span>
                <span className="text-sm text-blue-100">Iniciar nova contagem física</span>
              </div>
            </div>
            <ChevronRight size={20} />
          </button>

          <div className="mt-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={16} /> Inventários Anteriores
            </h2>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                  Nenhum histórico encontrado
                </div>
              ) : (
                sessions.sort((a,b) => b.id - a.id).map(session => (
                  <div 
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-lg hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="block font-bold text-slate-800">{session.name}</span>
                      <span className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleDateString()} • {session.items.length} itens</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 text-slate-500 font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Download size={18} /> {isLoading ? 'Processando...' : 'Importar Base de Produtos'}
            </button>
          </div>
        </div>

        {/* Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Configurações</h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Sheets Web App URL</label>
                  <input 
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full border-2 border-slate-100 rounded-lg p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-2 px-1">
                    Insira a URL gerada na implantação do Apps Script para enviar os dados automaticamente.
                  </p>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-all shadow-lg"
                >
                  Salvar Configurações
                </button>
              </form>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-4 z-[70]">
            <p className="font-bold text-sm">{successMsg}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen pb-48 main-container">
      <header className="flex items-center justify-between mb-8 gap-4">
        <button 
          onClick={() => setActiveSession(null)}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 truncate">{activeSession.name}</h1>
          <p className="text-xs text-slate-500">Contando itens...</p>
        </div>
      </header>

      <div className="card mb-6 shadow-xl shadow-slate-200/50 border-0 bg-white/80 backdrop-blur-sm sticky top-4 z-40">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="Código SKU ou EAN..."
              className="w-full border-2 border-slate-100 rounded-lg p-5 pr-14 text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className={`absolute right-3 top-3 p-3 rounded-lg transition-all ${showScanner ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}
            >
              <Camera size={24} />
            </button>
          </div>
          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Buscar Produto
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-5 rounded-lg mb-6 border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 p-5 rounded-lg mb-6 border border-emerald-100 animate-in slide-in-from-top-2">
          <div className="p-1 bg-emerald-500 text-white rounded-full">
            <Plus size={14} className="rotate-45" />
          </div>
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {showScanner && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-xl border-4 border-white">
          <Scanner onScan={handleScan} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between px-2">
        <h3 className="font-bold text-slate-800">Contagem Física</h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{sessionItems.length} Itens</span>
      </div>

      <SessionTable items={sessionItems} onUpdate={handleUpdateItem} />
      
      <ProductInfo 
        product={currentProduct} 
        onConfirm={handleConfirmQty} 
        onCancel={handleCancelModal}
      />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl flex gap-3 px-2">
        <button 
          onClick={() => exportSessionExcel(activeSession.id)}
          disabled={sessionItems.length === 0}
          className="flex-1 bg-white border-2 border-slate-200 p-4 rounded-lg font-bold text-slate-600 shadow-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <Save size={20} /> Excel
        </button>
        <button 
          onClick={handleFinish}
          disabled={isLoading || sessionItems.length === 0}
          className="flex-1 bg-emerald-600 text-white p-4 rounded-lg font-bold shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          <Send size={20} /> Sheets
        </button>
      </div>
    </div>
  );
};

export default InventoryApp;
