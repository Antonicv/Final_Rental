import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react'; // Importar useEffect y useState

export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'Pagina de Inicio',
};

export default function HomeView() {
  // Estado para el modo vintage, se leerá del elemento <html>
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // useEffect para escuchar cambios en la clase del elemento <html>
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      // Actualiza el estado isVintageMode basado en si la clase 'vintage-mode' está presente en <html>
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    // Observa cambios en los atributos (específicamente la clase) del elemento <html>
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });

    // Realiza una comprobación inicial por si la clase ya está presente al montar el componente
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));

    // Función de limpieza para desconectar el observador cuando el componente se desmonte
    return () => observer.disconnect();
  }, []); // El array de dependencias vacío asegura que el observador se configure solo una vez

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      {/* Lógica condicional para la imagen */}
      <img
        style={{ width: '200px' }}
        src={isVintageMode ? "images/empty-plant.png" : "images/NewLogo.webp"}
        alt={isVintageMode ? "Empty Plant" : "New Logo"}
        onError={(e) => {
          // Fallback para imágenes no encontradas
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Image+Not+Found';
        }}
      />
      {/* Lógica condicional para el título principal */}
      <h2>
        {isVintageMode ? "Vehículos a Pupilaje" : "Tu Próximo Vehículo te Espera"}
      </h2>
      {/* Lógica condicional para el subtítulo */}
      {isVintageMode ? ( // Si es modo vintage, usa <p> con formato
        <p>
          <strong>Automóviles de postín para caballeros de distinción.</strong> <br/> ¿Desea usted conducir como un prócer, pero pagar como un jornalero? En nuestra casa de alquiler, el porvenir rueda sobre cuatro ruedas.
          <br/>
          Súbase, arranque, deslúmbrese… y luego lo devuelve, claro. Motores modernos para espíritus de aventureros, con los últimos, últimos avances del progreso mecánico.<br/><strong> Alquile hoy, presuma mañana. Y repita pasado.</strong>
        </p>
      ) : ( // Si es modo normal, usa <h3> original
        <h3>
          Explora nuestra amplia selección de vehículos modernos y de alto rendimiento.
        </h3>
      )}
    </div>
  );
}
