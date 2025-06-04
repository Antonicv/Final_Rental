import { ViewConfig } from '@vaadin/hilla-file-router/types.js';

export const config: ViewConfig = { menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' }, title: 'home' };

export default function HomeView() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <img style={{ width: '200px' }} src="images/empty-plant.png" />
      <h2>Coches a pupilaje</h2>
        <h3> Desde 1950, ofreciendo los mejores coches a nuestros clientes.</h3>
    </div>
  );
}
