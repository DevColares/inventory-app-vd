import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Helper to get from local storage
const getStorage = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

// Helper to set to local storage
const setStorage = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const getProduct = async (ean) => {
  const products = getStorage('inventory_products', {});
  const cleanEan = ean.trim();
  
  let lookupCode = cleanEan;
  // Slicing logic for EAN-13
  if (cleanEan.length >= 12) {
    lookupCode = cleanEan.slice(-6, -1);
  }

  let product = products[lookupCode];
  
  // Fallback
  if (!product) {
    product = products[cleanEan];
  }

  if (!product) {
    throw new Error('Produto não encontrado');
  }

  return product;
};

// --- Session Management ---

export const getSessions = () => {
  return getStorage('inventory_sessions', []);
};

export const createSession = (name) => {
  const sessions = getSessions();
  const newSession = {
    id: Date.now().toString(),
    name: name || `Inventário ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    items: [],
    status: 'active'
  };
  sessions.push(newSession);
  setStorage('inventory_sessions', sessions);
  return newSession;
};

export const deleteSession = (id) => {
  const sessions = getSessions().filter(s => s.id !== id);
  setStorage('inventory_sessions', sessions);
};

export const getSessionItems = async (sessionId) => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return [];
  // Sort descending by timestamp
  return [...session.items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

export const addSessionItem = async (sessionId, ean, systemQty, physicalQty) => {
  const products = getStorage('inventory_products', {});
  // Try direct match or sliced match
  let product = products[ean] || products[ean.slice(-6, -1)];
  const name = product ? product.name : "Produto Desconhecido";
  
  const sessions = getSessions();
  const sessionIdx = sessions.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) throw new Error("Sessão não encontrada");

  const session = sessions[sessionIdx];
  const existingIdx = session.items.findIndex(item => item.ean === ean);
  
  let finalPhysicalQty = physicalQty;
  let finalSystemQty = systemQty ?? (product ? product.system_qty : 0);

  if (existingIdx >= 0) {
    finalPhysicalQty = session.items[existingIdx].physical_qty + physicalQty;
    if (systemQty === undefined || systemQty === null) {
      finalSystemQty = session.items[existingIdx].system_qty ?? finalSystemQty;
    }
  }

  const newItem = {
    ean,
    name,
    physical_qty: finalPhysicalQty,
    system_qty: finalSystemQty,
    timestamp: Date.now()
  };
  
  if (existingIdx >= 0) {
    session.items[existingIdx] = newItem;
  } else {
    session.items.push(newItem);
  }

  sessions[sessionIdx] = session;
  setStorage('inventory_sessions', sessions);
  return newItem;
};

export const updateSessionItem = async (sessionId, ean, systemQty, physicalQty) => {
  const sessions = getSessions();
  const sessionIdx = sessions.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) return null;

  const session = sessions[sessionIdx];
  const idx = session.items.findIndex(item => item.ean === ean);
  if (idx === -1) return null;

  const item = session.items[idx];
  item.physical_qty = physicalQty;
  if (systemQty !== undefined && systemQty !== null) {
    item.system_qty = systemQty;
  }
  item.timestamp = Date.now(); 

  session.items[idx] = item;
  sessions[sessionIdx] = session;
  setStorage('inventory_sessions', sessions);
  return item;
};

// --- Integration ---

export const uploadProductsExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) throw new Error("Planilha vazia ou inválida.");

        // Smart column mapping
        const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
        let codIdx = -1, nameIdx = -1, qtyIdx = -1;

        headers.forEach((h, i) => {
          if (h.match(/cod|ean|sku|bar|refer|id/)) codIdx = i;
          else if (h.match(/nome|desc|prod|item/)) nameIdx = i;
          else if (h.match(/quant|qtd|estoq|sald|total/)) qtyIdx = i;
        });

        // Fallback for common patterns
        if (codIdx === -1) codIdx = 0;
        if (nameIdx === -1) nameIdx = 1;
        if (qtyIdx === -1) qtyIdx = 2;

        const newProducts = {};
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[codIdx]) continue;

          const rawCode = String(row[codIdx]).trim();
          const name = row[nameIdx] ? String(row[nameIdx]).trim() : "Sem Nome";
          const qty = parseInt(row[qtyIdx], 10) || 0;

          let internalCode = rawCode;
          if (rawCode.length >= 12) {
            internalCode = rawCode.slice(-6, -1);
          }

          const productData = { ean: rawCode, name, system_qty: qty };
          newProducts[internalCode] = productData;
          
          // Map both codes to the same product for maximum compatibility
          if (internalCode !== rawCode) {
            newProducts[rawCode] = productData;
          }
          count++;
        }

        if (count === 0) throw new Error("Nenhum produto válido encontrado na planilha.");

        setStorage('inventory_products', newProducts);
        resolve({ message: `Sucesso! ${count} produtos carregados.` });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
};

export const exportSessionExcel = async (sessionId) => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.items.length === 0) {
    throw new Error("Sessão vazia. Não há nada para exportar.");
  }

  const data = session.items.map(item => ({
    SKU: item.ean,
    Nome: item.name,
    'Saldo Físico': item.physical_qty,
    Data: new Date(item.timestamp).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário");
  XLSX.writeFile(workbook, `InveStory_${session.name.replace(/\s+/g, '_')}.xlsx`);
};

export const exportSessionPDF = async (sessionId) => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.items.length === 0) throw new Error("Sessão vazia.");

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Relatório de Inventário", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Sessão: ${session.name}`, 14, 30);
  doc.text(`Data: ${new Date().toLocaleString()}`, 14, 35);
  doc.text(`Total de Itens: ${session.items.length}`, 14, 40);

  // Table
  const tableData = session.items.map(item => [
    item.ean,
    item.name,
    item.physical_qty.toString()
  ]);

  doc.autoTable({
    startY: 45,
    head: [['SKU/EAN', 'Nome do Produto', 'Qtd Física']],
    body: tableData,
    headStyles: { fillStyle: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillStyle: [248, 250, 252] },
    margin: { top: 45 },
  });

  doc.save(`InveStory_${session.name.replace(/\s+/g, '_')}.pdf`);
};

export const sendToGoogleSheets = async (sessionId, webAppUrl) => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.items.length === 0) throw new Error("Sessão vazia.");

  const payload = {
    sessionName: session.name,
    date: new Date().toLocaleString(),
    items: session.items.map(item => ({
      sku: item.ean,
      nome: item.name,
      fisico: item.physical_qty
    }))
  };

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    return { message: "Dados enviados com sucesso!" };
  } catch (error) {
    throw new Error("Falha na conexão: " + error.message);
  }
};
