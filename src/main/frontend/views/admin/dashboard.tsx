import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
// No se necesita useState aquí a menos que vayas a manejar estado en esta página placeholder
// import { useState } from 'react'; 

export const config: ViewConfig = {
  title: 'Panel de Administración',
};

export default function AdminDashboardView() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Panel de Administración</h2>
      <p>Bienvenido al panel de control. Aquí podrás gestionar coches, reservas, delegaciones y usuarios.</p>
      <p className="text-sm text-gray-500 mt-2">Nota: Esta sección será accesible solo para administradores en el futuro.</p>
    </div>
  );
}
