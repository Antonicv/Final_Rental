import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button'; // Importar Button
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog
import { DatePicker } from '@vaadin/react-components/DatePicker'; // Importar DatePicker
import { Select } from '@vaadin/react-components/Select'; // Importar Select para las delegaciones
import { DelegationEndpoint } from 'Frontend/generated/endpoints'; // Importar DelegationEndpoint
import Car from 'Frontend/generated/dev/renting/delegations/Car'; // Importar Car para tipado
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Importar Delegation para tipado

// Configuración de la vista para el router de Hilla
export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'home'
};

// Componente principal de la vista Home
export default function HomeView() {
  // Estado para controlar si el modo vintage está activo (leído del elemento <html>)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estado para controlar la visibilidad del diálogo del calendario
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Estado para controlar la visibilidad del diálogo de resultados de coches
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  // Estados para las fechas seleccionadas en el DatePicker
  const [startDate, setStartDate] = useState<string | null>(null);
  // Estados para las fechas seleccionadas en el DatePicker
  const [endDate, setEndDate] = useState<string | null>(null);
  // Estado para la ciudad de la delegación seleccionada en el Select
  const [selectedDelegationCity, setSelectedDelegationCity] = useState<string>('');
  // Estado para las opciones del Select de delegaciones, obtenidas del backend
  const [delegationOptions, setDelegationOptions] = useState<{ value: string; label: string }[]>([]);
  // Estado para almacenar los coches disponibles después de la búsqueda
  const [availableCarsResult, setAvailableCarsResult] = useState<Car[] | null>(null);
  // Estado para mensajes de error o advertencia en la UI
  const [searchMessage, setSearchMessage] = useState<string | null>(null);


  // useEffect para escuchar cambios en la clase 'vintage-mode' del elemento <html>
  // Esto permite que HomeView reaccione a la activación/desactivación del modo vintage desde MainLayout.
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      // Actualiza el estado isVintageMode si la clase 'vintage-mode' cambia
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    // Observa cambios en los atributos del elemento <html>, específicamente en la clase
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });

    // Realiza una comprobación inicial del estado del modo vintage al montar el componente
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));

    // Función de limpieza para desconectar el observador cuando el componente se desmonte
    return () => observer.disconnect();
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez al montar

  // useEffect para cargar las delegaciones disponibles desde el backend al montar el componente
  useEffect(() => {
    DelegationEndpoint.getAllProfileDelegations()
      .then(delegations => {
        // FIX: Asegurarse de que 'delegations' no sea undefined antes de mapear
        // y que cada 'd' dentro de 'delegations' no sea undefined.
        const options = (delegations ?? [])
          .filter((d): d is Delegation => d !== undefined && d !== null) // Filtra elementos nulos/undefined
          .map(d => ({
            value: d.city || '', // El valor de la opción será la ciudad de la delegación
            label: d.name || d.city || '' // La etiqueta visible será el nombre o la ciudad
          }));
        setDelegationOptions(options); // Actualiza el estado con las opciones de delegación
      })
      .catch(error => {
        console.error("Error fetching delegations:", error); // Log de error si falla la obtención
      });
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez al montar

  // Manejador para el botón "Buscar Disponibilidad" dentro del diálogo
  const handleAvailabilitySearch = async () => {
    setSearchMessage(null); // Clear previous messages
    // Verifica que se hayan seleccionado fechas y una delegación
    if (startDate && endDate && selectedDelegationCity) {
      console.log(`Buscando disponibilidad para la delegación: ${selectedDelegationCity}`);
      console.log(`Desde: ${startDate} Hasta: ${endDate}`);

      try {
        // Llama al nuevo endpoint del backend para obtener coches disponibles
        const cars = await DelegationEndpoint.getAvailableCars(selectedDelegationCity, startDate, endDate);
        setAvailableCarsResult(cars); // Almacena los coches disponibles en el estado
        setIsCalendarOpen(false); // Cierra el diálogo del calendario
        setIsResultsDialogOpen(true); // Abre el diálogo de resultados
        if (cars.length === 0) {
          setSearchMessage('No se encontraron coches disponibles para la delegación y fechas seleccionadas.');
        }
      } catch (error) {
        console.error('Error al buscar disponibilidad:', error); // Log de error si falla la búsqueda
        setAvailableCarsResult([]); // En caso de error, la lista de resultados estará vacía
        setIsCalendarOpen(false); // Cierra el diálogo del calendario
        setIsResultsDialogOpen(true); // Abre el diálogo de resultados para mostrar el mensaje de error
        setSearchMessage('Hubo un error al buscar disponibilidad. Por favor, inténtalo de nuevo más tarde.');
      }
    } else {
      setSearchMessage('Por favor, selecciona ambas fechas y la delegación.'); // Advertencia si faltan datos
      // Mantener el diálogo del calendario abierto para que el usuario complete los campos
    }
  };

  // Función para descargar los resultados en formato JSON (eliminada del botón, pero se mantiene la función por si se necesita en otro contexto)
  const handleDownloadJson = () => {
    if (availableCarsResult && availableCarsResult.length > 0) {
      const jsonString = JSON.stringify(availableCarsResult, null, 2); // Formatea el JSON con indentación
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coches_disponibles_${selectedDelegationCity}_${startDate}_${endDate}.json`; // Nombre del archivo
      document.body.appendChild(a); // Añadir al DOM temporalmente
      a.click(); // Simular clic para descargar
      document.body.removeChild(a); // Eliminar del DOM
      URL.revokeObjectURL(url); // Liberar el objeto URL
    } else {
      console.warn('No hay coches disponibles para descargar en JSON.');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-box-border">
      {/* Lógica condicional para la imagen principal */}
      <img
        style={{ width: '200px' }}
        src={isVintageMode ? "images/empty-plant.png" : "images/NewLogo.webp"}
        alt={isVintageMode ? "Empty Plant" : "New Logo"}
        onError={(e) => {
          // Fallback para imágenes no encontradas, mostrando un placeholder
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Image+Not+Found';
        }}
      />
      {/* Lógica condicional para el título principal (H2) */}
      <h2>
        {isVintageMode ? "Vehículos a Pupilaje" : "Tu Próximo Vehículo te Espera"}
      </h2>
      {/* Lógica condicional para el subtítulo (H3 o P con formato) */}
      {isVintageMode ? ( // Si el modo vintage está activo, usa un párrafo con formato
        <p>
          Automóviles de postín para caballeros de distinción. ¿Desea usted conducir como un prócer, pero pagar como un jornalero? En nuestra casa de alquiler, el porvenir rueda sobre cuatro ruedas.
          <br/> {/* Salto de línea */}
          <strong>Súbase, arranque, deslúmbrese… y luego lo devuelve, claro. Motores modernos para espíritus de aventureros, con los últimos, últimos avances del progreso mecánico. Alquile hoy, presuma mañana. Y repita pasado.</strong>
        </p>
      ) : ( // Si el modo normal está activo, usa el H3 original
        <h3>
          Explora nuestra amplia selección de vehículos modernos y de alto rendimiento.
        </h3>
      )}

      {/* Botón para abrir el diálogo del calendario */}
      <Button
        theme="primary"
        onClick={() => {
          setIsCalendarOpen(true); // Abre el diálogo
          setSearchMessage(null); // Limpia mensajes de búsqueda anteriores
        }}
        style={{ marginTop: '2rem' }} // Margen superior para separación
      >
        Ver Disponibilidad
      </Button>

      {/* Mensaje de búsqueda (errores/advertencias) */}
      {searchMessage && (
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          {searchMessage}
        </div>
      )}

      {/* Componente Dialog para el calendario y selección de delegación */}
      <Dialog
        headerTitle="Seleccionar Fechas y Delegación" // Título del diálogo
        opened={isCalendarOpen} // Controla si el diálogo está abierto
        onOpenedChanged={({ detail }) => setIsCalendarOpen(detail.value)} // Maneja el cierre del diálogo (ej. clic fuera)
        overlayClass="custom-dialog-overlay" // Clase CSS opcional para personalizar el overlay
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {/* Selector de Fecha de Inicio */}
          <DatePicker
            label="Fecha de Inicio" // Etiqueta del campo
            value={startDate || ''} // Valor actual del campo
            onValueChanged={({ detail }) => setStartDate(detail.value)} // Actualiza el estado al cambiar la fecha
            style={{ width: '100%' }} // Ancho completo
          />
          {/* Selector de Fecha de Fin */}
          <DatePicker
            label="Fecha de Fin" // Etiqueta del campo
            value={endDate || ''} // Valor actual del campo
            onValueChanged={({ detail }) => setEndDate(detail.value)} // Actualiza el estado al cambiar la fecha
            style={{ width: '100%' }} // Ancho completo
          />
          {/* Selector de Delegación (usando el componente Select) */}
          <Select
            label="Delegación" // Etiqueta del campo
            items={delegationOptions} // Opciones cargadas del backend
            value={selectedDelegationCity} // Valor actual seleccionado
            onValueChanged={({ detail }) => setSelectedDelegationCity(detail.value)} // Actualiza el estado al cambiar la selección
            placeholder="Selecciona una delegación" // Texto de placeholder
            style={{ width: '100%' }} // Ancho completo
          />
          {/* Botón para iniciar la búsqueda de disponibilidad */}
          <Button theme="primary" onClick={handleAvailabilitySearch} style={{ marginTop: '1rem' }}>
            Buscar Disponibilidad
          </Button>
        </div>
      </Dialog>

      {/* NUEVO: Diálogo para mostrar los resultados de coches disponibles */}
      <Dialog
        headerTitle={`Coches Disponibles en ${selectedDelegationCity}`}
        opened={isResultsDialogOpen}
        onOpenedChanged={({ detail }) => setIsResultsDialogOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {searchMessage && ( // Muestra el mensaje de error/no encontrados dentro del diálogo de resultados
            <p style={{ color: 'red', fontWeight: 'bold' }}>{searchMessage}</p>
          )}
          {availableCarsResult && availableCarsResult.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {availableCarsResult.map(car => (
                <li key={`${car.delegationId}-${car.operation}-${car.make}-${car.model}`} style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem' }}>
                  <strong>{car.make} {car.model}</strong> ({car.year}) - {car.color} - {car.price} €
                </li>
              ))}
            </ul>
          ) : (
            // No se muestra este mensaje si searchMessage ya está presente
            !searchMessage && <p>No se encontraron coches disponibles para la delegación y fechas seleccionadas.</p>
          )}
          <Button theme="primary" onClick={() => setIsResultsDialogOpen(false)} style={{ marginTop: '1rem' }}>
            Cerrar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
