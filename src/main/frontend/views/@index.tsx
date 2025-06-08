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

// Función de ayuda para normalizar cadenas para nombres de archivo
// Elimina acentos, diacríticos, reemplaza espacios con guiones bajos y limpia caracteres no permitidos.
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD") // Normaliza a la forma de descomposición canónica (ej. 'ë' -> 'e' + '¨')
    .replace(/[\u0300-\u036f]/g, "") // Elimina las marcas diacríticas (acentos, diéresis, etc.)
    .replace(/\s+/g, '_') // Reemplaza uno o más espacios con un guion bajo
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Elimina cualquier carácter que no sea alfanumérico, guion bajo, punto o guion
}

// Función de guarda de tipo para asegurar que el objeto Car tiene propiedades 'make', 'model' y 'year'
function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}


// Componente principal de la vista Home
export default function HomeView() {
  const navigate = useNavigate(); // Hook para la navegación

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
  // Estado para el ID de la delegación seleccionada en el Select
  const [selectedDelegationId, setSelectedDelegationId] = useState<string | null>(null);
  // Estado para el nombre/ciudad de la delegación seleccionada (para mostrar en la UI)
  const [selectedDelegationLabel, setSelectedDelegationLabel] = useState<string | null>(null);
  // Estado para las opciones del Select de delegaciones, obtenidas del backend
  const [delegationOptions, setDelegationOptions] = useState<{ value: string; label: string; city: string }[]>([]);
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
  setSearchMessage(null);
  if (startDate && endDate && selectedDelegationId) {
    try {
     const carsResult = await DelegationEndpoint.getAvailableCars(selectedDelegationId, startDate, endDate, isVintageMode);

// Filtrar los undefined antes de actualizar el estado
const cars = (carsResult ?? []).filter((car): car is Car => car !== undefined && car !== null);

setAvailableCarsResult(cars);
      setIsCalendarOpen(false);
      setIsResultsDialogOpen(true);

      if (cars.length === 0) {
        setSearchMessage('No se encontraron coches disponibles para la delegación y fechas seleccionadas.');
      } else {
        setSearchMessage(null);
      }
    } catch (error) {
      console.error('Error al buscar disponibilidad:', error);
      setAvailableCarsResult([]);
      setIsCalendarOpen(false);
      setIsResultsDialogOpen(true);
      setSearchMessage('Hubo un error al buscar disponibilidad. Por favor, inténtalo de nuevo más tarde.');
    }
  } else {
    setSearchMessage('Por favor, selecciona ambas fechas y una delegación.');
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
    navigate('/my-bookings'); // Navega a la nueva ruta /my-bookings
  };

  // Función para generar URL de imagen de placeholder o API externa
  const getCarThumbnailImageUrl = (car: Car) => {
  // Verificamos que car tenga las propiedades necesarias
  if (!car.make || !car.model) {
    // Retornar una imagen por defecto o placeholder si no tiene datos
    return 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image';
  }

  const isCurrentCarVintage = car.year < 2000;

  if (isVintageMode && isCurrentCarVintage) {
    const localImagePath = `/images/${sanitizeFilenamePart(car.make)}_${sanitizeFilenamePart(car.model)}.webp`;
    console.log("DEBUG: Generated local vintage car image URL:", localImagePath);
    return localImagePath;
  } else {
    const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make)}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
    console.log("DEBUG: Generated external modern car image URL:", imageUrl);
    return imageUrl;
  }
};


  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      {/* Lógica condicional para la imagen principal */}
      <img
        style={{ width: '200px' }}
        src={isVintageMode ? "/images/empty-plant.png" : "/images/NewLogo.webp"}
        alt={isVintageMode ? "Empty Plant" : "New Logo"}
        onError={(e) => {
          console.error("ERROR: Failed to load main image:", e.currentTarget.src, e); // Log de error
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

      {/* Contenedor para los botones "Ver Disponibilidad" y "Ver Todas las Reservas" */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        {/* Botón para abrir el diálogo del calendario */}
        <Button
          theme="primary"
          onClick={() => {
            setIsCalendarOpen(true);
            setSearchMessage(null); // Limpia mensajes de búsqueda anteriores
            setAvailableCarsResult(null); // Limpia resultados anteriores
          }}
        >
          Ver Disponibilidad
        </Button>

        {/* Botón: Ver Todas las Reservas */}
        <Button
          theme="primary" // Cambiado a primary para el mismo estilo
          onClick={handleViewAllBookings} // Llama a la función de navegación
        >
          Ver Todas las Reservas
        </Button>
      </div>

      {/* Mensaje de búsqueda (errores/advertencias) - se muestra aquí si los diálogos no están abiertos */}
      {searchMessage && !isResultsDialogOpen && (
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
                // Asegúrate de que el coche tiene las propiedades necesarias antes de renderizar la imagen
                isCarWithMakeAndModel(car) && (
                  <li key={`${car.delegationId}-${car.operation}-${car.make}-${car.model}`} style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img
                      src={getCarThumbnailImageUrl(car)} // Usamos la nueva función para la URL
                      alt={`${car.make} ${car.model}`}
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                      onError={(e) => {
                        console.error("ERROR: Failed to load car thumbnail image:", e.currentTarget.src, e); // Log de error
                        (e.target as HTMLImageElement).src = 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image';
                      }}
                    />
                    <span>
                      <strong>{car.make} {car.model}</strong> ({car.year}) - {car.color} - {car.price} €
                    </span>
                    <Button theme="primary" onClick={() => handleBookCar(car)} style={{ marginTop: '1rem' }}>
                      Reservar
                    </Button>
                  </li>
                )
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
    </div>
  );
}
