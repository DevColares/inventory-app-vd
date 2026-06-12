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

export const addSessionItem = async (ean, systemQty, physicalQty) => {
  const products = getStorage('inventory_products', {});
  let product = products[ean] || products[ean.slice(-6, -1)];
  const name = product ? product.name : "Produto Desconhecido";
  
  const divergence = physicalQty - systemQty;

  const newItem = {
    ean,
    name,
    system_qty: systemQty,
    physical_qty: physicalQty,
    divergence
  };

  const session = getStorage('inventory_session', []);
  
  // Update if exists
  const existingIdx = session.findIndex(item => item.ean === ean);
  if (existingIdx >= 0) {
    session[existingIdx] = newItem;
  } else {
    session.push(newItem);
  }

  setStorage('inventory_session', session);
  return newItem;
};

export const getSessionItems = async () => {
  return getStorage('inventory_session', []);
};

export const uploadProductsExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          throw new Error("Planilha vazia ou sem dados.");
        }

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
          if (rawCode.length >= 12) {
            internalCode = rawCode.slice(-6, -1);
          }

          newProducts[internalCode] = { ean: rawCode, name, system_qty: qty };
          
          if (internalCode !== rawCode) {
            newProducts[rawCode] = newProducts[internalCode];
          }
          count++;
        }

        setStorage('inventory_products', newProducts);
        resolve({ message: `Sucesso! ${count} produtos carregados.` });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
};

export const exportSessionExcel = async () => {
  const session = getStorage('inventory_session', []);
  if (session.length === 0) {
    throw new Error("Sessão vazia. Não há nada para exportar.");
  }

  // Format data for sheet
  const data = session.map(item => ({
    EAN: item.ean,
    Nome: item.name,
    'Saldo Loja': item.system_qty,
    'Saldo Físico': item.physical_qty,
    Divergência: item.divergence
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sessão de Inventário");
  
  XLSX.writeFile(workbook, "inventory_export.xlsx");
};
