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

  const toggleVintageMode = () => {
    document.documentElement.classList.toggle('vintage-mode');
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
            Vintage Mode
          </button>
        </div>
      </div>

      <Suspense>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}