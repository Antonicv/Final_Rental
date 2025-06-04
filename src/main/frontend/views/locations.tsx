import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';

export const config: ViewConfig = {
  title: 'Delegaciones / Ubicaciones',
};

export default function LocationsView() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null); // Referencia al contenedor del mapa
  const leafletMapInstance = useRef<any>(null); // Referencia al objeto del mapa Leaflet
  const [leafletLoaded, setLeafletLoaded] = useState(false); // Estado para controlar la carga de Leaflet

  // Primer useEffect: Carga Leaflet y sus estilos
  useEffect(() => {
    const loadLeafletScriptAndStyle = async () => {
      if (window.L) {
        // Leaflet ya está cargado globalmente
        setLeafletLoaded(true);
      } else {
        // Cargar desde CDN si no está presente
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        // ** ACTUALIZADO: Hash SHA256 para leaflet.js **
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        // ** ACTUALIZADO: Hash SHA256 para leaflet.css **
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        return new Promise<void>((resolve) => {
          script.onload = () => {
            setLeafletLoaded(true); // Marcar Leaflet como cargado
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load Leaflet script.");
            setError("Error al cargar la biblioteca de mapas.");
            setLoading(false);
            resolve(); // Resolver incluso si falla para no bloquear
          };
        });
      }
    };

    // Iniciar la carga de Leaflet
    loadLeafletScriptAndStyle();

    // Limpieza al desmontar el componente
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove(); // Elimina el mapa del DOM
        leafletMapInstance.current = null;
      }
    };
  }, []); // Se ejecuta una vez al montar el componente

  // Segundo useEffect: Carga delegaciones e inicializa/actualiza el mapa
  useEffect(() => {
    const fetchDelegationsAndRenderMap = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await DelegationEndpoint.getAllProfileDelegations();
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

    // Solo intentar cargar delegaciones y renderizar mapa si Leaflet está cargado
    if (leafletLoaded) {
      fetchDelegationsAndRenderMap();
    }
  }, [leafletLoaded]); // Depende de que Leaflet esté cargado

  // Tercer useEffect: Inicializa el mapa y añade marcadores cuando Leaflet está cargado y hay delegaciones
  useEffect(() => {
    // Asegurarse de que Leaflet esté cargado, el contenedor del mapa esté listo,
    // y que el mapa no haya sido inicializado previamente.
    if (leafletLoaded && mapRef.current && window.L && !leafletMapInstance.current) {
      const L_global = window.L; // Acceder a L desde el objeto global window

      // ** IMPORTANTE: Configurar la ruta de las imágenes de los marcadores de Leaflet **
      // Esto resuelve los errores 404 para marker-icon.png y marker-shadow.png
      L_global.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Centra el mapa en la primera delegación o en una ubicación predeterminada (ej. España)
      const initialLat = delegations[0]?.lat || 40.416775; // Latitud de Madrid como fallback
      const initialLong = delegations[0]?.longVal || -3.703790; // Longitud de Madrid como fallback

      leafletMapInstance.current = L_global.map(mapRef.current).setView([initialLat, initialLong], 6); // Zoom inicial 6 para España

      // Añadir capa de tiles de OpenStreetMap
      L_global.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMapInstance.current);
    }

    // Añadir marcadores para cada delegación (esto puede ejecutarse si las delegaciones cambian
    // después de que el mapa ya se inicializó, o en la misma pasada si todo carga a la vez)
    if (leafletLoaded && leafletMapInstance.current && delegations.length > 0) {
      const L_global = window.L; // Acceder a L desde el objeto global window

      // Limpiar marcadores existentes antes de añadir nuevos
      leafletMapInstance.current.eachLayer((layer: any) => {
        // Solo remover capas que son marcadores (tienen un método getLatLng)
        if (layer.getLatLng) {
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
  }, [delegations, leafletLoaded]); // Se ejecuta cuando cambian las delegaciones o el estado de carga de Leaflet

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h2 className="text-2xl font-bold mb-4">Nuestras Delegaciones</h2>

      {loading && <p>Cargando delegaciones y mapa...</p>}
      {error && <div className="text-red-600 font-bold mt-4">{error}</div>}

      {/* Contenedor del mapa */}
      <div ref={mapRef} style={{ height: '500px', width: '100%', maxWidth: '900px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '1rem', marginBottom: '2rem' }}>
        {!leafletLoaded && !loading && !error && <p>Cargando biblioteca de mapas...</p>}
      </div>

      {/* Lista de delegaciones (adicional al mapa) */}
      <h3 className="text-xl font-bold mb-4">Listado de Delegaciones</h3>
      {delegations.length > 0 ? (
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {delegations.map(d => (
            <div key={d.delegationId} className="bg-white p-4 rounded-lg shadow-md text-left border border-gray-200">
              <p className="font-semibold text-lg mb-1">{d.name}</p>
              <p className="text-gray-700">Dirección: {d.adress}</p>
              <p className="text-gray-700">Ciudad: {d.city}</p>
              <p className="text-gray-700">Teléfono: {d.telf}</p>
              {/* Aquí podrías añadir un enlace o un botón para ver actividades de ocio si existiera la funcionalidad */}
              {/* <button className="mt-2 text-blue-500 hover:underline">Ver Actividades de Ocio Cercanas</button> */}
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && <p>No hay delegaciones para mostrar.</p>
      )}

      <h3 className="text-xl font-bold mt-8 mb-4">Actividades de Ocio</h3>
      <p className="text-gray-700 max-w-prose">
        Aquí podrás encontrar actividades de ocio y eventos sugeridos en las proximidades de cada delegación.
        Estamos trabajando para integrar servicios externos que te permitan descubrir la mejor oferta de entretenimiento y cultura local.
      </p>
    </div>
  );
}
