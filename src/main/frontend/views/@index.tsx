import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button';
import { Dialog } from '@vaadin/react-components/Dialog';
import { DatePicker } from '@vaadin/react-components/DatePicker';
import { Select } from '@vaadin/react-components/Select';
import { useQuery } from '@tanstack/react-query'; // Importar useQuery si no lo tienes
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import { UserEndpoint } from 'Frontend/generated/endpoints'; // CAMBIO IMPORTANTE: Importar UserEndpoint
import Car from 'Frontend/generated/dev/renting/delegations/Car';
// CAMBIO IMPORTANTE: Importar Booking y User del nuevo path
import Booking from 'Frontend/generated/dev/renting/users/Booking';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Importar Delegation para tipado
import { useNavigate } from 'react-router-dom';


export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'home'
};

function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}

export default function HomeView() {
  const navigate = useNavigate();

  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedDelegationId, setSelectedDelegationId] = useState<string | null>(null);
  const [selectedDelegationLabel, setSelectedDelegationLabel] = useState<string | null>(null);
  const [availableCarsResult, setAvailableCarsResult] = useState<Car[] | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // CAMBIO IMPORTANTE: Usar useQuery para cargar delegaciones
  const { data: delegations, isLoading: delegationsLoading, error: delegationsError } = useQuery({
    queryKey: ['delegations'],
    queryFn: async () => {
      const allDelegations = await DelegationEndpoint.getAllDelegations(); // CAMBIO IMPORTANTE: Usar getAllDelegations
      return (allDelegations ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
    },
    // Opcional: staleTime para no refetchear tan a menudo si las delegaciones no cambian
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mapear las delegaciones cargadas a opciones para el Select
  const delegationOptions = (delegations ?? []).map(d => ({
    value: d.delegationId || '',
    label: d.name || d.city || 'Delegación sin nombre', // Un fallback para el label
    city: d.city || ''
  }));

  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // CAMBIO IMPORTANTE: handleAvailabilitySearch llamará a un nuevo método en el backend
  const handleAvailabilitySearch = async () => {
    setSearchMessage(null);
    if (startDate && endDate && selectedDelegationId) {
      console.log(`Buscando disponibilidad para la delegación ID: ${selectedDelegationId}`);
      console.log(`Desde: ${startDate} Hasta: ${endDate}`);

      const currentDelegation = delegationOptions.find(opt => opt.value === selectedDelegationId);
      setSelectedDelegationLabel(currentDelegation ? currentDelegation.label : null);

      try {
        // CAMBIO IMPORTANTE: Necesitas un método en DelegationEndpoint.java que haga esto.
        // Lo crearemos en el backend a continuación.
        const cars = await DelegationEndpoint.findAvailableCars(selectedDelegationId, startDate, endDate, isVintageMode);
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

  const handleBookCar = async (car: Car) => {
    if (!selectedDelegationId || !startDate || !endDate || !car.carId) { // CAMBIO: Usar car.carId
      setSearchMessage('Error: Faltan datos para la reserva (fechas, delegación o ID del coche).');
      setIsResultsDialogOpen(false);
      return;
    }

    const userId = "USER#001"; // ID de usuario fijo para el ejemplo, deberías obtenerlo del contexto de seguridad
    const carUniqueId = car.carId; // CAMBIO: Usar car.carId como ID único del coche

    const booking: Booking = {
      carId: carUniqueId,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
      delegationId: selectedDelegationId,
      bookingId: '', // Será generado por el backend
      bookingDate: '' // Será generado por el backend
    };

    try {
      // CAMBIO IMPORTANTE: saveBooking ahora está en UserEndpoint
      await UserEndpoint.saveBooking(booking);
      setSearchMessage(`Coche ${car.make} ${car.model} reservado con éxito.`);
      await handleAvailabilitySearch();
    } catch (error) {
      console.error('Error al reservar el coche:', error);
      setSearchMessage('Error al reservar el coche. Por favor, inténtalo de nuevo.');
    }
  };

  const handleViewAllBookings = () => {
    navigate('/my-bookings');
  };

  const getCarThumbnailImageUrl = (car: Car) => {
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
      {/* ... (rest of your JSX is mostly unchanged) ... */}
      <img
        style={{ width: '200px' }}
        src={isVintageMode ? "/images/empty-plant.png" : "/images/NewLogo.webp"}
        alt={isVintageMode ? "Empty Plant" : "New Logo"}
        onError={(e) => {
          console.error("ERROR: Failed to load main image:", e.currentTarget.src, e);
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Image+Not+Found';
        }}
      />
      <h2>
        {isVintageMode ? "Vehículos a Pupilaje" : "Tu Próximo Vehículo te Espera"}
      </h2>
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

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        <Button
          theme="primary"
          onClick={() => {
            setIsCalendarOpen(true);
            setSearchMessage(null);
            setAvailableCarsResult(null);
          }}
        >
          Ver Disponibilidad
        </Button>

        <Button
          theme="primary"
          onClick={handleViewAllBookings}
        >
          Ver Todas las Reservas
        </Button>
      </div>

      {searchMessage && !isResultsDialogOpen && (
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          {searchMessage}
        </div>
      )}

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
          {delegationsLoading ? (
            <p>Cargando delegaciones...</p>
          ) : delegationsError ? (
            <p style={{ color: 'red' }}>Error al cargar delegaciones: {delegationsError.message}</p>
          ) : (
            <Select
              label="Delegación"
              items={delegationOptions}
              value={selectedDelegationId || ''}
              onValueChanged={({ detail }) => setSelectedDelegationId(detail.value)}
              placeholder="Selecciona una delegación"
              style={{ width: '100%' }}
            />
          )}
          <Button theme="primary" onClick={handleAvailabilitySearch} style={{ marginTop: '1rem' }}>
            Buscar Disponibilidad
          </Button>
        </div>
      </Dialog>

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
                isCarWithMakeAndModel(car) && (
                  <li key={`${car.carId}`} style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img
                      src={getCarThumbnailImageUrl(car)}
                      alt={`${car.make} ${car.model}`}
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                      onError={(e) => {
                        console.error("ERROR: Failed to load car thumbnail image:", e.currentTarget.src, e);
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