import React from 'react'
import ReactDOM from 'react-dom/client'
import InventoryApp from './components/InventoryApp'
import { InventoryProvider } from './services/InventoryContext'
import { Toaster } from 'sonner'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InventoryProvider>
      <InventoryApp />
      <Toaster position="top-center" richColors />
    </InventoryProvider>
  </React.StrictMode>,
)

