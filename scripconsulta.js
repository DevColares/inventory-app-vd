// ==UserScript==
// @name         SGI Boticário - Integração Direta Google Sheets (Modo Angular)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Lê códigos, simula digitação humana, espera renderizar e salva
// @match        *://sgi.e-boticario.com.br/Paginas/Separacao/ConsultarPosicaoEstoque.aspx*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    // ========================================================
    // COLUNA 6 = Total Físico (baseado no código-fonte da página)
    const INDICE_DA_COLUNA = 6;
    // ========================================================

    const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyVTV7F9U10lZFWgohFhYw5Uz2GqafZtvwlPpbIiAugX28zzwWODmffD36_JTsOkZnt/exec";

    // --- PAINEL VISUAL DE LOG ---
    function mostrarLog(texto) {
        let logDiv = document.getElementById('sgi-bot-log');
        if (!logDiv) {
            logDiv = document.createElement('div');
            logDiv.id = 'sgi-bot-log';
            logDiv.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#0F9D58; color:#fff; padding:15px 25px; border-radius:8px; z-index:999999; font-family:sans-serif; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3);';
            document.body.appendChild(logDiv);
        }
        logDiv.innerText = "🤖 " + texto;
    }

    let executando = GM_getValue('rodando_sheets', false);

    GM_registerMenuCommand("🔄 Buscar Códigos da Planilha e Iniciar", () => {
        mostrarLog("Conectando ao Google Sheets...");

        GM_xmlhttpRequest({
            method: "GET",
            url: URL_WEB_APP,
            onload: function (response) {
                try {
                    let dadosPlanilha = JSON.parse(response.responseText);
                    let itensParaProcessar = dadosPlanilha.filter(item => !item.processado);

                    if (itensParaProcessar.length === 0) {
                        return alert("Todos os códigos da planilha já possuem quantidades registradas na Coluna C!");
                    }

                    GM_setValue('fila_sheets', itensParaProcessar);
                    GM_setValue('rodando_sheets', true);
                    GM_setValue('item_atual', null);

                    mostrarLog(`Iniciando fila: ${itensParaProcessar.length} itens.`);
                    processarProximoItem();
                } catch (e) {
                    alert("Erro ao ler dados do Sheets: " + e.message);
                }
            }
        });
    });

    GM_registerMenuCommand("🛑 Parar Automação", () => {
        GM_setValue('rodando_sheets', false);
        mostrarLog("Automação pausada.");
        setTimeout(() => document.getElementById('sgi-bot-log')?.remove(), 3000);
    });

    if (!executando) return;

    window.addEventListener('load', () => {
        let ultimoItemPesquisado = GM_getValue('item_atual', null);
        if (ultimoItemPesquisado) {
            tentarCapturarResultado(0);
        } else {
            processarProximoItem();
        }
    });

    function tentarCapturarResultado(tentativas = 0) {
        let ultimoItem = GM_getValue('item_atual', null);
        if (!ultimoItem) return;

        let linhaDados = null;
        // Pega literalmente todas as células da tela
        let todasCelulas = document.querySelectorAll('td');

        // Procura a célula que tenha EXATAMENTE o código pesquisado
        for (let i = 0; i < todasCelulas.length; i++) {
            if (todasCelulas[i].innerText.trim() === ultimoItem.codigo) {
                linhaDados = todasCelulas[i].parentElement; // Achou! Pega a linha inteira dela
                break;
            }
        }

        if (linhaDados) {
            let celulasLinha = linhaDados.querySelectorAll('td');
            let quantidadeEncontrada = "0";

            if (celulasLinha && celulasLinha.length > INDICE_DA_COLUNA) {
                quantidadeEncontrada = celulasLinha[INDICE_DA_COLUNA].innerText.trim();
            }

            mostrarLog(`Enviando Qtd: ${quantidadeEncontrada} para o Sheets...`);

            GM_xmlhttpRequest({
                method: "POST",
                url: URL_WEB_APP,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    linha: ultimoItem.linha,
                    quantidade: quantidadeEncontrada
                }),
                onload: function () {
                    mostrarLog("Salvo! Indo para o próximo...");
                    GM_setValue('item_atual', null);
                    setTimeout(processarProximoItem, 800);
                },
                onerror: function () {
                    mostrarLog("Erro na rede. Pulando item.");
                    GM_setValue('item_atual', null);
                    setTimeout(processarProximoItem, 800);
                }
            });

        } else {
            // Fica procurando a tabela por até 10 segundos
            if (tentativas < 20) {
                setTimeout(() => tentarCapturarResultado(tentativas + 1), 500);
            } else {
                mostrarLog(`Sem estoque para o Cód: ${ultimoItem.codigo}.`);
                GM_xmlhttpRequest({
                    method: "POST",
                    url: URL_WEB_APP,
                    headers: { "Content-Type": "application/json" },
                    data: JSON.stringify({ linha: ultimoItem.linha, quantidade: "0" }),
                    onload: () => {
                        GM_setValue('item_atual', null);
                        processarProximoItem();
                    }
                });
            }
        }
    }

    function processarProximoItem() {
        if (!GM_getValue('rodando_sheets', false)) return;

        let filaAtual = GM_getValue('fila_sheets', []);

        if (filaAtual.length > 0) {
            let proximoItem = filaAtual.shift();
            GM_setValue('fila_sheets', filaAtual);
            GM_setValue('item_atual', proximoItem);

            let inputCod = document.querySelector('input[name="ctl00$ContentPlaceHolder1$codMaterial$T2"]');
            let btnBuscar = document.getElementById('ContentPlaceHolder1_buscarButton_btn');

            if (inputCod && btnBuscar) {
                mostrarLog(`Pesquisando Cód: ${proximoItem.codigo}...`);

                // === O SEGREDO DA VERSÃO 3.0 ESTÁ AQUI ===
                inputCod.value = proximoItem.codigo;
                // Força o sistema do SGI a reconhecer que o campo foi digitado
                inputCod.dispatchEvent(new Event('input', { bubbles: true }));
                inputCod.dispatchEvent(new Event('change', { bubbles: true }));
                // ==========================================

                setTimeout(() => {
                    btnBuscar.click();

                    // Espera 1 segundo e começa a caçar o resultado na tela
                    setTimeout(() => tentarCapturarResultado(0), 1000);
                }, 500); // Meio segundo entre digitar e clicar
            }
        } else {
            GM_setValue('rodando_sheets', false);
            mostrarLog("✅ Automação Concluída!");
            alert("Toda a planilha foi atualizada na Coluna C.");
        }
    }
})();