import React, { useState, useEffect } from 'react';
import { Search, Loader2, Check, X, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Scanner from './Scanner';
import { enviarConsultaSaldo, checarConsultaSaldo, apagarConsultaSaldo } from '../services/api';
import { useInventory } from '../services/InventoryContext';

const ConsultaSaldo = () => {
  const { config } = useInventory();
  const [ean, setEan] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resultado, setResultado] = useState(null); // { ean, quantidade }
  const [pollingId, setPollingId] = useState(null);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingId) clearInterval(pollingId);
    };
  }, [pollingId]);

  const handleScan = (decodedText) => {
    setEan(decodedText);
    setShowScanner(false);
    iniciarConsulta(decodedText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ean) return;
    iniciarConsulta(ean);
  };

  const iniciarConsulta = async (codigoEan) => {
    if (!config.googleSheetsUrl) {
      toast.error('URL da API do Google Sheets não configurada.');
      return;
    }
    
    setStatus('loading');
    setResultado(null);
    
    try {
      // 1. Enviar para a planilha
      const idConsulta = await enviarConsultaSaldo(codigoEan, config.googleSheetsUrl);
      
      // 2. Iniciar polling
      const idIntervalo = setInterval(async () => {
        try {
          const res = await checarConsultaSaldo(idConsulta, config.googleSheetsUrl);
          if (res && res.processado) {
            clearInterval(idIntervalo);
            setPollingId(null);
            setResultado({ ean: codigoEan, quantidade: res.quantidade, linha: res.linha });
            setStatus('success');
            toast.success('Saldo consultado com sucesso!');
          }
        } catch (err) {
          console.error('Erro no polling', err);
        }
      }, 3000); // Check every 3 seconds
      
      setPollingId(idIntervalo);
      
    } catch (error) {
      setStatus('error');
      toast.error('Erro ao iniciar a consulta: ' + error.message);
    }
  };

  const handleConfirmar = async () => {
    if (!resultado) return;
    
    try {
      await apagarConsultaSaldo(resultado.linha, config.googleSheetsUrl);
      toast.success('Consulta removida da planilha.');
      resetarEstado();
    } catch (error) {
      toast.error('Erro ao limpar a consulta da planilha.');
    }
  };

  const resetarEstado = () => {
    if (pollingId) {
      clearInterval(pollingId);
      setPollingId(null);
    }
    setStatus('idle');
    setResultado(null);
    setEan('');
  };

  return (
    <div className="flex flex-col gap-6">
      {status === 'idle' && (
        <div className="card shadow-xl shadow-slate-200/50 dark:shadow-none border-t-4 border-yellow-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 text-center">Consultar Saldo Online</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                value={ean}
                onChange={(e) => setEan(e.target.value)}
                placeholder="Código SKU ou EAN..."
                className="w-full border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg p-5 pr-14 text-lg focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 outline-none transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowScanner(!showScanner)}
                className={`absolute right-3 top-3 p-3 rounded-lg transition-all ${showScanner ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'}`}
              >
                <Camera size={24} />
              </button>
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 dark:bg-yellow-600 text-white font-bold py-4 rounded-lg hover:bg-slate-800 dark:hover:bg-yellow-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Search size={20} /> Iniciar Consulta
            </button>
          </form>
          
          {showScanner && (
            <div className="mt-6 rounded-lg overflow-hidden shadow-xl border-4 border-white dark:border-slate-800">
              <Scanner onScan={handleScan} />
            </div>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="card text-center p-12 bg-white dark:bg-slate-900 rounded-xl shadow-xl border-2 border-yellow-500/20 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping"></div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-full relative">
              <RefreshCw size={48} className="text-yellow-600 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Processando Consulta...</h3>
            <p className="text-slate-500 mt-2">Aguardando o script do PDV processar o EAN: <strong className="text-slate-700 dark:text-slate-300">{ean}</strong></p>
          </div>
          <button 
            onClick={resetarEstado}
            className="text-red-500 font-bold text-sm hover:underline mt-4"
          >
            Cancelar Consulta
          </button>
        </div>
      )}

      {status === 'success' && resultado && (
        <div className="card p-8 bg-white dark:bg-slate-900 rounded-xl shadow-xl border-t-8 border-emerald-500 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-full">
            <Check size={48} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">EAN: {resultado.ean}</p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Saldo: {resultado.quantidade}</h2>
            <p className="text-slate-500">Consulta realizada com sucesso pelo PDV.</p>
          </div>
          <button 
            onClick={handleConfirmar}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <Check size={20} /> Confirmar e Fechar
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="card text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-xl border-t-8 border-red-500">
          <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Falha na consulta</h3>
          <p className="text-slate-500 mb-6">Não foi possível iniciar a consulta ou ocorreu um erro de conexão.</p>
          <button 
            onClick={resetarEstado}
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsultaSaldo;
