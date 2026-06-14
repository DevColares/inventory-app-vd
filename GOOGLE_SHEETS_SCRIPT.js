/*
  CÓDIGO PARA GOOGLE APPS SCRIPT (Google Sheets)
  
  1. No Google Sheets, vá em Extensões > Apps Script
  2. Apague o código existente e cole este abaixo
  3. Clique em 'Implantar' > 'Nova implantação'
  4. Tipo: 'App da Web'
  5. Descrição: 'API InveStory com Abas'
  6. Executar como: 'Eu'
  7. Quem tem acesso: 'Qualquer pessoa'
  8. Copie a URL gerada e cole nas configurações do InveStory
*/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = data.sessionName || "Geral";
    
    // Tenta encontrar a aba pelo nome, se não existir, cria uma nova
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Adiciona cabeçalho na nova aba
      sheet.appendRow(['Data/Hora', 'SKU/EAN', 'Produto', 'Qtd Física']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1); // Congela a primeira linha
    }
    
    // Insere os dados dos itens
    data.items.forEach(function(item) {
      sheet.appendRow([
        data.date,
        item.sku,
        item.nome,
        item.fisico
      ]);
    });
    
    // Ajusta o tamanho das colunas automaticamente
    sheet.autoResizeColumns(1, 4);
    
    return ContentService.createTextOutput("Sucesso: Dados enviados para a aba " + sheetName)
      .setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
