import * as XLSX from 'xlsx';

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
  let product = products[ean] || products[ean.slice(-6, -1)];
  const name = product ? product.name : "Produto Desconhecido";
  
  const sessions = getSessions();
  const sessionIdx = sessions.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) throw new Error("Sessão não encontrada");

  const session = sessions[sessionIdx];
  const existingIdx = session.items.findIndex(item => item.ean === ean);
  
  let finalPhysicalQty = physicalQty;
  let finalSystemQty = systemQty;

  if (existingIdx >= 0) {
    finalPhysicalQty = session.items[existingIdx].physical_qty + physicalQty;
    if (!systemQty && session.items[existingIdx].system_qty) {
      finalSystemQty = session.items[existingIdx].system_qty;
    }
  }

  const newItem = {
    ean,
    name,
    system_qty: finalSystemQty,
    physical_qty: finalPhysicalQty,
    divergence: finalPhysicalQty - finalSystemQty,
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
  item.system_qty = systemQty;
  item.physical_qty = physicalQty;
  item.divergence = physicalQty - systemQty;
  item.timestamp = Date.now(); // Update timestamp on edit to move to top? 
  // User asked for "descending order", usually means newest first.

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
        
        if (rows.length < 2) throw new Error("Planilha vazia.");

        const headers = rows[0].map(h => String(h).toLowerCase().trim());
        let codIdx = 0, nameIdx = 1, qtyIdx = 2;
        headers.forEach((h, i) => {
          if (h.includes('cod') || h.includes('ean') || h.includes('código')) codIdx = i;
          else if (h.includes('nome') || h.includes('desc')) nameIdx = i;
          else if (h.includes('quant') || h.includes('qtd') || h.includes('estoque') || h.includes('saldo')) qtyIdx = i;
        });

        const newProducts = {};
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[codIdx]) continue;
          const rawCode = String(row[codIdx]).trim();
          const name = row[nameIdx] ? String(row[nameIdx]) : "Sem Nome";
          const qty = parseInt(row[qtyIdx], 10) || 0;
          let internalCode = rawCode;
          if (rawCode.length >= 12) internalCode = rawCode.slice(-6, -1);
          newProducts[internalCode] = { ean: rawCode, name, system_qty: qty };
          if (internalCode !== rawCode) newProducts[rawCode] = newProducts[internalCode];
          count++;
        }
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
    'Saldo Loja': item.system_qty,
    'Saldo Físico': item.physical_qty,
    Divergência: item.divergence
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário");
  XLSX.writeFile(workbook, `inventario_${session.name}.xlsx`);
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
      loja: item.system_qty,
      fisico: item.physical_qty,
      divergencia: item.divergence
    }))
  };

  console.log("--- DEBUG GOOGLE SHEETS ---");
  console.log("URL:", webAppUrl);
  console.log("Payload:", payload);

  try {
    console.log("Iniciando fetch...");
    const response = await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    console.log("Fetch concluído (modo no-cors). Verifique se os dados apareceram na planilha.");
    return { message: "Dados enviados! Verifique sua planilha em alguns segundos." };
  } catch (error) {
    console.error("ERRO NO FETCH:", error);
    throw new Error("Não foi possível conectar ao Google Sheets: " + error.message);
  }
};
