/*
  CÓDIGO PARA GOOGLE APPS SCRIPT (Google Sheets)
  
  1. No Google Sheets, vá em Extensões > Apps Script
  2. Apague o código existente e cole este abaixo
  3. Clique em 'Implantar' > 'Nova implantação'
  4. Tipo: 'App da Web'
  5. Descrição: 'API InveStory com Consulta de Saldo'
  6. Executar como: 'Eu'
  7. Quem tem acesso: 'Qualquer pessoa'
  8. Copie a URL gerada e cole nas configurações do InveStory
*/

const SHEET_CONSULTA = "FilaConsulta"; // Nome da aba usada para o scripconsulta.js

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CONSULTA);
    
    // Se a aba não existe, retorna vazio
    if (!sheet) {
      return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    }
    
    // Checar ação específica de 'lerConsulta' (Frontend polling)
    if (e.parameter.action === 'lerConsulta') {
      var codigo = e.parameter.codigo;
      var data = sheet.getDataRange().getValues();
      // data[0] is header, search backwards to get the most recent
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0] == codigo) {
          return ContentService.createTextOutput(JSON.stringify({
            processado: data[i][1] === true || data[i][1] === "TRUE" || data[i][1] === "true",
            quantidade: data[i][2],
            linha: i + 1
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ processado: false })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Comportamento padrão (para o scriptconsulta.js)
    // Ler a fila inteira para processamento
    var data = sheet.getDataRange().getValues();
    var itens = [];
    for (var i = 1; i < data.length; i++) { // pula cabeçalho
      itens.push({
        linha: i + 1,
        codigo: data[i][0],
        processado: data[i][1] === true || data[i][1] === "TRUE" || data[i][1] === "true",
        quantidade: data[i][2]
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify(itens)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Frontend: Adicionar Consulta
    if (data.action === 'adicionarConsulta') {
      var sheet = getOrCreateConsultaSheet(ss);
      sheet.appendRow([data.codigo, false, ""]);
      return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);
    }
    
    // 2. Frontend: Apagar Consulta
    if (data.action === 'apagarConsulta') {
      var sheet = ss.getSheetByName(SHEET_CONSULTA);
      if (sheet && data.linha) {
        // Ao invés de deletar e bagunçar os índices, podemos apenas limpar a linha ou deletar
        // Como o scripconsulta.js usa a linha, vamos apagar a linha.
        // Cuidado: se apagar a linha, os índices de outras linhas abaixo mudarão se elas estiverem em processamento.
        // O ideal é apenas limpar o conteúdo.
        sheet.getRange(data.linha, 1, 1, 3).clearContent();
      }
      return ContentService.createTextOutput("Apagado").setMimeType(ContentService.MimeType.TEXT);
    }
    
    // 3. scripconsulta.js: Atualizar quantidade processada
    if (data.quantidade !== undefined && data.linha !== undefined && !data.sessionName) {
      var sheet = ss.getSheetByName(SHEET_CONSULTA);
      if (sheet) {
        // Atualiza a coluna B (processado) para true, e coluna C (quantidade)
        sheet.getRange(data.linha, 2).setValue(true);
        sheet.getRange(data.linha, 3).setValue(data.quantidade);
      }
      return ContentService.createTextOutput("Atualizado").setMimeType(ContentService.MimeType.TEXT);
    }
    
    // 4. Fluxo Original de Inventário
    if (data.sessionName && data.items) {
      var sheetName = data.sessionName || "Geral";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(['Data/Hora', 'SKU/EAN', 'Produto', 'Qtd Física', 'Saldo Loja', 'Divergência']);
        sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }
      
      data.items.forEach(function(item) {
        sheet.appendRow([
          data.date,
          item.sku,
          item.nome,
          item.fisico,
          "", 
          ""  
        ]);
      });
      
      sheet.autoResizeColumns(1, 6);
      return ContentService.createTextOutput("Sucesso Inventario").setMimeType(ContentService.MimeType.TEXT);
    }
    
    return ContentService.createTextOutput("Comando Nao Reconhecido").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function getOrCreateConsultaSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_CONSULTA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CONSULTA);
    sheet.appendRow(['Codigo', 'Processado', 'Quantidade']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#fbbf24').setFontColor('#000000');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
