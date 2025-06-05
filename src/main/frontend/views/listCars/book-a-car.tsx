import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
// import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Eliminado: Ya no se necesita para el nombre de la delegación aquí
import { Button } from '@vaadin/react-components/Button';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog

export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Book a car',
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

export default function ListCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estado para el modo vintage, se leerá del elemento <html>
  // Esto permite que el componente ListCars reaccione a los cambios del botón en MainLayout.
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // Nuevos estados para el diálogo de detalles del coche
  const [selectedCarDetails, setSelectedCarDetails] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  // Eliminado: Estado para almacenar los nombres de las delegaciones (ya no es necesario)
  // const [delegationNamesMap, setDelegationNamesMap] = useState<Map<string, string>>(new Map());


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

  // useEffect para cargar los datos de los coches desde el backend
  useEffect(() => {
    DelegationEndpoint.getAllCars()
      .then((result) => {
        // Filtra los resultados para asegurar que son objetos Car válidos
        const safeCars = (result ?? []).filter(
          (car): car is Car =>
            !!car &&
            typeof car.delegationId === 'string' &&
            typeof car.operation === 'string' &&
            typeof car.make === 'string' && // Asegurar que 'make' es string
            typeof car.model === 'string' && // Asegurar que 'model' es string
            typeof car.year === 'number' // Asegúrate de que 'year' es un número para el filtrado
        );
        setCars(safeCars);
      })
      .catch((error) => {
        console.error('Failed to fetch cars:', error);
        setCars([]); // En caso de error, la lista de coches estará vacía
      })
      .finally(() => setLoading(false)); // Finaliza el estado de carga
  }, []);

  // Eliminado: useEffect para cargar los nombres de las delegaciones (ya no es necesario)
  // useEffect(() => {
  //   DelegationEndpoint.getAllProfileDelegations()
  //     .then(delegations => {
  //       const newMap = new Map<string, string>();
  //       (delegations ?? []).forEach((d: Delegation | undefined | null) => {
  //         if (d?.delegationId && d?.name) {
  //           newMap.set(d.delegationId, d.name);
  //         }
  //       });
  //       setDelegationNamesMap(newMap);
  //     })
  //     .catch(error => {
  //       console.error('Error fetching delegation names:', error);
  //     });
  // }, []);

  // Simulación de llamada a API para obtener detalles del coche
  const fetchCarDetails = async (car: Car) => {
    setFetchingDetails(true);
    // Simula un retraso de red
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDetails = {
          engine: '2.0L Turbo Inline-4',
          horsepower: '255 hp',
          torque: '273 lb-ft',
          transmission: '8-speed Automatic',
          fuelEconomy: '25 MPG (combined)',
          acceleration: '0-60 mph in 6.0s',
          features: ['Navigation', 'Heated Seats', 'Sunroof', 'Adaptive Cruise Control'],
          safetyRating: '5-star NHTSA',
          dimensions: 'L: 185in, W: 72in, H: 57in',
          cargoVolume: '13.5 cu ft',
          // Detalles específicos para coches vintage simulados
          ...(car.year < 2000 && {
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
          })
        };
        resolve({ ...car, ...mockDetails }); // Combinar los datos del coche con los detalles mock
        setFetchingDetails(false);
      }, 800); // Simula un retraso de 800ms
    });
  };

  // Manejador para el botón "Detalles"
  const handleShowDetails = async (car: Car) => {
    setSelectedCarDetails(null); // Limpiar detalles anteriores
    setIsDetailsDialogOpen(true); // Abrir el diálogo

    const details = await fetchCarDetails(car);
    setSelectedCarDetails(details); // Establecer los detalles obtenidos (simulados)
  };

  // Función de guarda de tipo para asegurar que el objeto Car tiene propiedades 'make', 'model' y 'year'
  function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; delegationId: string; } {
    return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number' && typeof car.delegationId === 'string';
  }

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <div>Cargando coches...</div>;
  }

  // Muestra un mensaje si no hay coches disponibles
  if (cars.length === 0) {
    return <div>No hay coches disponibles.</div>;
  }

  // Definir la tasa de conversión de Euro a Peseta
  const EUR_TO_PTS_RATE = 166.386;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      {/* El botón de toggle de modo vintage se encuentra en MainLayout */}

      {cars
        .filter(isCarWithMakeAndModel) // Filtra coches con make, model, year y delegationId válidos
        // Filtro condicional para mostrar coches "vintage" o "modernos"
        .filter(car => {
          if (isVintageMode) {
            return car.year < 2000; // Solo coches "vintage" (años anteriores al 2000)
          } else {
            return car.year >= 2000; // Solo coches "modernos" (años 2000 en adelante)
          }
        })
        .map(car => {
          // Determina si el coche actual es vintage (para la visualización del precio)
          const isCurrentCarVintage = car.year < 2000;
          // Eliminado: Obtener el nombre de la delegación (ya no es necesario)
          // const delegationName = delegationNamesMap.get(car.delegationId) || car.delegationId;

          return (
            <div
              key={`${car.delegationId}-${car.operation}`} // Clave única para cada tarjeta de coche
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                width: '320px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.5rem',
                background: '#fff'
              }}
            >
              {/* Lógica condicional para la URL de la imagen (API externa o local) */}
              <img
                src={isVintageMode && isCurrentCarVintage // Solo usa imagen local si el modo vintage está activo Y el coche es vintage
                  ? `/images/${sanitizeFilenamePart(car.make)}_${sanitizeFilenamePart(car.model)}.webp` // Ruta local para coches vintage
                  : `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make)}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen` // API externa para coches modernos
                }
                alt={`${car.make} ${car.model}`} // Texto alternativo para la imagen
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}
                onError={(e) => {
                  // Fallback para imágenes no encontradas (muestra un placeholder)
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
                Precio: <strong>
                  {isVintageMode && isCurrentCarVintage // Si el modo vintage está activo Y el coche es vintage
                    ? `${(car.price * EUR_TO_PTS_RATE ).toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts` // Muestra en Pesetas sin decimales
                    : `${car.price} €` // Muestra en Euros
                  }
                </strong>
              </div>
              
              <Button
                theme="primary"
                disabled={car.rented}
                onClick={() => handleShowDetails(car)} // Llama a handleShowDetails
                style={{ width: '100%' }}
              >
                Detalles {/* Texto del botón cambiado */}
              </Button>
            </div>
          );
        })
      }

      {/* Diálogo para mostrar los detalles del coche */}
      <Dialog
        headerTitle={selectedCarDetails ? `Detalles de ${selectedCarDetails.make} ${selectedCarDetails.model}` : 'Detalles del Coche'}
        opened={isDetailsDialogOpen}
        onOpenedChanged={({ detail }) => setIsDetailsDialogOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
      >
        {fetchingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando detalles...</div>
        ) : selectedCarDetails ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p><strong>Motor:</strong> {selectedCarDetails.engine}</p>
            <p><strong>Potencia:</strong> {selectedCarDetails.horsepower}</p>
            <p><strong>Par motor:</strong> {selectedCarDetails.torque}</p>
            <p><strong>Transmisión:</strong> {selectedCarDetails.transmission}</p>
            <p><strong>Consumo:</strong> {selectedCarDetails.fuelEconomy}</p>
            <p><strong>Aceleración (0-60 mph):</strong> {selectedCarDetails.acceleration}</p>
            <p><strong>Clasificación de seguridad:</strong> {selectedCarDetails.safetyRating}</p>
            <p><strong>Dimensiones:</strong> {selectedCarDetails.dimensions}</p>
            <p><strong>Volumen de carga:</strong> {selectedCarDetails.cargoVolume}</p>
            <p><strong>Características:</strong> {selectedCarDetails.features.join(', ')}</p>
            <Button theme="primary" onClick={() => setIsDetailsDialogOpen(false)} style={{ marginTop: '1rem' }}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No se pudieron cargar los detalles del coche.</div>
        )}
      </Dialog>
    </div>
  );
}
