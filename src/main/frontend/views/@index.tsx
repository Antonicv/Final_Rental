import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button'; // Importar Button
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog
import { DatePicker } from '@vaadin/react-components/DatePicker'; // Importar DatePicker
import { Select } from '@vaadin/react-components/Select'; // Importar Select para las delegaciones
import { DelegationEndpoint } from 'Frontend/generated/endpoints'; // Importar DelegationEndpoint
import Car from 'Frontend/generated/dev/renting/delegations/Car'; // Importar Car para tipado
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Importar Delegation para tipado
import Booking from 'Frontend/generated/dev/renting/delegations/Booking'; // Importar el tipo Booking
import { useNavigate } from 'react-router-dom'; // Importar useNavigate para la navegación

// Configuración de la vista para el router de Hilla
export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'home'
};

// Componente principal de la vista Home
export default function HomeView() {
  const navigate = useNavigate(); // Hook para la navegación

  // Estado para controlar si el modo vintage está activo (leído del elemento <html>)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estado para controlar la visibilidad del diálogo del calendario
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Estado para controlar la visibilidad del diálogo de resultados de coches
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  // Eliminado: isBookingsDialogOpen ya no es necesario aquí

  // Estados para las fechas seleccionadas en el DatePicker
  const [startDate, setStartDate] = useState<string | null>(null);
  // Estados para las fechas seleccionadas en el DatePicker
  const [endDate, setEndDate] = useState<string | null>(null);
  // Estado para el ID de la delegación seleccionada en el Select
  const [selectedDelegationId, setSelectedDelegationId] = useState<string | null>(null);
  // Estado para el nombre/ciudad de la delegación seleccionada (para mostrar en la UI)
  const [selectedDelegationLabel, setSelectedDelegationLabel] = useState<string | null>(null);
  // Estado para las opciones del Select de delegaciones, obtenidas del backend
  const [delegationOptions, setDelegationOptions] = useState<{ value: string; label: string; city: string }[]>([]);
  // Estado para almacenar los coches disponibles después de la búsqueda
  const [availableCarsResult, setAvailableCarsResult] = useState<Car[] | null>(null);
  // Eliminado: allBookings ya no es necesario aquí
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
            value: d.delegationId || '', // El valor de la opción será el delegationId
            label: d.name || d.city || '', // La etiqueta visible será el nombre o la ciudad
            city: d.city || '' // Guardamos la ciudad también si la necesitamos para mostrar
          }));
        setDelegationOptions(options); // Actualiza el estado con las opciones de delegación
      })
      .catch(error => {
        console.error("Error fetching delegations:", error); // Log de error si falla la obtención
      });
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez al montar

  // Manejador para el botón "Buscar Disponibilidad" dentro del diálogo
  const handleAvailabilitySearch = async () => {
    setSearchMessage(null); // Limpiar mensajes anteriores
    // Verifica que se hayan seleccionado fechas y una delegación
    if (startDate && endDate && selectedDelegationId) { // Ahora verificamos selectedDelegationId
      console.log(`Buscando disponibilidad para la delegación ID: ${selectedDelegationId}`);
      console.log(`Desde: ${startDate} Hasta: ${endDate}`);

      // Actualizar el label de la delegación seleccionada para mostrarlo en el diálogo de resultados
      const currentDelegation = delegationOptions.find(opt => opt.value === selectedDelegationId);
      setSelectedDelegationLabel(currentDelegation ? currentDelegation.label : null);

      try {
        // Llama al nuevo endpoint del backend con delegationId
        const cars = await DelegationEndpoint.getAvailableCars(selectedDelegationId, startDate, endDate);
        setAvailableCarsResult(cars); // Almacena los coches disponibles en el estado
        setIsCalendarOpen(false); // Cierra el diálogo del calendario
        setIsResultsDialogOpen(true); // Abre el diálogo de resultados
        if (cars.length === 0) {
          setSearchMessage('No se encontraron coches disponibles para la delegación y fechas seleccionadas.');
        } else {
          setSearchMessage(null); // Limpiar mensaje si hay resultados
        }
      } catch (error) {
        console.error('Error al buscar disponibilidad:', error); // Log de error si falla la búsqueda
        setAvailableCarsResult([]); // En caso de error, la lista de resultados estará vacía
        setIsCalendarOpen(false); // Cierra el diálogo del calendario
        setIsResultsDialogOpen(true); // Abre el diálogo de resultados para mostrar el mensaje de error
        setSearchMessage('Hubo un error al buscar disponibilidad. Por favor, inténtalo de nuevo más tarde.');
      }
    } else {
      setSearchMessage('Por favor, selecciona ambas fechas y una delegación.'); // Advertencia si faltan datos
      // Mantener el diálogo del calendario abierto para que el usuario complete los campos
    }
  };

  // Manejador para reservar un coche
  const handleBookCar = async (car: Car) => {
    if (!selectedDelegationId || !startDate || !endDate) {
      setSearchMessage('Error: Las fechas o la delegación no están seleccionadas para la reserva.');
      setIsResultsDialogOpen(false); // Cierra el diálogo de resultados si hay un error de datos
      return;
    }

    const userId = "USER#001"; // ID de usuario fijo para el ejemplo
    const carUniqueId = car.operation; // El ID único del coche es su 'operation'

    if (!carUniqueId) {
      setSearchMessage('Error: ID de coche no disponible para reservar.');
      // No cerrar el diálogo de resultados para que el usuario vea el mensaje
      return;
    }

    const booking: Booking = {
      carId: carUniqueId,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
      delegationId: selectedDelegationId, // Usamos el ID de la delegación seleccionada
      bookingId: '', // Será generado por el backend
      bookingDate: '' // Será generado por el backend
    };

    try {
      await DelegationEndpoint.saveBooking(booking);
      setSearchMessage(`Coche ${car.make} ${car.model} reservado con éxito.`);
      // Opcional: Volver a buscar disponibilidad para actualizar la lista (si la reserva afecta la disponibilidad inmediata)
      // Esto es importante para que el coche reservado desaparezca de la lista
      await handleAvailabilitySearch(); // Re-ejecutar la búsqueda para actualizar la lista
      // No cerramos el diálogo de resultados automáticamente para que el usuario vea el mensaje de éxito
    } catch (error) {
      console.error('Error al reservar el coche:', error);
      setSearchMessage('Error al reservar el coche. Por favor, inténtalo de nuevo.');
      // Mantener el diálogo de resultados abierto para mostrar el mensaje de error
    }
  };

  // Manejador para navegar a la página de reservas
  const handleViewAllBookings = () => {
    navigate('/BookingsView'); // Navega a la nueva ruta /BookingsView (nombre del archivo)
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      {/* Lógica condicional para la imagen principal */}
      <img
        style={{ width: '200px' }}
        src={isVintageMode ? "images/empty-plant.png" : "images/NewLogo.webp"}
        alt={isVintageMode ? "Empty Plant" : "New Logo"}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Image+Not+Found';
        }}
      />
      {/* Lógica condicional para el título principal (H2) */}
      <h2>
        {isVintageMode ? "Vehículos a Pupilaje" : "Tu Próximo Vehículo te Espera"}
      </h2>
      {/* Lógica condicional para el subtítulo (H3 o P con formato) */}
      {isVintageMode ? (
        <p>
          Automóviles de postín para caballeros de distinción. ¿Desea usted conducir como un prócer, pero pagar como un jornalero? En nuestra casa de alquiler, el porvenir rueda sobre cuatro ruedas.
          <br/>
          <strong>Súbase, arranque, deslúmbrese… y luego lo devuelve, claro. Motores modernos para espíritus de aventureros, con los últimos, últimos avances del progreso mecánico. Alquile hoy, presuma mañana. Y repita pasado.</strong>
        </p>
      ) : (
        <h3>
          Explora nuestra amplia selección de vehículos modernos y de alto rendimiento.
        </h3>
      )}

      {/* Botón para abrir el diálogo del calendario */}
      <Button
        theme="primary"
        onClick={() => {
          setIsCalendarOpen(true);
          setSearchMessage(null); // Limpia mensajes de búsqueda anteriores
          setAvailableCarsResult(null); // Limpia resultados anteriores
        }}
        style={{ marginTop: '2rem' }}
      >
        Ver Disponibilidad
      </Button>

      {/* NUEVO BOTÓN: Ver Todas las Reservas (ahora navega a una nueva página) */}
      <Button
        theme="secondary"
        onClick={handleViewAllBookings} // Llama a la función de navegación
        style={{ marginTop: '1rem' }}
      >
        Ver Todas las Reservas
      </Button>

      {/* Mensaje de búsqueda (errores/advertencias) - se muestra aquí si los diálogos no están abiertos */}
      {searchMessage && !isResultsDialogOpen && ( // Eliminado isBookingsDialogOpen de la condición
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          {searchMessage}
        </div>
      )}

      {/* Componente Dialog para el calendario y selección de delegación */}
      <Dialog
        headerTitle="Seleccionar Fechas y Delegación"
        opened={isCalendarOpen}
        onOpenedChanged={({ detail }) => setIsCalendarOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
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
          <Select
            label="Delegación"
            items={delegationOptions}
            value={selectedDelegationId || ''}
            onValueChanged={({ detail }) => setSelectedDelegationId(detail.value)}
            placeholder="Selecciona una delegación"
            style={{ width: '100%' }}
          />
          <Button theme="primary" onClick={handleAvailabilitySearch} style={{ marginTop: '1rem' }}>
            Buscar Disponibilidad
          </Button>
        </div>
      </Dialog>

      {/* Diálogo para mostrar los resultados de coches disponibles */}
      <Dialog
        headerTitle={`Coches Disponibles en ${selectedDelegationLabel || 'la delegación seleccionada'}`}
        opened={isResultsDialogOpen}
        onOpenedChanged={({ detail }) => {
          setIsResultsDialogOpen(detail.value);
          if (!detail.value) {
            setSearchMessage(null);
          }
        }}
        overlayClass="custom-dialog-overlay"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {searchMessage && (
            <p style={{ color: 'red', fontWeight: 'bold' }}>{searchMessage}</p>
          )}
          {availableCarsResult && availableCarsResult.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {availableCarsResult.map(car => (
                <li key={`${car.delegationId}-${car.operation}-${car.make}-${car.model}`} style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{car.make} {car.model}</strong> ({car.year}) - {car.color} - {car.price} €
                  </span>
                  <Button theme="primary" onClick={() => handleBookCar(car)} style={{ marginLeft: '1rem' }}>
                    Reservar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            !searchMessage && <p>No se encontraron coches disponibles para la delegación y fechas seleccionadas.</p>
          )}
          <Button theme="primary" onClick={() => setIsResultsDialogOpen(false)} style={{ marginTop: '1rem' }}>
            Cerrar
          </Button>
        </div>
      </Dialog>

      {/* Eliminado: El diálogo de "Todas las Reservas" ya no está aquí */}
    </div>
  );
}
