import { createMenuItems, useViewConfig } from '@vaadin/hilla-file-router/runtime.js';
import { effect, signal } from '@vaadin/hilla-react-signals';
import { AppLayout, DrawerToggle, Icon, SideNav, SideNavItem } from '@vaadin/react-components';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

const documentTitleSignal = signal('');
effect(() => {
  document.title = documentTitleSignal.value;
});

// Publish for Vaadin to use
(window as any).Vaadin.documentTitleSignal = documentTitleSignal;

export default function MainLayout() {
  const currentTitle = useViewConfig()?.title;
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.hasAttribute('theme'));
  // NUEVO ESTADO para el modo vintage en MainLayout
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  useEffect(() => {
    if (currentTitle) {
      documentTitleSignal.value = currentTitle;
    }
  }, [currentTitle]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.removeAttribute('theme');
    } else {
      document.documentElement.setAttribute('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  // Función para alternar el modo vintage
  const toggleVintageMode = () => {
    document.documentElement.classList.toggle('vintage-mode');
    setIsVintageMode(prevMode => !prevMode); // Actualiza el estado local para el texto del botón
  };

  return (
    <AppLayout primarySection="drawer">
      <div slot="drawer" className="flex flex-col justify-between h-full p-m">
        <header className="flex flex-col gap-m">
          <span className="font-semibold text-l">My App</span>
          <SideNav onNavigate={({ path }) => navigate(path!)} location={location}>
            {createMenuItems().map(({ to, title, icon }) => (
              <SideNavItem path={to} key={to}>
                {icon ? <Icon src={icon} slot="prefix"></Icon> : <></>}
                {title}
              </SideNavItem>
            ))}
          </SideNav>
        </header>
      </div>

      <div slot="navbar" className="navbar-custom">
        <DrawerToggle slot="navbar" aria-label="Menu toggle"></DrawerToggle>
        <h1 className="navbar-title">{documentTitleSignal}</h1>
        <div className="flex gap-m">
          <button
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className="vintage-toggle-btn"
            onClick={toggleVintageMode}
          >
            {isVintageMode ? 'Disable Vintage Mode' : 'Activate Vintage Mode'}
          </button>
        </div>
      </div>

      <Suspense>
        <Outlet />
      </Suspense>

      {/* NUEVO: Elemento tv-static para el efecto visual */}
      {/* Se mostrará/ocultará con CSS basado en la clase 'vintage-mode' en <html> */}
      <div className="tv-static"></div>
    </AppLayout>
  );
}
