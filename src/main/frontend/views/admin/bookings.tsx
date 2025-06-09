import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useState } from 'react';
import { Grid } from '@vaadin/react-components/Grid';
import { GridColumn } from '@vaadin/react-components/GridColumn';

export const config: ViewConfig = {
  title: 'Facturación',
};

type Invoice = {
  id: string;
  date: string;
  amount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
  paymentMethod: string;
};

export default function Billing() {
  // Datos simulados
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
    {
      id: 'INV-1003',
      date: '2025-04-20',
      amount: 99.99,
      paymentStatus: 'Overdue',
      paymentMethod: 'Bank Transfer',
    },
  ]);

  // Función simulada para marcar una factura como pagada
  const markAsPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, paymentStatus: 'Paid' } : inv
      )
    );
  };

  if (invoices.length === 0) {
    return <div>No hay facturas disponibles.</div>;
  }

  return (
    <div>
      <h2>Facturas</h2>
      <Grid items={invoices}>
        <GridColumn path="id" header="Factura ID" />
        <GridColumn path="date" header="Fecha" />
        <GridColumn
          header="Monto (€)"
          renderer={({ item }) => item.amount.toFixed(2)}
        />
        <GridColumn path="paymentStatus" header="Estado de Pago" />
        <GridColumn path="paymentMethod" header="Método de Pago" />
        <GridColumn
          header="Acciones"
          renderer={({ item }) =>
            item.paymentStatus !== 'Paid' ? (
              <button onClick={() => markAsPaid(item.id)}>Marcar como Pagada</button>
            ) : (
              <span>Pagada</span>
            )
          }
        />
      </Grid>
    </div>
  );
}
