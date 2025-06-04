import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
// No se necesita useState aquí a menos que vayas a manejar estado en esta página placeholder
// import { useState } from 'react'; 

export const config: ViewConfig = {
  title: 'Actividades de Ocio',
};

export default function LeisureActivitiesView() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Actividades de Ocio en la Zona</h2>
      <p>Pronto podrás encontrar actividades de ocio y eventos cerca de nuestras delegaciones.</p>
    </div>
  );
}
