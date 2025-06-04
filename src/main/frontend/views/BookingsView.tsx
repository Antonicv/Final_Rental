import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Booking from 'Frontend/generated/dev/renting/delegations/Booking';

// Configuración de la vista para el router de Hilla
export const config: ViewConfig = {
  // El 'order' define la posición en el menú de navegación
  // El 'icon' es el icono de Line Awesome para esta vista
  // El 'title' es el texto que se muestra en el menú
  menu: { order: 1, icon: 'line-awesome/svg/calendar-check-solid.svg', title: 'Mis Reservas' },
  title: 'Reservas' // Título que aparecerá en la pestaña del navegador
};

// Componente principal de la vista de Reservas
export default function BookingsView() {
  // Estado para almacenar todas las reservas obtenidas del backend
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  // Estado para indicar si los datos están cargando
  const [loading, setLoading] = useState(true);
  // Estado para almacenar mensajes de error
  const [error, setError] = useState<string | null>(null);

  // useEffect para cargar todas las reservas al montar el componente
  // Se ejecuta solo una vez (gracias al array de dependencias vacío [])
  useEffect(() => {
    const fetchBookings = async () => {
      console.log("DEBUG (BookingsView): Iniciando la carga de reservas...");
      try {
        setLoading(true); // Iniciar estado de carga
        setError(null); // Limpiar errores previos
        // Llama al endpoint del backend para obtener todas las reservas
        const bookings = await DelegationEndpoint.getAllBookings();
        console.log("DEBUG (BookingsView): Reservas recibidas del backend:", bookings);

        // Asegurarse de que 'bookings' es un array y no es null/undefined
        const validBookings = Array.isArray(bookings) ? bookings : [];

        setAllBookings(validBookings); // Actualiza el estado con las reservas
        if (validBookings.length === 0) {
          setError('No hay reservas registradas.'); // Mensaje si no hay reservas
          console.log("DEBUG (BookingsView): No se encontraron reservas.");
        } else {
          setError(null); // Limpiar cualquier error anterior
          console.log(`DEBUG (BookingsView): Se encontraron ${validBookings.length} reservas.`);
        }
      } catch (e) {
        console.error('ERROR (BookingsView): Error al obtener todas las reservas:', e); // Log del error en consola
        setError('Hubo un error al cargar tus reservas. Por favor, inténtalo de nuevo más tarde.'); // Mensaje de error para el usuario
        setAllBookings([]); // Limpiar la lista en caso de error
      } finally {
        setLoading(false); // Finalizar estado de carga
        console.log("DEBUG (BookingsView): Carga de reservas finalizada.");
      }
    };

    fetchBookings(); // Ejecutar la función de carga
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Mis Reservas</h2>

      {/* Mostrar mensaje de carga */}
      {loading && (
        <p className="text-gray-600">Cargando reservas...</p>
      )}

      {/* Mostrar mensaje de error */}
      {error && (
        <div className="text-red-600 font-bold mt-4">{error}</div>
      )}

      {/* Mostrar mensaje si no hay reservas y no hay error ni carga */}
      {!loading && !error && allBookings.length === 0 && (
        <p className="text-gray-600 mt-4">No tienes reservas registradas.</p>
      )}

      {/* Mostrar la lista de reservas si no está cargando, no hay error y hay reservas */}
      {!loading && !error && allBookings.length > 0 && (
        <div className="w-full max-w-2xl text-left">
          <ul className="list-none p-0">
            {allBookings.map(booking => (
              // Cada reserva es un elemento de lista con un estilo agradable
              <li key={booking.bookingId} className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-lg font-semibold text-gray-800">
                  <span className="text-blue-600">Coche ID:</span> {booking.carId}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Delegación ID:</span> {booking.delegationId}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Fechas:</span> {booking.startDate} a {booking.endDate}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Usuario:</span> {booking.userId}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Fecha de Reserva:</span> {booking.bookingDate}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
