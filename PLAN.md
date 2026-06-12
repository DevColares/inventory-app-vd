---
name: inventory-app-plan
description: Plano de ação para implementação do aplicativo de controle de inventário (frontend React + Tailwind, backend FastAPI, integração de leitura de código de barras e exportação Excel)
type: project
---

# Plano de Ação – inventory-app

## 1. Estrutura de diretórios
- `frontend/` – React + Vite + Tailwind.
- `backend/` – FastAPI com mock DB, rotas de produto e sessão.
- Arquivos de configuração (`package.json`, `tailwind.config.cjs`, `vite.config.js`, `requirements.txt`).

## 2. Frontend
1. Criar `index.html`, `vite.config.js`, `src/main.jsx`, `src/index.css`.
2. Implementar componente `InventoryApp.jsx` que contém:
   - Input de EAN (focus automático).
   - Botão *Ler com a Câmera* → html5‑qrcode.
   - Exibir nome e quantidade do sistema (fetch `/product/{ean}`).
   - Input de quantidade física → confirmação.
   - Tabela da sessão atual com cálculo de divergência (vermelho <0, verde >0, cinza =0).
   - Link *Exportar para Excel* → GET `/session/export`.
3. Configurar Tailwind para arquivos em `src/**/*.{js,jsx,ts,tsx}`.
4. Garantir CORS no backend (`allow_origins: ["*"]`).

## 3. Backend (FastAPI)
1. Criar pacote `app/` com:
   - `main.py` – app FastAPI, CORS, inclusão de routers.
   - `db.py` – mock de produtos e lista em memória da sessão.
   - `schemas.py` – Pydantic models `ProductResponse` e `SessionItem`.
   - `routers/product.py` – `GET /product/{ean}`.
   - `routers/session.py` – `POST /session/item` e `GET /session/export` (openpyxl).
2. `requirements.txt` lista dependências (`fastapi`, `uvicorn`, `openpyxl`, etc.).
3. Health check `/health`.

## 4. Execução local
1. **Backend**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   API disponível em `http://127.0.0.1:8000`.
2. **Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   App abre em `http://localhost:5173`.
3. Testar fluxo:
   - Digitar/escaneiar EAN presente no mock.
   - Confirmar quantidade física.
   - Verificar divergência e exportar.

## 5. Próximos passos / melhorias
- Substituir mock DB por banco real (PostgreSQL, SQLite + SQLAlchemy).
- Persistir sessão em Redis ou DB para múltiplas instâncias.
- Adicionar autenticação JWT.
- Deploy: Docker Compose com dois serviços (frontend nginx, backend uvicorn).
- Internacionalização (i18n) e acessibilidade.

---

**Como usar**
1. Siga a seção *Execução local* para levantar os servidores.
2. Abra o navegador, acesse a UI, e siga o fluxo descrito.
3. Quando precisar de novos campos ou regras, estenda os routers e o componente React.

**Referências**
- `html5-qrcode` – leitura de EAN‑13.
- `openpyxl` – geração de planilha Excel.
- FastAPI docs – https://fastapi.tiangolo.com
- Vite + React + Tailwind – https://vitejs.dev/guide/
