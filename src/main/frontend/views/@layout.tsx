import { useViewConfig } from '@vaadin/hilla-file-router/runtime.js';
import { effect, signal } from '@vaadin/hilla-react-signals';
import { AppLayout, DrawerToggle, Icon, SideNav, SideNavItem } from '@vaadin/react-components';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

// Señal para el título del documento, utilizada por Vaadin
const documentTitleSignal = signal('');
effect(() => {
  document.title = documentTitleSignal.value;
});

// Publicar para que Vaadin pueda usarla
(window as any).Vaadin.documentTitleSignal = documentTitleSignal;

// Definición de la interfaz para los elementos del menú
interface MenuItem {
  to: string; // La ruta a la que navega el elemento del menú
  title: string; // El texto que se muestra en el menú
  icon?: string; // Opcional: la ruta del icono (ej. 'line-awesome/svg/home-solid.svg')
}

export default function MainLayout() { // Este componente será renombrado a @layout.tsx
  const currentTitle = useViewConfig()?.title; // Obtiene el título de la vista actual
  const navigate = useNavigate(); // Hook para la navegación programática
  const location = useLocation(); // Hook para obtener la ubicación actual

  // Estados para el modo oscuro y el modo vintage
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.hasAttribute('theme'));
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // Efecto para actualizar el título del documento cuando cambia la vista
  useEffect(() => {
    if (currentTitle) {
      documentTitleSignal.value = currentTitle;
    }
  }, [currentTitle]);

  // Función para alternar el modo oscuro
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

  // Definición manual de los elementos del menú
  const menuItems: MenuItem[] = [
    // --- Páginas para Clientes ---
    { to: '/', title: 'Inicio', icon: 'line-awesome/svg/home-solid.svg' },
    { to: '/book-a-car', title: 'Buscar Coches / Reservar', icon: 'line-awesome/svg/car-solid.svg' },
    { to: '/my-bookings', title: 'Mis Reservas', icon: 'line-awesome/svg/calendar-check-solid.svg' },
    { to: '/locations', title: 'Delegaciones / Ubicaciones', icon: 'line-awesome/svg/map-marker-alt-solid.svg' },
    { to: '/leisure-activities', title: 'Actividades de Ocio', icon: 'line-awesome/svg/gamepad-solid.svg' },

    // --- Páginas de Administración (Agrupadas) ---
    { to: '/admin/dashboard', title: 'Panel de Administración', icon: 'line-awesome/svg/tachometer-alt-solid.svg' },
    // Nuevas rutas para las secciones de gestión
    { to: '/admin/cars', title: 'Gestión de Coches', icon: 'line-awesome/svg/car-side-solid.svg' },
    { to: '/admin/bookings', title: 'Gestión de Reservas', icon: 'line-awesome/svg/book-solid.svg' },
    { to: '/admin/delegations', title: 'Gestión de Delegaciones', icon: 'line-awesome/svg/building-solid.svg' },
    { to: '/admin/users', title: 'Gestión de Usuarios', icon: 'line-awesome/svg/user-cog-solid.svg' }, // Icono más apropiado para gestión de usuarios
  ];

  return (
    <AppLayout primarySection="drawer">
      {/* Sección del cajón (Drawer) con el menú de navegación */}
      <div slot="drawer" className="flex flex-col justify-between h-full p-m">
        <header className="flex flex-col gap-m">
          <span className="font-semibold text-l">My App</span>
          <SideNav onNavigate={({ path }) => navigate(path!)} location={location}>
            {menuItems.map((item) => (
              <SideNavItem path={item.to} key={item.to}>
                {item.icon ? <Icon src={item.icon} slot="prefix"></Icon> : <></>}
                {item.title}
              </SideNavItem>
            ))}
          </SideNav>
        </header>
      </div>

      {/* Sección de la barra de navegación superior (Navbar) */}
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

      {/* Contenido principal de la aplicación, donde se renderizan las vistas */}
      <Suspense>
        <Outlet />
      </Suspense>

      {/* Elemento tv-static para el efecto visual del modo vintage (controlado por CSS) */}
      <div className="tv-static"></div>
    </AppLayout>
  );
}
