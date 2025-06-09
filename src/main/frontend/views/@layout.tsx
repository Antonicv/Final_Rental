import { useViewConfig } from '@vaadin/hilla-file-router/runtime.js';
import { effect, signal } from '@vaadin/hilla-react-signals';
import { AppLayout, DrawerToggle, Icon, SideNav, SideNavItem } from '@vaadin/react-components';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

// Senyal per al títol del document, utilitzada per Vaadin per actualitzar el <title> de la pàgina.
const documentTitleSignal = signal('');
effect(() => {
  document.title = documentTitleSignal.value; // Actualitza el títol del document HTML
});

// Publica la senyal al objecte global window perquè Vaadin pugui accedir-hi.
(window as any).Vaadin.documentTitleSignal = documentTitleSignal;

// Definició de la interfície per als elements del menú.
interface MenuItem {
  to: string; // La ruta a la qual navega l'element del menú (ex: '/').
  title: string; // El text que es mostra a l'element del menú (ex: 'Inici').
  icon?: string; // Opcional: la ruta de l'icona (ej. 'line-awesome/svg/home-solid.svg').
}

// Component principal del layout de l'aplicació.
export default function MainLayout() { // Aquest component serà reanomenat a @layout.tsx per convenció de Hilla.
  const currentTitle = useViewConfig()?.title; // Obté el títol de la configuració de la vista actual (definit a cada ViewConfig).
  const navigate = useNavigate(); // Hook de React Router per a la navegació programàtica entre rutes.
  const location = useLocation(); // Hook de React Router per obtenir la ubicació actual de la URL.

  // Estats per controlar si el mode fosc i el mode vintage estan actius.
  // isDarkMode: Comprova si l'element <html> té l'atribut 'theme' (indicant mode fosc).
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.hasAttribute('theme'));
  // isVintageMode: Comprova si l'element <html> té la classe 'vintage-mode'.
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // Efecte per actualitzar el títol del document quan canvia la vista actual.
  useEffect(() => {
    if (currentTitle) {
      documentTitleSignal.value = currentTitle; // Assigna el títol de la vista a la senyal.
    }
  }, [currentTitle]); // Es re-executa cada vegada que currentTitle canvia.

  // Funció per alternar el mode fosc de l'aplicació.
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.removeAttribute('theme'); // Si està en mode fosc, l'elimina.
    } else {
      document.documentElement.setAttribute('theme', 'dark'); // Si no, afegeix l'atribut 'theme="dark"'.
    }
    setIsDarkMode(!isDarkMode); // Commuta l'estat local de isDarkMode.
  };

  // Funció per alternar el mode vintage de l'aplicació.
  const toggleVintageMode = () => {
    document.documentElement.classList.toggle('vintage-mode'); // Afegeix o treu la classe 'vintage-mode' del <html>.
    setIsVintageMode(prevMode => !prevMode); // Actualitza l'estat local per canviar el text del botó.
  };

  // Definició manual dels elements del menú de navegació.
  const menuItems: MenuItem[] = [
    // --- Pàgines per a Clients ---
    { to: '/', title: 'Inici', icon: 'line-awesome/svg/home-solid.svg' },
    { to: '/book-a-car', title: 'Cercar Cotxes / Reservar', icon: 'line-awesome/svg/car-solid.svg' },
    { to: '/my-bookings', title: 'Les Meves Reserves', icon: 'line-awesome/svg/calendar-check-solid.svg' },
    { to: '/locations', title: 'Delegacions / Ubicacions', icon: 'line-awesome/svg/map-marker-alt-solid.svg' },
    

    // --- Pàgines d'Administració (Agrupades) ---
    // Aquestes rutes podrien ser protegides en una aplicació real.
    { to: '/admin/dashboard', title: 'Panell d\'Administració', icon: 'line-awesome/svg/tachometer-alt-solid.svg' },
    // Noves rutes per a les seccions de gestió específiques de l'administrador.
    { to: '/admin/cars', title: 'Gestió de Cotxes', icon: 'line-awesome/svg/car-side-solid.svg' },
    { to: '/admin/bookings', title: 'Gestió de Reserves', icon: 'line-awesome/svg/book-solid.svg' },
    { to: '/admin/delegations', title: 'Gestió de Delegacions', icon: 'line-awesome/svg/building-solid.svg' },
    //{ to: '/admin/users', title: 'Gestió d'Usuaris', icon: 'line-awesome/svg/user-cog-solid.svg' }, // Icona més apropiada per a gestió d'usuaris (actualment comentada).
  ];

  return (
    // AppLayout és un component de Vaadin que proporciona una estructura de layout bàsica amb calaix i barra superior.
    <AppLayout primarySection="drawer">
      {/* Secció del calaix (Drawer) amb el menú de navegació. */}
      <div slot="drawer" className="flex flex-col justify-between h-full p-m">
        <header className="flex flex-col gap-m">
          <span className="font-semibold text-l">My App</span> {/* Títol de l'aplicació dins del calaix. */}
          {/* SideNav és el component de navegació lateral de Vaadin. */}
          <SideNav onNavigate={({ path }) => navigate(path!)} location={location}>
            {/* Mapeja els elements definits a menuItems per crear SideNavItem per a cadascun. */}
            {menuItems.map((item) => (
              <SideNavItem path={item.to} key={item.to}>
                {item.icon ? <Icon src={item.icon} slot="prefix"></Icon> : <></>} {/* Mostra l'icona si existeix. */}
                {item.title} {/* Mostra el títol de l'element del menú. */}
              </SideNavItem>
            ))}
          </SideNav>
        </header>
      </div>

      {/* Secció de la barra de navegació superior (Navbar). */}
      <div slot="navbar" className="navbar-custom">
        {/* DrawerToggle és el botó per obrir/tancar el calaix. */}
        <DrawerToggle slot="navbar" aria-label="Menu toggle"></DrawerToggle>
        <h1 className="navbar-title">{documentTitleSignal}</h1> {/* Mostra el títol de la vista actual. */}
        <div className="flex gap-m">
          {/* Botó per alternar el mode fosc. */}
          <button
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'} {/* Text del botó segons el mode actual. */}
          </button>
          {/* Botó per alternar el mode vintage. */}
          <button
            className="vintage-toggle-btn"
            onClick={toggleVintageMode}
          >
            {isVintageMode ? 'Disable Vintage Mode' : 'Activate Vintage Mode'} {/* Text del botó segons el mode actual. */}
          </button>
        </div>
      </div>

      {/* Contingut principal de l'aplicació, on es renderitzen les vistes. */}
      <Suspense>
        <Outlet /> {/* Outlet de React Router, que renderitza el component de la ruta actual. */}
      </Suspense>

      {/* Element tv-static per a l'efecte visual del mode vintage (controlat per CSS). */}
      <div className="tv-static"></div>
    </AppLayout>
  );
}