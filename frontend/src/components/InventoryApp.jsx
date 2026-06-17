import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, AlertCircle, Plus, ChevronRight, History, Trash2, Send, Save, Settings, X, FileText, ClipboardList, CheckSquare, Tag, Moon, Sun, Search } from 'lucide-react';
import { toast } from 'sonner';
import Scanner from './Scanner';
import ProductInfo from './ProductInfo';
import SessionTable from './SessionTable';
import { useInventory } from '../services/InventoryContext';
import { 
  getProduct, 
  uploadProductsExcel, 
  exportSessionExcel, 
  exportSessionPDF,
  sendToGoogleSheets 
} from '../services/api';

const TABS = [
  { id: 'inventory', label: 'Inventário', gender: 'm', icon: ClipboardList, color: 'blue' },
  { id: 'proves', label: 'Lista de Proves', gender: 'f', icon: CheckSquare, color: 'purple' },
  { id: 'prices', label: 'Lista de Preços', gender: 'f', icon: Tag, color: 'emerald' },
];

const InventoryApp = () => {
  const { 
    sessions, 
    activeSession, 
    setActiveSession, 
    sessionItems, 
    isLoading, 
    setIsLoading,
    config,
    updateConfig,
    createSession,
    deleteSession,
    addItem,
    updateItem
  } = useInventory();

  const [activeTab, setActiveTab] = useState('inventory');
  const [ean, setEan] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Modal local states
  const [googleUrl, setGoogleUrl] = useState(config.googleSheetsUrl);
  const [fastScan, setFastScan] = useState(config.fastScanMode);
  
  const fileInputRef = useRef(null);

  // Sync modal states when opened
  useEffect(() => {
    if (showConfig) {
      setGoogleUrl(config.googleSheetsUrl);
      setFastScan(config.fastScanMode);
    }
  }, [showConfig, config]);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    updateConfig({ 
      googleSheetsUrl: googleUrl,
      fastScanMode: fastScan
    });
    setShowConfig(false);
    toast.success('Configurações salvas!');
  };

  const handleCreateSession = () => {
    const tab = TABS.find(t => t.id === activeTab);
    const prefix = tab.gender === 'm' ? 'Novo' : 'Nova';
    const name = prompt(`Nome do ${prefix.toLowerCase()} ${tab.label}:`, `${tab.label} ${new Date().toLocaleDateString()}`);
    if (name) {
      createSession(name, activeTab);
      toast.success(`${tab.label} criad${tab.gender === 'm' ? 'o' : 'a'}!`);
    }
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    if (confirm('Deseja excluir permanentemente?')) {
      deleteSession(id);
      toast.error('Excluído');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ean) return;
    try {
      const product = await getProduct(ean);
      
      const isAudit = activeSession?.type === 'audit' || activeSession?.type === 'proves' || activeSession?.type === 'prices';

      if (isAudit) {
        // Auditoria mode behavior: confirmation modal first
        setCurrentProduct(product);
      } else if (config.fastScanMode) {
        await addItem(product.ean, product.system_qty, 1);
        toast.success(`+1: ${product.name}`);
        setEan('');
      } else {
        setCurrentProduct(product);
        setShowScanner(false);
      }
    } catch (err) {
      setCurrentProduct(null);
      toast.error('Produto não encontrado');
    }
  };

  const handleScan = async (decodedText) => {
    setEan(decodedText);
    try {
      const product = await getProduct(decodedText);
      const isAudit = activeSession?.type === 'audit' || activeSession?.type === 'proves' || activeSession?.type === 'prices';
      
      if (isAudit) {
        setCurrentProduct(product);
        setShowScanner(false);
      } else if (config.fastScanMode) {
        await addItem(product.ean, product.system_qty, 1);
        toast.success(`+1: ${product.name}`);
        setEan('');
      } else {
        setCurrentProduct(product);
        setShowScanner(false);
      }
    } catch (err) {
      setCurrentProduct(null);
      toast.error('Produto não encontrado');
    }
  };

  const handleConfirmQty = async (systemQty, physicalQty) => {
    if (!currentProduct || !activeSession) return;
    try {
      await addItem(currentProduct.ean, systemQty, physicalQty);
      setCurrentProduct(null);
      setEan('');
      toast.success('Item registrado');
    } catch (err) {
      toast.error('Erro ao registrar item');
    }
  };

  const handleUpdateItem = async (ean, systemQty, physicalQty) => {
    try {
      await updateItem(ean, systemQty, physicalQty);
      toast.success('Quantidade atualizada');
    } catch (err) {
      toast.error('Erro ao atualizar item');
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
      const response = await uploadProductsExcel(file);
      toast.success(response.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Erro ao enviar a planilha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    try {
      setIsLoading(true);
      if (config.googleSheetsUrl) {
        await sendToGoogleSheets(activeSession.id, config.googleSheetsUrl);
        toast.success('Enviado para o Google Sheets!');
      } else {
        await exportSessionExcel(activeSession.id);
        toast.info('Exportado para Excel');
      }
    } catch (err) {
      toast.error('Erro ao finalizar: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeSession) {
    const filteredSessions = sessions.filter(s => (s.type || 'inventory') === activeTab);
    const activeTabData = TABS.find(t => t.id === activeTab);

    return (
      <div className="max-w-xl mx-auto p-4 min-h-screen flex flex-col relative main-container dark:bg-slate-950 transition-colors">
        <button 
          onClick={() => setShowConfig(true)}
          className="absolute top-4 right-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-400 hover:text-blue-600 hover:shadow-lg transition-all"
        >
          <Settings size={20} />
        </button>

        <div className="text-center mb-8 mt-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Resolution</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão simplificada de inventários</p>
        </div>

        {/* Submenu Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 flex-1">
          <button 
            onClick={handleCreateSession}
            className={`w-full flex items-center justify-between p-6 rounded-lg shadow-xl transition-all group ${
              activeTab === 'inventory' ? 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700' :
              activeTab === 'proves' ? 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-700' :
              'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'
            } text-white`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-lg">{activeTabData.gender === 'm' ? 'Novo' : 'Nova'} {activeTabData.label}</span>
                <span className="text-sm text-white/80">Toque para iniciar</span>
              </div>
            </div>
            <ChevronRight size={20} />
          </button>

          <div className="mt-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={16} /> Histórico de {activeTabData.label}
            </h2>
            <div className="space-y-3">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400">
                  Nenhum registro encontrado
                </div>
              ) : (
                [...filteredSessions].sort((a,b) => b.id - a.id).map(session => (
                  <div 
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-100">{session.name}</span>
                      <span className="text-xs text-slate-400">{new Date(session.createdAt).toLocaleDateString()} • {session.items.length} itens</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-3 text-red-500 sm:text-slate-300 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-900 text-center">
          <p className="text-xs text-slate-400 font-medium">Desenvolvido por <span className="text-slate-600 dark:text-slate-300 font-bold">Andelison Colares</span></p>
        </footer>

        {/* Config Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Configurações</h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Google Sheets Web App URL</label>
                  <input 
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 text-sm">Bip Rápido (+1)</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Soma 1 sem abrir modal</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFastScan(!fastScan)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${fastScan ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${fastScan ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-600'}`}>
                        {config.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 dark:text-slate-200 text-sm">Modo Escuro</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{config.darkMode ? 'Ativado' : 'Desativado'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ darkMode: !config.darkMode })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${config.darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.darkMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <Download size={18} /> {isLoading ? 'Processando...' : 'Importar Base de Produtos'}
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg"
                >
                  Salvar Configurações
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeTabData = TABS.find(t => t.id === (activeSession.type || 'inventory')) || TABS[0];
  const isAudit = activeSession.type === 'audit' || activeSession.type === 'proves' || activeSession.type === 'prices';

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen pb-48 main-container dark:bg-slate-950 transition-colors">
      <header className="flex items-center justify-between mb-8 gap-4">
        <button 
          onClick={() => setActiveSession(null)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full text-slate-400 transition-colors"
        >
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <activeTabData.icon size={16} className={`text-${activeTabData.color}-600`} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{activeSession.name}</h1>
          </div>
          <p className="text-xs text-slate-500">
            {isAudit ? 'Auditoria de Preços/Proves' : 'Registrando itens...'}
          </p>
        </div>
      </header>

      <div className={`card mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-4 z-40 border-t-4 ${
        activeTabData.id === 'inventory' ? 'border-blue-500' :
        activeTabData.id === 'proves' ? 'border-purple-500' :
        'border-emerald-500'
      }`}>
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="Código SKU ou EAN..."
              className="w-full border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg p-5 pr-14 text-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className={`absolute right-3 top-3 p-3 rounded-lg transition-all ${showScanner ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}
            >
              <Camera size={24} />
            </button>
          </div>
          <button 
            type="submit"
            className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            {isAudit ? 'Consultar Produto' : 'Buscar Produto'}
          </button>
        </form>
      </div>

      {showScanner && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
          <Scanner onScan={handleScan} useDelay={isAudit} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between px-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">
          {isAudit ? 'Itens Auditados' : 'Contagem Física'}
        </h3>
        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 px-3 py-1 rounded-full">
          {sessionItems.length} Itens
        </span>
      </div>

      <SessionTable items={sessionItems} onUpdate={handleUpdateItem} />
      
      <ProductInfo 
        product={currentProduct} 
        onConfirm={handleConfirmQty} 
        onCancel={handleCancelModal}
        mode={activeSession.type}
      />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl flex gap-2 px-2">
        <button 
          onClick={() => exportSessionExcel(activeSession.id)}
          disabled={sessionItems.length === 0}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          title="Exportar Excel"
        >
          <Save size={20} /> <span className="hidden sm:inline">Excel</span>
        </button>
        <button 
          onClick={() => exportSessionPDF(activeSession.id)}
          disabled={sessionItems.length === 0}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          title="Exportar PDF"
        >
          <FileText size={20} /> <span className="hidden sm:inline">PDF</span>
        </button>
        <button 
          onClick={handleFinish}
          disabled={isLoading || sessionItems.length === 0}
          className="flex-[2] bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          <Send size={20} /> {isLoading ? 'Enviando...' : 'Finalizar'}
        </button>
      </div>
    </div>
  );
};

export default InventoryApp;
