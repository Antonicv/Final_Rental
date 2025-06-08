import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';
import { Button } from '@vaadin/react-components/Button'; // Importar Button
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog

export const config: ViewConfig = {
  title: 'Delegaciones / Ubicaciones',
};

// Función de ayuda para obtener la ruta de la imagen según el nombre de la delegación
const getDelegationImage = (delegationName: string) => {
  if (delegationName.includes('Yecla')) {
    return '/images/yecla.webp';
  } else if (delegationName.includes('Orcera')) {
    return '/images/orcera.webp';
  } else if (delegationName.includes('Despeñaperros')) { // El nombre de la delegación de Santa Elena
    return '/images/despeñaperros.webp';
  } else if (delegationName.includes('Guarromán')) {
    return '/images/guarroman.webp';
  } else if (delegationName.includes('Cornellà')) {
    return '/images/cornella.webp';
  }
  return 'https://placehold.co/300x150?text=No+Image'; // Imagen de fallback
};

export default function LocationsView() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null); // Referencia al contenedor del mapa principal
  const leafletMapInstance = useRef<any>(null); // Referencia al objeto del mapa Leaflet principal
  const [leafletLoaded, setLeafletLoaded] = useState(false); // Estado para controlar la carga de Leaflet

  // Nuevos estados para el diálogo de detalles de la delegación
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [dialogOpened, setDialogOpened] = useState(false);

  // Estado para la URL de búsqueda de ocio en Google
  const [googleLeisureSearchUrl, setGoogleLeisureSearchUrl] = useState<string | null>(null);


  // Primer useEffect: Carga Leaflet y sus estilos
  useEffect(() => {
    const loadLeafletScriptAndStyle = async () => {
      if (window.L) {
        setLeafletLoaded(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        return new Promise<void>((resolve) => {
          script.onload = () => {
            setLeafletLoaded(true);
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load Leaflet script.");
            setError("Error al cargar la biblioteca de mapas.");
            setLoading(false);
            resolve();
          };
        });
      }
    };

    loadLeafletScriptAndStyle();

    // Limpieza al desmontar el componente (para el mapa principal)
    return () => {
        if (leafletMapInstance.current) {
            leafletMapInstance.current.remove();
            leafletMapInstance.current = null;
        }
    };
  }, []); // Se ejecuta una vez al montar el componente

  // Segundo useEffect: Carga delegaciones
  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await DelegationEndpoint.getAllDelegations();

        const validDelegations = (result ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
        setDelegations(validDelegations);

        if (validDelegations.length === 0) {
          setError('No se encontraron delegaciones.');
        } else {
          setError(null);
        }
      } catch (e) {
        console.error('Error fetching delegations:', e);
        setError('Hubo un error al cargar las delegaciones. Por favor, inténtalo de nuevo más tarde.');
        setDelegations([]);
      } finally {
        setLoading(false);
      }
    };

    if (leafletLoaded) {
      fetchDelegations();
    }
  }, [leafletLoaded]);

  // Tercer useEffect: Inicializa o actualiza el mapa principal y los marcadores
  useEffect(() => {
    // Solo inicializa el mapa principal si no está ya inicializado.
    if (!leafletMapInstance.current && leafletLoaded && mapRef.current && window.L) {
      const L_global = window.L;

      // ** SOLUCIÓN PARA ERRORES 404 DE MARCADORES: **
      // Eliminar el método _getIconUrl del prototipo de L.Icon.Default para evitar la doble ruta.
      // Luego, establecer explícitamente las URLs completas de los iconos.
      delete L_global.Icon.Default.prototype._getIconUrl;
      L_global.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialLat = delegations[0]?.lat || 40.416775;
      const initialLong = delegations[0]?.longVal || -3.703790;

      leafletMapInstance.current = L_global.map(mapRef.current).setView([initialLat, initialLong], 6);

      L_global.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMapInstance.current);
    }

    // Actualiza los marcadores del mapa principal si está inicializado y visible
    if (leafletLoaded && leafletMapInstance.current && delegations.length > 0) {
      const L_global = window.L;

      // Limpiar marcadores existentes antes de añadir nuevos
      leafletMapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L_global.Marker) {
          leafletMapInstance.current.removeLayer(layer);
        }
      });

      delegations.forEach(delegation => {
        if (delegation.lat && delegation.longVal && delegation.name) {
          L_global.marker([delegation.lat, delegation.longVal])
            .addTo(leafletMapInstance.current)
            .bindPopup(`<b>${delegation.name}</b><br>${delegation.adress || ''}<br>${delegation.city || ''}`);
        }
      });
    }
  }, [delegations, leafletLoaded]);

  // Cuarto useEffect: Maneja el redibujo y centrado del mapa principal cuando el diálogo se cierra
  useEffect(() => {
      // Si el diálogo acaba de cerrarse (dialogOpened pasa de true a false)
      // Y el mapa principal está inicializado y Leaflet cargado
      if (!dialogOpened && leafletMapInstance.current && leafletLoaded && window.L) {
          // Usar setTimeout para asegurar que el DOM ha tenido tiempo de hacer visible el contenedor del mapa
          setTimeout(() => {
              if (leafletMapInstance.current) {
                  console.log("DEBUG: Main map invalidateSize() called after dialog closed.");
                  leafletMapInstance.current.invalidateSize(); // ¡Importante para que se redibuje!

                  // Centrar el mapa en la delegación seleccionada si hay una,
                  // de lo contrario, volver a la vista inicial general.
                  if (selectedDelegation && selectedDelegation.lat && selectedDelegation.longVal) {
                      console.log(`DEBUG: Centering map on selected delegation: ${selectedDelegation.name}`);
                      leafletMapInstance.current.setView([selectedDelegation.lat, selectedDelegation.longVal], 13); // Zoom más cercano
                  } else if (delegations.length > 0) {
                      console.log("DEBUG: Centering map on first delegation.");
                      leafletMapInstance.current.setView([delegations[0].lat || 40.416775, delegations[0].longVal || -3.703790], 6);
                  } else {
                      console.log("DEBUG: Centering map on default location.");
                      leafletMapInstance.current.setView([40.416775, -3.703790], 6); // Default Madrid
                  }
              }
          }, 0);
      }
  }, [dialogOpened, leafletLoaded, selectedDelegation, delegations]);

  // Manejador para el clic en el botón de la delegación
  const handleDelegationClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setDialogOpened(true);

    // Generar la URL de búsqueda de Google para ocio y turismo en la ciudad de la delegación
    if (delegation.city) {
        const searchQuery = encodeURIComponent(`ocio turismo lugares históricos ${delegation.city}`);
        setGoogleLeisureSearchUrl(`https://www.google.com/search?q=${searchQuery}`);
    } else {
        setGoogleLeisureSearchUrl(null);
    }
  };

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      {/* Estilos CSS específicos para los botones de delegación */}
      <style>
        {`
        .delegation-name-button {
            /* Asegura que el botón ocupe todo el ancho para el texto centrado */
            width: 100%;
            /* Elimina relleno predeterminado de Vaadin Button para controlar padding en el div de contenido */
            padding: 0 !important;
            /* Alinea el texto del botón al centro */
            text-align: center;
            /* Establece el color del texto del botón (opcional, si se necesita forzar) */
            color: var(--lumo-primary-text-color) !important;
            /* Propiedades de transición para el efecto de hover */
            transition: transform 0.3s ease-in-out;
            /* Quita el fondo y borde predeterminados del botón para la integración visual */
            background: none !important;
            border: none !important;
            box-shadow: none !important;
        }

        .delegation-name-button:hover {
            transform: scale(1.05); /* Escala el botón un 5% al hacer hover */
        }

        /* Estilos para el contenedor de la tarjeta, si se necesita asegurar que el hover no recorte */
        .delegation-card-container {
            overflow: hidden; /* Asegura que el contenido escalado no desborde */
        }
        `}
      </style>

      <h2 className="text-2xl font-bold mb-4">Nuestras Delegaciones</h2>

      {loading && <p>Cargando delegaciones y mapa...</p>}
      {error && <div className="text-red-600 font-bold mt-4">{error}</div>}

      {/* Contenedor del mapa principal - control de visibilidad con CSS */}
      <div
        ref={mapRef}
        style={{
          height: '500px', // Altura fija para el mapa
          width: '100%',
          maxWidth: '900px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '1rem',
          marginBottom: '2rem',
          opacity: dialogOpened ? 0 : 1, // Ocultar visualmente el mapa cuando el diálogo está abierto
          pointerEvents: dialogOpened ? 'none' : 'auto', // Deshabilitar interacciones del ratón cuando está oculto
          transition: 'opacity 0.3s ease-in-out' // Transición suave
        }}
      >
        {!leafletLoaded && !loading && !error && <p>Cargando biblioteca de mapas...</p>}
      </div>


      {/* Lista de delegaciones */}
      <h3 className="text-xl font-bold mb-4">Listado de Delegaciones</h3>
      {delegations.length > 0 ? (
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {delegations.map(d => (
            <div
              key={d.delegationId}
              className="bg-white p-4 rounded-lg shadow-md text-left border border-gray-200 relative overflow-hidden delegation-card-container" // Añadida la clase de contenedor
              style={{
                backgroundImage: `url(${getDelegationImage(d.name || '')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centrar verticalmente
                alignItems: 'center', // Centrar horizontalmente para el bloque de texto
                textAlign: 'center', // Asegurar que el texto dentro esté centrado
                color: 'black', // Color de texto por defecto
              }}
            >
              {/* Contenido de la delegación con fondo opaco alrededor del texto */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)', // Fondo blanco semi-transparente
                  padding: '0.5rem 1rem', // Relleno alrededor del texto
                  borderRadius: '8px', // Bordes ligeramente redondeados para el rectángulo
                  backdropFilter: 'blur(2px)', // Opcional: efecto de desenfoque sutil en el fondo
                  minWidth: '80%', // Asegurar que el rectángulo sea lo suficientemente ancho
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Sombra sutil para el rectángulo
                }}
              >
                {/* Botón para la delegación - aplicando la nueva clase CSS */}
                <Button
                  theme="tertiary"
                  onClick={() => handleDelegationClick(d)}
                  className="delegation-name-button" // Aplicando la clase CSS personalizada
                >
                  {d.name}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && <p>No hay delegaciones para mostrar.</p>
      )}

      {/* Diálogo de detalles de la delegación */}
      <Dialog
        headerTitle={selectedDelegation?.name || 'Detalles de la Delegación'}
        opened={dialogOpened}
        onOpenedChanged={({ detail }) => setDialogOpened(detail.value)}
      >
        {selectedDelegation && (
          <div className="p-m text-left" style={{ position: 'relative', zIndex: 1000 }}>
            <p className="mb-2"><span className="font-semibold">ID:</span> {selectedDelegation.delegationId}</p>
            <p className="mb-2"><span className="font-semibold">Dirección:</span> {selectedDelegation.adress}</p>
            <p className="mb-2"><span className="font-semibold">Ciudad:</span> {selectedDelegation.city}</p>
            <p className="mb-2"><span className="font-semibold">Gestor:</span> {selectedDelegation.manager}</p>
            <p className="mb-2"><span className="font-semibold">Teléfono:</span> {selectedDelegation.telf}</p>
            <p className="mb-2"><span className="font-semibold">Coches Disponibles:</span> {selectedDelegation.carQuantity}</p>
            <p className="mb-2"><span className="font-semibold">Latitud:</span> {selectedDelegation.lat}</p>
            <p className="mb-2"><span className="font-semibold">Longitud:</span> {selectedDelegation.longVal}</p>

            <Button onClick={() => setDialogOpened(false)} theme="primary" className="mt-m">Cerrar</Button>
          </div>
        )}
      </Dialog>

      <h3 className="text-xl font-bold mt-8 mb-4">Actividades de Ocio y Turismo</h3>
      {googleLeisureSearchUrl ? (
        <div className="w-full max-w-xl bg-white p-4 rounded-lg shadow-md text-left border border-gray-200">
          <p className="mb-2">
            Haz clic en el siguiente enlace para buscar actividades de ocio, turismo y lugares históricos en{' '}
            <span className="font-semibold">{selectedDelegation?.city}</span>:
          </p>
          <a
            href={googleLeisureSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-bold"
          >
            Buscar en Google: Ocio y Turismo en {selectedDelegation?.city}
          </a>
        </div>
      ) : (
        <p className="text-gray-700 max-w-prose">
          Selecciona una delegación para buscar actividades de ocio y puntos de interés cercanos.
        </p>
      )}
    </div>
  );
}
