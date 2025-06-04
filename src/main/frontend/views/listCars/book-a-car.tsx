import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import { Button } from '@vaadin/react-components/Button';
import { useNavigate } from 'react-router-dom';

export const config: ViewConfig = {
  title: 'Buscar Coches / Reservar', // Mantén el título
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
function isCarWithMakeAndModel(car: Car | undefined): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  // Asegura que car no es undefined/null y tiene las propiedades necesarias
  return !!car && typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}

// Función para generar URL de imagen (condicional: local para vintage, externa para moderno)
const getCarThumbnailImageUrl = (car: Car) => {
  const isCurrentCarVintage = car.year < 2000; // Determina si el coche es vintage

  // Asegura que make y model sean strings antes de pasarlos a sanitizeFilenamePart/encodeURIComponent
  const carMake = car.make || '';
  const carModel = car.model || '';

  if (isCurrentCarVintage) {
    // Ruta local para coches vintage, siempre
    const localImagePath = `/images/${sanitizeFilenamePart(carMake)}_${sanitizeFilenamePart(carModel)}.webp`;
    console.log("DEBUG (Book a Car): Generated local vintage car image URL:", localImagePath);
    return localImagePath;
  } else {
    // API externa para coches modernos, siempre
    const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(carMake)}&modelFamily=${encodeURIComponent(carModel)}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
    console.log("DEBUG (Book a Car): Generated external modern car image URL:", imageUrl);
    return imageUrl;
  }
};


export default function BookACarView() { // Renombrado de ListCars a BookACarView
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estado para el modo vintage, se leerá del elemento <html> (solo para precio)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // useEffect para escuchar cambios en la clase del elemento <html>
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // useEffect para cargar los datos de los coches desde el backend
  useEffect(() => {
    DelegationEndpoint.getAllCars()
      .then((result) => {
        // Filtra los resultados para asegurar que son objetos Car válidos
        const safeCars = (result ?? []).filter(isCarWithMakeAndModel) as Car[];
        setCars(safeCars);
      })
      .catch((error) => {
        console.error('Failed to fetch cars:', error);
        setCars([]); // En caso de error, la lista de coches estará vacía
      })
      .finally(() => setLoading(false)); // Finaliza el estado de carga
  }, []);

  // Manejador para el botón "BOOK"
  const handleBook = async (car: Car) => {
    const userId = "USER#001"; // ID de usuario fijo para el ejemplo
    try {
      // Genera un hash para la reserva usando los datos del coche y el ID de usuario
      const idHashBookingCar = await generateBookingHash({
        make: car.make ?? '',
        model: car.model ?? '',
        userId
      });
      // Navega a la página de reserva, pasando los datos del coche en el estado
      navigate(`/listCars/bookingCar/${idHashBookingCar}`, { state: { car } });
    } catch (error) {
      console.error('Error generating booking hash:', error);
      // Mensaje de error en consola en lugar de alert()
      console.error('Failed to start booking process');
    }
  };

  // Función para generar un hash de reserva
  async function generateBookingHash(data: {
    make: string;
    model: string;
    userId: string;
  }): Promise<string> {
    const encoder = new TextEncoder();
    const dateString = new Date().toISOString().split('T')[0]; // Obtiene la fecha actual en formato YYYY-MM-DD
    const stringToHash = `${data.make}-${data.model}-${dateString}-${data.userId}`; // Cadena a hashear
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256', // Algoritmo de hash SHA-256
      encoder.encode(stringToHash) // Codifica la cadena a Uint8Array
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convierte el buffer a un array de bytes
    // Convierte cada byte a su representación hexadecimal y asegura dos dígitos
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
      {cars
        .filter(isCarWithMakeAndModel) // Filtra coches con make, model y year válidos
        // NOTA: Ya no filtramos por vintage/moderno aquí, se muestran todos.
        // La lógica de imagen y precio se maneja dentro del map.
        .map(car => {
          // Determina si el coche actual es vintage (para la visualización del precio)
          const isCurrentCarVintage = car.year < 2000;

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
              {/* Lógica para la URL de la imagen (API externa o local) */}
              <img
                src={getCarThumbnailImageUrl(car)} // Llama a la función para obtener la URL
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
                    ? `${(car.price * EUR_TO_PTS_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts` // Muestra en Pesetas sin decimales
                    : `${car.price} €` // Muestra en Euros
                  }
                </strong>
              </div>
              <div style={{ marginBottom: '1rem', color: car.rented ? '#d33' : '#090' }}>
                {car.rented ? 'Alquilado' : 'Disponible'}
              </div>
              <Button
                theme="primary"
                disabled={car.rented}
                onClick={() => handleBook(car)}
                style={{ width: '100%' }}
              >
                RESERVAR
              </Button>
            </div>
          );
        })
      }
    </div>
  );
}
