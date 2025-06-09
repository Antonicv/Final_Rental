import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button';
import { TextField } from '@vaadin/react-components/TextField';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Booking from 'Frontend/generated/dev/renting/delegations/Booking';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';
import html2pdf from 'html2pdf.js'; // IMPORTANTE: Importa la librería

// View configuration for the Hilla router
export const config: ViewConfig = {
  title: 'Mis Reservas',
};

// Helper function to sanitize strings for filename parts
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

// Type guard function to ensure a Car object has 'make', 'model', and 'year' properties
function isCarWithMakeAndModel(car: Car | undefined): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  return !!car && typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}

// Function to generate car image URL (local for vintage, external for modern)
const getCarThumbnailImageUrl = (car: Car) => {
  const isCurrentCarVintage = car.year < 2000;

  if (isCurrentCarVintage) {
    const localImagePath = `/images/${sanitizeFilenamePart(car.make || '')}_${sanitizeFilenamePart(car.model || '')}.webp`;
    console.log("DEBUG (BookingsView): Generated local vintage car image URL:", localImagePath);
    return localImagePath;
  } else {
    const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make || '')}&modelFamily=${encodeURIComponent(car.model || '')}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
    console.log("DEBUG (BookingsView): Generated external modern car image URL:", imageUrl);
    return imageUrl;
  }
};

// Main Bookings View Component
export default function BookingsView() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [allDelegations, setAllDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // isVintageMode is kept, but it no longer influences the currency symbol
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  const [filterUserId, setFilterUserId] = useState<string>('');


  // useEffect to listen for changes in the 'vintage-mode' class on the <html> element
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // Function to load all data (bookings, cars, delegations)
  const fetchAllData = async (userIdToFilter: string | null = null) => {
    console.log("DEBUG (BookingsView): Starting data fetch...");
    try {
      setLoading(true);
      setError(null);

      // 1. Load all cars
      const carsResult = await DelegationEndpoint.getAllCars();
      const validCars = (carsResult ?? []).filter(isCarWithMakeAndModel);
      setAllCars(validCars);
      console.log(`DEBUG (BookingsView): Loaded ${validCars.length} cars.`);

      // 2. Load all profile delegations
      const delegationsResult = await DelegationEndpoint.getAllProfileDelegations();
      const validDelegations = (delegationsResult ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
      setAllDelegations(validDelegations);
      console.log(`DEBUG (BookingsView): Loaded ${validDelegations.length} delegations.`);
      validDelegations.forEach(d => {
        console.log(`DEBUG (BookingsView): Delegation loaded: ID=${d.delegationId}, Name=${d.name}, City=${d.city}, Address=${d.adress}, Manager=${d.manager}, Phone=${d.telf}, Lat=${d.lat}, Long=${d.longVal}, CarQuantity=${d.carQuantity}`);
      });

      // 3. Load all bookings
      const bookingsResult = await DelegationEndpoint.getAllBookings();
      const validBookings = Array.isArray(bookingsResult)
        ? bookingsResult.filter((b): b is Booking => b !== undefined)
        : [];
      setAllBookings(validBookings);
      console.log(`DEBUG (BookingsView): Loaded ${validBookings.length} bookings.`);

      // Apply filter if userIdToFilter is present
      const currentFilteredBookings = userIdToFilter
        ? validBookings.filter(booking => booking.userId === userIdToFilter)
        : validBookings;
      setFilteredBookings(currentFilteredBookings);
      if (currentFilteredBookings.length === 0) {
        if (userIdToFilter) {
          setError(`No bookings found for user "${userIdToFilter}".`);
        } else {
          setError('No bookings registered.');
        }
        console.log("DEBUG (BookingsView): No bookings found.");
      } else {
        setError(null);
      }
    } catch (e) {
      console.error('ERROR (BookingsView): Error fetching all data:', e);
      setError('There was an error loading your bookings. Please try again later.');
      setAllBookings([]);
      setFilteredBookings([]);
      setAllCars([]);
      setAllDelegations([]);
    } finally {
      setLoading(false);
      console.log("DEBUG (BookingsView): Data fetch completed.");
    }
  };

  // useEffect to load data on component mount (no initial filter)
  useEffect(() => {
    fetchAllData();
  }, []);

  // Handler for user filter button
  const handleFilterByUser = () => {
    fetchAllData(filterUserId);
  };

  // Handler for show all bookings button
  const handleShowAllBookings = () => {
    setFilterUserId(''); // Clear the filter field
    fetchAllData(null); // Show all bookings
  };

  // Function to get car details from carId (operation)
  const getCarDetails = (carId: string) => {
    return allCars.find(car => car.operation === carId);
  };

  // Function to get delegation details
  const getDelegationDetails = (delegationId: string) => {
    return allDelegations.find(delegation => delegation.delegationId === delegationId);
  };

  // Handler to delete a booking
  const handleDeleteBooking = async (booking: Booking) => {
    if (!booking.carId || !booking.startDate) {
      setError('Error: Cannot delete booking. Missing key data (carId or startDate).');
      return;
    }
    console.log(`DEBUG (Frontend): Attempting to delete booking with carId: "${booking.carId}" and startDate: "${booking.startDate}"`);
    const confirmed = true; // Replace with a custom modal confirmation

    if (confirmed) {
      try {
        await DelegationEndpoint.deleteBooking(booking.carId, booking.startDate);
        setError(`Booking ${booking.bookingId} deleted successfully.`);
        // Reload all bookings to update the list, applying the filter if it exists
        await fetchAllData(filterUserId || null);
      } catch (e) {
        console.error('ERROR (BookingsView): Error deleting booking:', e);
        setError('There was an error deleting the booking. Please try again.');
      }
    }
  };

  // Handler to modify a booking (placeholder)
  const handleModifyBooking = (booking: Booking) => {
    setError(`Modify booking functionality for ${booking.bookingId} not yet implemented.`);
    console.log('Modify booking:', booking);
  };

  // --- NUEVA FUNCIÓN PARA DESCARGAR PDF DE LA RESERVA ---
  const handleDownloadPdf = async (booking: Booking) => {
    console.log('Generating PDF for booking:', booking);

    // 1. Encuentra el elemento HTML de la reserva específica.
    const bookingElement = document.querySelector(`li[data-booking-id="${booking.bookingId}"]`);

    if (bookingElement) {
      setError(null); // Clear any previous errors

      // Opcional: Clona el nodo para limpiarlo de botones y CSS no deseado antes de generar el PDF
      // Esto asegura que solo el contenido visible se convierta y no los botones de acción.
      const clonedElement = bookingElement.cloneNode(true) as HTMLElement;

      // Eliminar los botones de acción del clon para que no aparezcan en el PDF
      const buttonsDiv = clonedElement.querySelector('.print-buttons');
      if (buttonsDiv) {
        buttonsDiv.remove();
      }

      // Opciones para html2pdf
      const pdfOptions = {
        margin: 10,
        filename: `Reserva_${booking.bookingId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // scale para mejor calidad, useCORS para imágenes externas
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        // Genera el PDF y lo descarga
        await html2pdf().from(clonedElement).set(pdfOptions).save();
        setError(`PDF de la reserva ${booking.bookingId} generado y descargado con éxito.`);
      } catch (e) {
        console.error('ERROR (BookingsView): Error generating PDF:', e);
        setError('Hubo un error al generar el PDF de la reserva. Por favor, inténtalo de nuevo.');
      }

    } else {
      console.error('ERROR (BookingsView): Could not find booking element for PDF generation with ID:', booking.bookingId);
      setError('No se pudo encontrar la reserva para generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };
  // --- FIN NUEVA FUNCIÓN ---

  // Define the Euro to Peseta conversion rate (kept for reference, but NOT used for conversion here)
  const EUR_TO_PTS_RATE = 166.386; 

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Mis Reservas</h2>

      {/* User filter section */}
      <div className="flex gap-2 mb-4 items-end filter-section">
        <TextField
          label="Filtrar por ID de Usuario"
          placeholder="Ej: USER#001"
          value={filterUserId}
          onValueChanged={({ detail }) => setFilterUserId(detail.value)}
        />
        <Button theme="primary" onClick={handleFilterByUser}>
          Filtrar
        </Button>
        <Button theme="tertiary" onClick={handleShowAllBookings}>
          Mostrar Todas
        </Button>
      </div>

      {loading && (
        <p className="text-gray-600">Cargando reservas...</p>
      )}

      {error && (
        <div className="text-red-600 font-bold mt-4">{error}</div>
      )}

      {!loading && !error && filteredBookings.length === 0 && (
        <p className="text-gray-600 mt-4">No tienes reservas registradas {filterUserId ? `para el usuario "${filterUserId}"` : ''}.</p>
      )}

      {!loading && !error && filteredBookings.length > 0 && (
        <div className="w-full max-w-5xl text-left">
          <ul className="list-none p-0">
            {filteredBookings.map(booking => {
              const car = getCarDetails(booking.carId || '');
              const delegation = getDelegationDetails(booking.delegationId || '');
              // This correctly determines if the car is vintage based on its year
              const isCurrentCarVintage = car ? car.year < 2000 : false; 

              let totalPrice = 'N/A';
              let duration = 0;
              if (car && booking.startDate && booking.endDate) {
                try {
                  const start = new Date(booking.startDate);
                  const end = new Date(booking.endDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (duration === 0 && booking.startDate === booking.endDate) {
                    duration = 1;
                  } else if (duration > 0) {
                    duration = duration + 1; // Add 1 to include the start day
                  }

                  if (duration > 0) {
                    const calculatedPrice = car.price * duration;
                    // **MODIFICACIÓN CLAVE**: Usa solo `isCurrentCarVintage` para determinar el símbolo
                    totalPrice = isCurrentCarVintage 
                      ? `${calculatedPrice.toFixed(2)} Pts` // Muestra el valor original con "Pts"
                      : `${calculatedPrice.toFixed(2)} €`;
                  } else {
                    totalPrice = 'Invalid Dates';
                  }
                } catch (e) {
                  console.error(`ERROR (BookingsView): Error calculating total price for booking ${booking.bookingId}:`, e);
                  totalPrice = 'Calculation Error';
                }
              }

              console.log(`DEBUG (BookingsView): Processing booking ${booking.bookingId}`);
              console.log(`DEBUG (BookingsView): Car found for booking:`, car);
              console.log(`DEBUG (BookingsView): Delegation found for booking:`, delegation);
              if (delegation) {
                console.log(`DEBUG (BookingsView): Delegation Details: Name=${delegation.name}, City=${delegation.city}, Address=${delegation.adress}, Manager=${delegation.manager}, Phone=${delegation.telf}, Lat=${delegation.lat}, Long=${delegation.longVal}, CarQuantity=${delegation.carQuantity}`);
              } else {
                console.log(`DEBUG (BookingsView): No delegation details found for ID: ${booking.delegationId}`);
              }

              return (
                <li
                  key={booking.bookingId}
                  data-booking-id={booking.bookingId} // IMPORTANT: Add this data attribute for PDF targeting
                  className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  <div className="flex flex-col sm:flex-row w-full gap-4">
                    {/* Image Section (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 flex items-center justify-center p-2">
                      {car && isCarWithMakeAndModel(car) ? (
                        <img
                          src={getCarThumbnailImageUrl(car)}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-[300px] object-cover rounded-lg"
                          onError={(e) => {
                            console.error("ERROR (BookingsView): Failed to load car thumbnail image:", e.currentTarget.src, e);
                            (e.target as HTMLImageElement).src = 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded-lg">
                          <p className="text-gray-500 text-sm">Car Not Found</p>
                        </div>
                      )}
                    </div>

                    {/* Booking and Car Details Section (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 p-2 border-b sm:border-b-0 sm:border-r border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Booking Details</h3>
                      <p className="text-gray-700">
                        <span className="font-medium">User:</span> {booking.userId || 'N/A'}
                      </p>
                      {car ? (
                        <>
                          <p className="text-gray-700">
                            <span className="font-medium">Car:</span> {car.make || 'N/A'} {car.model || 'N/A'} ({car.year || 'N/A'}) - {car.color || 'N/A'}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Booking Date:</span> {booking.bookingDate || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Dates:</span> {booking.startDate || 'N/A'} to {booking.endDate || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Price per day:</span>{' '}
                            <strong>
                              {/* **MODIFICACIÓN CLAVE**: Usa solo `isCurrentCarVintage` para determinar el símbolo */}
                              {isCurrentCarVintage 
                                ? `${car.price?.toFixed(2) || 'N/A'} Pts` // Muestra el valor original con "Pts"
                                : `${car.price?.toFixed(2) || 'N/A'} €`}
                            </strong>
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Number of days booked:</span> {duration > 0 ? duration : 'N/A'}
                          </p>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            <span className="text-purple-700">Total Price:</span> {totalPrice}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-700"><span className="font-medium">Car:</span> Details Not Available</p>
                      )}
                      <p className="text-gray-700 text-sm">
                        <span className="text-blue-600">Booking ID:</span> {booking.bookingId || 'N/A'}
                      </p>
                    </div>

                    {/* Delegation Details Section (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 p-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Delegation Details</h3>
                      {delegation ? (
                        <>
                          <p className="text-gray-700">
                            <span className="font-medium">Delegation:</span> {delegation.name || 'N/A'} ({delegation.city || 'N/A'})
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Address:</span> {delegation.adress || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Manager:</span> {delegation.manager || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Phone:</span> {delegation.telf || 'N/A'}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-700"><span className="font-medium">Delegation:</span> Details Not Available</p>
                      )}
                    </div>
                  </div>
                  {/* Buttons below the three sections */}
                  <div className="flex gap-2 mt-4 justify-center sm:justify-start w-full print-buttons">
                    <Button theme="error small" onClick={() => handleDeleteBooking(booking)}>
                      Delete
                    </Button>
                    <Button theme="tertiary small" onClick={() => handleModifyBooking(booking)}>
                      Modify
                    </Button>
                    {/* Botón para DESCARGAR PDF */}
                    <Button theme="contrast small" onClick={() => handleDownloadPdf(booking)}>
                      Download PDF
                    </Button>
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