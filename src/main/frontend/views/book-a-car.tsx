import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import { Button } from '@vaadin/react-components/Button';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@vaadin/react-components/Dialog';

export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Vehículos',
};

function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

export default function ListCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  const [selectedCarDetails, setSelectedCarDetails] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    DelegationEndpoint.getAllCars()
      .then((result) => {
        const safeCars = (result ?? []).filter(
          (car): car is Car =>
            !!car &&
            typeof car.delegationId === 'string' &&
            typeof car.operation === 'string' &&
            typeof car.year === 'number'
        );
        setCars(safeCars);
      })
      .catch((error) => {
        console.error('Failed to fetch cars:', error);
        setCars([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Función para obtener detalles desde la API NHTSA para coches normales
  const fetchCarDetails = async (car: Car) => {
    setFetchingDetails(true);
  
    if (!car.make || !car.model) {
    setSelectedCarDetails(null);
    setFetchingDetails(false);
    return;
  }

    if (car.year < 2000) {
      // Mock data para coches vintage
      // (Se mantiene activo para coches vintage)
      const mockDetails = {
        engine: '1.5L Naturally Aspirated Inline-4 (Vintage)',
        horsepower: '75 hp (Vintage)',
        torque: '80 lb-ft (Vintage)',
        transmission: '4-speed Manual (Vintage)',
        fuelEconomy: '18 MPG (Vintage)',
        acceleration: '0-60 mph in 15.0s (Vintage)',
        features: ['Radio AM/FM', 'Manual Windows'],
        safetyRating: 'N/A',
        dimensions: 'L: 160in, W: 64in, H: 55in',
        cargoVolume: '8.0 cu ft',
        make: car.make,
        model: car.model,
      };
      setSelectedCarDetails(mockDetails);
      setFetchingDetails(false);
      return;
    }

    try {
      // Llamada real a la API de NHTSA para coches normales
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(car.make)}?format=json`
      );
      const data = await response.json();

      const modelMatch = data.Results.find(
        (m: any) => m.Model_Name.toLowerCase() === car.model.toLowerCase()
      );

      if (!modelMatch) {
        setSelectedCarDetails({
          engine: 'N/D',
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Modelo no encontrado en NHTSA'],
          make: car.make,
          model: car.model,
        });
      } else {
        setSelectedCarDetails({
          engine: 'N/D',
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Modelo encontrado en NHTSA'],
          make: car.make,
          model: car.model,
        });
      }
    } catch (error) {
      console.error('Error al obtener datos de NHTSA:', error);
      setSelectedCarDetails(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
    return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
  }

  if (loading) {
    return <div>Loading cars...</div>;
  }

  if (cars.length === 0) {
    return <div>No cars available.</div>;
  }

  const EUR_TO_PTS_RATE = 166.386;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
       {cars
      // Aquí está la parte que tienes que filtrar primero:
      .filter(isCarWithMakeAndModel)   // <--- Aquí
      .filter((car) => {
        if (isVintageMode) {
          return car.year < 2000;
        } else {
          return car.year >= 2000;
        }
      })
      .map((car) => {
          const isCurrentCarVintage = car.year < 2000;

          return (
            <div
              key={`${car.delegationId}-${car.operation}`}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                width: '320px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.5rem',
                background: '#fff',
              }}
            >
              <img
                src={
                  isVintageMode && isCurrentCarVintage
                    ? `/images/${sanitizeFilenamePart(car.make)}_${sanitizeFilenamePart(car.model)}.webp`
                    : `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(
                        car.make
                      )}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(
                        car.color || ''
                      )}&zoomType=fullscreen`
                }
                alt={`${car.make} ${car.model}`}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x180?text=Car+Not+Found';
                }}
              />
              <h3>
                {car.make} {car.model}
              </h3>
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Año: <strong>{car.year}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Color: <strong>{car.color}</strong>
              </div>
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Precio:{' '}
                <strong>
    {isVintageMode && isCurrentCarVintage
      ? car.price != null
        ? `${car.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts`
        : 'Precio no disponible'
      : car.price != null
      ? `${car.price} €`
      : 'Precio no disponible'}
  </strong>
              </div>
              <div style={{ marginBottom: '1rem', color: car.rented ? '#d33' : '#090' }}>
                {car.rented ? 'Reservado' : 'Disponible'}
              </div>
              <Button
                theme="primary"
                disabled={car.rented}
                onClick={() => fetchCarDetails(car).then(() => setIsDetailsDialogOpen(true))}
                style={{ width: '100%' }}
              >
                Detalles
              </Button>
            </div>
          );
        })}

      <Dialog
        headerTitle={
          selectedCarDetails
            ? `Detalles de ${selectedCarDetails.make} ${selectedCarDetails.model}`
            : 'Detalles del Coche'
        }
        opened={isDetailsDialogOpen}
        onOpenedChanged={({ detail }) => setIsDetailsDialogOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
      >
        {fetchingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando detalles...</div>
        ) : selectedCarDetails ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>
              <strong>Motor:</strong> {selectedCarDetails.engine}
            </p>
            <p>
              <strong>Potencia:</strong> {selectedCarDetails.horsepower}
            </p>
            <p>
              <strong>Par motor:</strong> {selectedCarDetails.torque}
            </p>
            <p>
              <strong>Transmisión:</strong> {selectedCarDetails.transmission}
            </p>
            <p>
              <strong>Consumo:</strong> {selectedCarDetails.fuelEconomy}
            </p>
            <p>
              <strong>Aceleración 0-100 km/h:</strong> {selectedCarDetails.acceleration}
            </p>
            <p>
              <strong>Valoración de seguridad:</strong> {selectedCarDetails.safetyRating}
            </p>
            <p>
              <strong>Dimensiones:</strong> {selectedCarDetails.dimensions}
            </p>
            <p>
              <strong>Volumen de carga:</strong> {selectedCarDetails.cargoVolume}
            </p>
            <p>
              <strong>Características:</strong> {selectedCarDetails.features?.join(', ')}
            </p>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No hay detalles para mostrar.</div>
        )}
      </Dialog>
    </div>
  );
}
