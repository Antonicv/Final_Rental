// src/views/Billing.tsx
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useState } from 'react';
import { Grid } from '@vaadin/react-components/Grid';
import { GridColumn } from '@vaadin/react-components/GridColumn';

// Configuració de la vista per al router de Hilla
export const config: ViewConfig = {
  title: 'Facturación', // Títol que es mostrarà a la pestanya del navegador o al títol de la ruta.
};

// Definició del tipus 'Invoice' (Factura) per a la consistència de les dades.
type Invoice = {
  id: string; // Identificador únic de la factura.
  date: string; // Data d'emissió de la factura en format de cadena.
  amount: number; // Import total de la factura.
  paymentStatus: 'Pending' | 'Paid' | 'Overdue'; // Estat del pagament: Pendent, Pagada o Endarrerida.
  paymentMethod: string; // Mètode de pagament utilitzat o previst.
};

// Component principal de la vista de Facturació.
export default function Billing() {
  // Estat per emmagatzemar la llista de factures.
  // S'inicialitza amb dades de mostra.
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-1001',
      date: '2025-06-01',
      amount: 150.0,
      paymentStatus: 'Pending',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'INV-1002',
      date: '2025-05-15',
      amount: 200.5,
      paymentStatus: 'Paid',
      paymentMethod: 'PayPal',
    },
    {
      id: 'INV-1003',
      date: '2025-04-20',
      amount: 99.99,
      paymentStatus: 'Overdue',
      paymentMethod: 'Bank Transfer',
    },
  ]);

  // Funció per marcar una factura com a pagada.
  // Rep l'ID de la factura a actualitzar.
  const markAsPaid = (id: string) => {
    setInvoices((prev) =>
      // Recorre la llista de factures anteriors (prev).
      prev.map((inv) =>
        // Si l'ID de la factura actual coincideix amb l'ID proporcionat,
        // crea un nou objecte de factura amb l'estat de pagament actualitzat a 'Paid'.
        // Altrament, retorna la factura sense canvis.
        inv.id === id ? { ...inv, paymentStatus: 'Paid' } : inv
      )
    );
  };

  // Condició per mostrar un missatge si no hi ha factures.
  if (invoices.length === 0) {
    return <div>No hay facturas disponibles.</div>;
  }

  // Renderitzat de la interfície d'usuari.
  return (
    <div>
      {/* Títol de la secció de factures. */}
      <h2 className="text-2xl font-semibold mb-4">Facturas</h2>
      {/* Component Grid de Vaadin per mostrar les factures en format de taula. */}
      <Grid items={invoices} theme="row-stripes">
        {/* Columna per a l'ID de la factura. */}
        <GridColumn path="id" header="Factura ID" />
        {/* Columna per a la data de la factura. */}
        <GridColumn path="date" header="Fecha" />
        {/* Columna per a l'import de la factura amb format de moneda. */}
        <GridColumn
          header="Monto (€)" // Títol de la columna.
          renderer={({ item }) => <span>{item.amount.toFixed(2)}</span>} // Renderitza l'import amb 2 decimals.
        />
        {/* Columna per a l'estat de pagament. */}
        <GridColumn path="paymentStatus" header="Estado de Pago" />
        {/* Columna per al mètode de pagament. */}
        <GridColumn path="paymentMethod" header="Método de Pago" />
        {/* Columna per a les accions (botó "Marcar como Pagada"). */}
        <GridColumn
          header="Acciones" // Títol de la columna.
          renderer={({ item }) =>
            // Condicionalment, mostra un botó si la factura no està pagada,
            // o un text si ja està pagada.
            item.paymentStatus !== 'Paid' ? (
              <button
                onClick={() => markAsPaid(item.id)} // Crida a la funció `markAsPaid` en fer clic.
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" // Estils del botó.
              >
                Marcar como Pagada
              </button>
            ) : (
              <span className="text-green-600 font-semibold">Pagada</span> // Text per a factures pagades.
            )
          }
        />
      </Grid>
    </div>
  );
}