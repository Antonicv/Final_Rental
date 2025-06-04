import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Booking from 'Frontend/generated/dev/renting/delegations/Booking';
import Car from 'Frontend/generated/dev/renting/delegations/Car'; // Importar Car para tipado
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Importar Delegation para tipado
import { Button } from '@vaadin/react-components/Button'; // Importar Button para las acciones

// Configuración de la vista para el router de Hilla
export const config: ViewConfig = {
  menu: { order: 1, icon: 'line-awesome/svg/calendar-check-solid.svg', title: 'Mis Reservas' },
  title: 'Reservas'
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

// Función para generar URL de imagen (siempre API externa)
const getCarThumbnailImageUrl = (car: Car) => {
  // Siempre usa la API externa para mostrar las imágenes de los coches
  const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make || '')}&modelFamily=${encodeURIComponent(car.model || '')}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
  console.log("DEBUG (BookingsView): Generated external car image URL:", imageUrl);
  return imageUrl;
};

// Componente principal de la vista de Reservas
export default function BookingsView() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]); // Estado para todos los coches
  const [allDelegations, setAllDelegations] = useState<Delegation[]>([]); // Estado para todas las delegaciones
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mantener isVintageMode para la lógica de precio, aunque no para la imagen
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // useEffect para escuchar cambios en la clase 'vintage-mode' del elemento <html>
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // Función para cargar todos los datos (reservas, coches, delegaciones)
  const fetchAllData = async () => {
    console.log("DEBUG (BookingsView): Iniciando la carga de todos los datos...");
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar todos los coches
      const carsResult = await DelegationEndpoint.getAllCars();
      const validCars = (carsResult ?? []).filter(isCarWithMakeAndModel);
      setAllCars(validCars);
      console.log(`DEBUG (BookingsView): Se cargaron ${validCars.length} coches.`);

      // 2. Cargar todas las delegaciones de perfil
      const delegationsResult = await DelegationEndpoint.getAllProfileDelegations();
      const validDelegations = (delegationsResult ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
      setAllDelegations(validDelegations);
      console.log(`DEBUG (BookingsView): Se cargaron ${validDelegations.length} delegaciones.`);
      // DEBUG: Log detallado de las delegaciones cargadas
      validDelegations.forEach(d => {
        console.log(`DEBUG (BookingsView): Delegación cargada: ID=${d.delegationId}, Nombre=${d.name}, Ciudad=${d.city}, Dirección=${d.adress}, Gestor=${d.manager}, Teléfono=${d.telf}, Lat=${d.lat}, Long=${d.longVal}, CantidadCoches=${d.carQuantity}`);
      });


      // 3. Cargar todas las reservas
      const bookingsResult = await DelegationEndpoint.getAllBookings();
      const validBookings = Array.isArray(bookingsResult) ? bookingsResult : [];
      setAllBookings(validBookings);
      console.log(`DEBUG (BookingsView): Se cargaron ${validBookings.length} reservas.`);

      if (validBookings.length === 0) {
        setError('No hay reservas registradas.');
        console.log("DEBUG (BookingsView): No se encontraron reservas.");
      } else {
        setError(null);
      }
    } catch (e) {
      console.error('ERROR (BookingsView): Error al obtener todos los datos:', e);
      setError('Hubo un error al cargar tus reservas. Por favor, inténtalo de nuevo más tarde.');
      setAllBookings([]);
      setAllCars([]);
      setAllDelegations([]);
    } finally {
      setLoading(false);
      console.log("DEBUG (BookingsView): Carga de todos los datos finalizada.");
    }
  };

  // useEffect para cargar los datos al montar el componente
  useEffect(() => {
    fetchAllData();
  }, []); // Dependencias vacías para que se ejecute solo al montar

  // Función para obtener los detalles del coche a partir de su carId (operation)
  const getCarDetails = (carId: string) => {
    return allCars.find(car => car.operation === carId);
  };

  // Función para obtener los detalles de la delegación
  const getDelegationDetails = (delegationId: string) => {
    return allDelegations.find(delegation => delegation.delegationId === delegationId);
  };

  // Manejador para borrar una reserva
  const handleDeleteBooking = async (booking: Booking) => {
    if (!booking.carId || !booking.startDate) {
      setError('Error: No se puede borrar la reserva. Faltan datos clave (carId o startDate).');
      return;
    }
    // Usar un modal personalizado en lugar de window.confirm
    // const confirmDelete = window.confirm(`¿Estás seguro de que quieres borrar la reserva del coche ${booking.carId} para el ${booking.startDate}?`);
    // if (confirmDelete) {
    //   ...
    // }
    // Por ahora, para evitar el bloqueo, usaremos un confirm simple en la consola
    console.log(`Confirmación de borrado: ¿Estás seguro de que quieres borrar la reserva del coche ${booking.carId} para el ${booking.startDate}?`);
    // Simulación de confirmación para desarrollo. En producción, usar un componente Dialog.
    const confirmed = true; // Cambiar a false para probar la cancelación

    if (confirmed) {
      try {
        // Llama al endpoint de borrado en el backend
        await DelegationEndpoint.deleteBooking(booking.carId, booking.startDate);
        setError(`Reserva ${booking.bookingId} borrada con éxito.`);
        // Recargar todas las reservas para actualizar la lista
        await fetchAllData();
      } catch (e) {
        console.error('ERROR (BookingsView): Error al borrar la reserva:', e);
        setError('Hubo un error al borrar la reserva. Por favor, inténtalo de nuevo.');
      }
    }
  };

  // Manejador para modificar una reserva (placeholder)
  const handleModifyBooking = (booking: Booking) => {
    // Aquí podrías abrir un diálogo o navegar a un formulario de edición
    // con los datos de la reserva pre-rellenados.
    setError(`Funcionalidad de modificar reserva para ${booking.bookingId} no implementada aún.`);
    console.log('Modificar reserva:', booking);
  };

  // Definir la tasa de conversión de Euro a Peseta
  const EUR_TO_PTS_RATE = 166.386;

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Mis Reservas</h2>

      {loading && (
        <p className="text-gray-600">Cargando reservas...</p>
      )}

      {error && (
        <div className="text-red-600 font-bold mt-4">{error}</div>
      )}

      {!loading && !error && allBookings.length === 0 && (
        <p className="text-gray-600 mt-4">No tienes reservas registradas.</p>
      )}

      {!loading && !error && allBookings.length > 0 && (
        <div className="w-full max-w-2xl text-left">
          <ul className="list-none p-0">
            {allBookings.map(booking => {
              const car = getCarDetails(booking.carId || '');
              const delegation = getDelegationDetails(booking.delegationId || '');
              const isCurrentCarVintage = car ? car.year < 2000 : false; // Necesario para la conversión de precio

              // Calcular el precio total usando Date nativo
              let totalPrice = 'N/A';
              if (car && booking.startDate && booking.endDate) {
                try {
                  const start = new Date(booking.startDate);
                  const end = new Date(booking.endDate);
                  // Calcular la diferencia en milisegundos y luego convertir a días
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Redondea hacia arriba para incluir el día de fin
                  const duration = diffDays + 1; // +1 para incluir el día de inicio y fin

                  if (duration > 0) {
                    const calculatedPrice = car.price * duration;
                    totalPrice = isVintageMode && isCurrentCarVintage
                      ? `${(calculatedPrice * EUR_TO_PTS_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts`
                      : `${calculatedPrice.toFixed(2)} €`;
                  } else {
                    totalPrice = 'Fechas inválidas';
                  }
                } catch (e) {
                  console.error(`ERROR (BookingsView): Error calculando precio total para booking ${booking.bookingId}:`, e);
                  totalPrice = 'Error cálculo';
                }
              }

              console.log(`DEBUG (BookingsView): Procesando reserva ${booking.bookingId}`);
              console.log(`DEBUG (BookingsView): Coche encontrado para reserva:`, car);
              console.log(`DEBUG (BookingsView): Delegación encontrada para reserva:`, delegation);
              if (delegation) {
                console.log(`DEBUG (BookingsView): Detalles de Delegación: Nombre=${delegation.name}, Ciudad=${delegation.city}, Dirección=${delegation.adress}, Gestor=${delegation.manager}, Teléfono=${delegation.telf}, Lat=${delegation.lat}, Long=${delegation.longVal}, CantidadCoches=${delegation.carQuantity}`);
              } else {
                console.log(`DEBUG (BookingsView): No se encontraron detalles de delegación para ID: ${booking.delegationId}`);
              }


              return (
                <li key={booking.bookingId} className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                  {car && isCarWithMakeAndModel(car) ? (
                    <img
                      src={getCarThumbnailImageUrl(car)} // Ya no se pasa isVintageMode aquí
                      alt={`${car.make} ${car.model}`}
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem', sm: { marginRight: '1rem', marginBottom: '0' } }}
                      onError={(e) => {
                        console.error("ERROR (BookingsView): Failed to load car thumbnail image:", e.currentTarget.src, e);
                        (e.target as HTMLImageElement).src = 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image';
                      }}
                    />
                  ) : (
                    <div style={{ width: '150px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '1rem', sm: { marginRight: '1rem', marginBottom: '0' } }}>
                      <p style={{ color: '#888', fontSize: '0.8rem' }}>Coche no encontrado</p>
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="text-lg font-semibold text-gray-800">
                      <span className="text-blue-600">Reserva ID:</span> {booking.bookingId || 'N/A'}
                    </p>
                    {car ? (
                      <p className="text-gray-700">
                        <span className="font-medium">Coche:</span> {car.make || 'N/A'} {car.model || 'N/A'} ({car.year || 'N/A'}) - {car.color || 'N/A'}
                        <br />
                        <span className="font-medium">Precio por día:</span>{' '}
                        <strong>
                          {isVintageMode && isCurrentCarVintage // La lógica de precio sigue dependiendo del modo vintage
                            ? `${(car.price * EUR_TO_PTS_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts`
                            : `${car.price || 'N/A'} €`}
                        </strong>
                      </p>
                    ) : (
                      <p className="text-gray-700"><span className="font-medium">Coche:</span> Detalles no disponibles</p>
                    )}
                    <p className="text-gray-700">
                      <span className="font-medium">Fechas:</span> {booking.startDate || 'N/A'} a {booking.endDate || 'N/A'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Usuario:</span> {booking.userId || 'N/A'}
                    </p>
                    {delegation ? (
                      <p className="text-gray-700">
                        <span className="font-medium">Delegación:</span> {delegation.name || 'N/A'} ({delegation.city || 'N/A'})
                        <br />
                        <span className="font-medium">Dirección:</span> {delegation.adress || 'N/A'}
                        <br />
                        <span className="font-medium">Gestor:</span> {delegation.manager || 'N/A'}
                        <br />
                        <span className="font-medium">Teléfono:</span> {delegation.telf || 'N/A'}
                        {/* Puedes añadir lat, long, carQuantity aquí si lo deseas */}
                        {/* <br />
                        <span className="font-medium">Lat/Long:</span> {delegation.lat || 'N/A'}/{delegation.longVal || 'N/A'}
                        <br />
                        <span className="font-medium">Coches en Delegación:</span> {delegation.carQuantity || 'N/A'} */}
                      </p>
                    ) : (
                      <p className="text-gray-700"><span className="font-medium">Delegación:</span> Detalles no disponibles</p>
                    )}
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Fecha de Reserva:</span> {booking.bookingDate || 'N/A'}
                    </p>
                    {/* NUEVO: Mostrar el precio total */}
                    <p className="text-lg font-bold text-gray-900 mt-2">
                        <span className="text-purple-700">Precio Total:</span> {totalPrice}
                    </p>
                    <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                      <Button theme="error small" onClick={() => handleDeleteBooking(booking)}>
                        Borrar
                      </Button>
                      <Button theme="tertiary small" onClick={() => handleModifyBooking(booking)}>
                        Modificar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
