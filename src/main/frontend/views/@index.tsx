import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button'; // Importar Button
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog
import { DatePicker } from '@vaadin/react-components/DatePicker'; // Importar DatePicker
import { TextField } from '@vaadin/react-components/TextField'; // Importar TextField para la delegación

export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'Pagina de Inicio',
};

export default function HomeView() {
  // Estado para el modo vintage, se leerá del elemento <html>
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estado para controlar la visibilidad del diálogo del calendario
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Estados para las fechas seleccionadas
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  // Estado para la delegación seleccionada (por ahora un TextField simple)
  const [selectedDelegation, setSelectedDelegation] = useState<string>('');

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

  // Función para manejar la búsqueda de disponibilidad
  const handleAvailabilitySearch = () => {
    if (startDate && endDate && selectedDelegation) {
      console.log(`Buscando disponibilidad para la delegación: ${selectedDelegation}`);
      console.log(`Desde: ${startDate} Hasta: ${endDate}`);
      // Aquí iría la lógica para llamar al backend
      // Por ejemplo: DelegationEndpoint.getAvailableCarsByDates(selectedDelegation, startDate, endDate);
      setIsCalendarOpen(false); // Cerrar el diálogo después de la búsqueda
      // Implementar la lógica para mostrar los resultados de la búsqueda
    } else {
      console.warn('Por favor, selecciona ambas fechas y la delegación.');
      // Aquí podrías mostrar un mensaje al usuario en la UI
    }
  };

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
          Automóviles de postín para caballeros de distinción. ¿Desea usted conducir como un prócer, pero pagar como un jornalero? En nuestra casa de alquiler, el porvenir rueda sobre cuatro ruedas.
          <br/>
          <strong>Súbase, arranque, deslúmbrese… y luego lo devuelve, claro. Motores modernos para espíritus de aventureros, con los últimos, últimos avances del progreso mecánico. Alquile hoy, presuma mañana. Y repita pasado.</strong>
        </p>
      ) : ( // Si es modo normal, usa <h3> original
        <h3>
          Explora nuestra amplia selección de vehículos modernos y de alto rendimiento.
        </h3>
      )}

      {/* Botón para abrir el calendario */}
      <Button
        theme="primary"
        onClick={() => setIsCalendarOpen(true)}
        style={{ marginTop: '2rem' }}
      >
        Ver Disponibilidad
      </Button>

      {/* Diálogo del calendario */}
      <Dialog
        headerTitle="Seleccionar Fechas y Delegación"
        opened={isCalendarOpen}
        onOpenedChanged={({ detail }) => setIsCalendarOpen(detail.value)}
        overlayClass="custom-dialog-overlay" // Clase para personalizar el overlay si es necesario
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          <DatePicker
            label="Fecha de Inicio"
            value={startDate || ''}
            onValueChanged={({ detail }) => setStartDate(detail.value)}
            style={{ width: '100%' }}
          />
          <DatePicker
            label="Fecha de Fin"
            value={endDate || ''}
            onValueChanged={({ detail }) => setEndDate(detail.value)}
            style={{ width: '100%' }}
          />
          <TextField
            label="Delegación"
            value={selectedDelegation}
            onValueChanged={({ detail }) => setSelectedDelegation(detail.value)}
            placeholder="Ej: Madrid, Barcelona"
            style={{ width: '100%' }}
          />
          <Button theme="primary" onClick={handleAvailabilitySearch} style={{ marginTop: '1rem' }}>
            Buscar Disponibilidad
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
