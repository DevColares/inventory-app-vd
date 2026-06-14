/*
  CÓDIGO PARA GOOGLE APPS SCRIPT (Google Sheets)
  
  1. No Google Sheets, vá em Extensões > Apps Script
  2. Apague o código existente e cole este abaixo
  3. Clique em 'Implantar' > 'Nova implantação'
  4. Tipo: 'App da Web'
  5. Descrição: 'API InveStory'
  6. Executar como: 'Eu'
  7. Quem tem acesso: 'Qualquer pessoa' (Importante para que o app consiga enviar)
  8. Copie a URL gerada e cole nas configurações do InveStory
*/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Adiciona cabeçalho se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Data', 'Inventário', 'SKU/EAN', 'Produto', 'Qtd Física']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f1f5f9');
    }
    
    // Insere os dados
    data.items.forEach(function(item) {
      sheet.appendRow([
        data.date,
        data.sessionName,
        item.sku,
        item.nome,
        item.fisico
      ]);
    });
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}
