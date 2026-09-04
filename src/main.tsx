import React from 'react'
import ReactDOM from 'react-dom/client'
/* Rama mvp: entra por la aplicación de alcance reducido.
   La versión anterior sigue intacta en ./App. */
import Aplicacion from './mvp/Aplicacion'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Aplicacion />
  </React.StrictMode>,
)
