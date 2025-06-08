import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';
import { Button } from '@vaadin/react-components/Button';
import { Dialog } from '@vaadin/react-components/Dialog';

export const config: ViewConfig = {
  title: 'Delegaciones / Ubicaciones',
};

const getDelegationImage = (delegationName: string) => {
  if (delegationName.includes('Yecla')) return '/images/yecla.webp';
  if (delegationName.includes('Orcera')) return '/images/orcera.webp';
  if (delegationName.includes('Despeñaperros')) return '/images/despeñaperros.webp';
  if (delegationName.includes('Guarromán')) return '/images/guarroman.webp';
  if (delegationName.includes('Cornellà')) return '/images/cornella.webp';
  return 'https://placehold.co/300x150?text=No+Image';
};

export default function LocationsView() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [dialogOpened, setDialogOpened] = useState(false);
  const [googleLeisureSearchUrl, setGoogleLeisureSearchUrl] = useState<string | null>(null);

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
            setError("Error al cargar la biblioteca de mapas.");
            setLoading(false);
            resolve();
          };
        });
      }
    };

    loadLeafletScriptAndStyle();

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await DelegationEndpoint.getAllProfileDelegations();
        const validDelegations = (result ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
        setDelegations(validDelegations);

        if (validDelegations.length === 0) setError('No se encontraron delegaciones.');
      } catch (e) {
        setError('Hubo un error al cargar las delegaciones.');
        setDelegations([]);
      } finally {
        setLoading(false);
      }
    };

    if (leafletLoaded) fetchDelegations();
  }, [leafletLoaded]);

  useEffect(() => {
    if (!leafletMapInstance.current && leafletLoaded && mapRef.current && window.L) {
      const L = window.L;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialLat = delegations[0]?.lat || 40.416775;
      const initialLong = delegations[0]?.longVal || -3.70379;

      leafletMapInstance.current = L.map(mapRef.current).setView([initialLat, initialLong], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMapInstance.current);
    }

    if (leafletLoaded && leafletMapInstance.current && delegations.length > 0) {
      const L = window.L;
      leafletMapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) leafletMapInstance.current.removeLayer(layer);
      });

      delegations.forEach(d => {
        if (d.lat && d.longVal && d.name) {
          L.marker([d.lat, d.longVal])
            .addTo(leafletMapInstance.current)
            .bindPopup(`<b>${d.name}</b><br>${d.adress || ''}<br>${d.city || ''}`);
        }
      });
    }
  }, [delegations, leafletLoaded]);

  useEffect(() => {
    if (!dialogOpened && leafletMapInstance.current && leafletLoaded && window.L) {
      setTimeout(() => {
        if (leafletMapInstance.current) {
          leafletMapInstance.current.invalidateSize();

          if (selectedDelegation?.lat && selectedDelegation?.longVal) {
            leafletMapInstance.current.setView([selectedDelegation.lat, selectedDelegation.longVal], 13);
          } else if (delegations.length > 0) {
            leafletMapInstance.current.setView(
              [delegations[0].lat || 40.416775, delegations[0].longVal || -3.70379],
              6
            );
          } else {
            leafletMapInstance.current.setView([40.416775, -3.70379], 6);
          }
        }
      }, 0);
    }
  }, [dialogOpened, leafletLoaded, selectedDelegation, delegations]);

  const handleDelegationClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setDialogOpened(true);
    if (delegation.city) {
      const query = encodeURIComponent(`ocio turismo lugares históricos ${delegation.city}`);
      setGoogleLeisureSearchUrl(`https://www.google.com/search?q=${query}`);
    } else {
      setGoogleLeisureSearchUrl(null);
    }
  };

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <style>
        {`
          .delegation-name-button {
            width: 100%;
            padding: 0 !important;
            text-align: center;
            color: var(--lumo-primary-text-color) !important;
            transition: transform 0.3s ease-in-out;
            background: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .delegation-name-button:hover {
            transform: scale(1.05);
          }
          .delegation-card-container {
            overflow: hidden;
          }
        `}
      </style>

      <h2 className="text-2xl font-bold mb-4">Nuestras Delegaciones</h2>

      {loading && <p>Cargando delegaciones y mapa...</p>}
      {error && <div className="text-red-600 font-bold mt-4">{error}</div>}

      <div
        ref={mapRef}
        style={{
          height: '500px',
          width: '100%',
          maxWidth: '900px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '1rem',
          marginBottom: '2rem',
          opacity: dialogOpened ? 0 : 1,
          pointerEvents: dialogOpened ? 'none' : 'auto',
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

      <h3 className="text-xl font-bold mb-4">Listado de Delegaciones</h3>
      {delegations.length > 0 ? (
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {delegations.map(d => (
            <div
              key={d.delegationId}
              className="bg-white p-4 rounded-lg shadow-md text-left border relative overflow-hidden delegation-card-container"
              style={{
                backgroundImage: `url(${getDelegationImage(d.name || '')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '150px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  backdropFilter: 'blur(2px)',
                  minWidth: '80%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <Button
                  theme="tertiary"
                  onClick={() => handleDelegationClick(d)}
                  className="delegation-name-button"
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

      <Dialog
        headerTitle={selectedDelegation?.name || 'Detalles de la Delegación'}
        opened={dialogOpened}
        onOpenedChanged={({ detail }) => setDialogOpened(detail.value)}
      >
        {selectedDelegation && (
          <div className="p-m text-left" style={{ position: 'relative', zIndex: 1000 }}>
            <p className="mb-2"><strong>ID:</strong> {selectedDelegation.delegationId}</p>
            <p className="mb-2"><strong>Dirección:</strong> {selectedDelegation.adress}</p>
            <p className="mb-2"><strong>Ciudad:</strong> {selectedDelegation.city}</p>
            <p className="mb-2"><strong>Gestor:</strong> {selectedDelegation.manager}</p>
            <p className="mb-2"><strong>Teléfono:</strong> {selectedDelegation.telf}</p>
            <p className="mb-2"><strong>Coches Disponibles:</strong> {selectedDelegation.carQuantity}</p>
            <p className="mb-2"><strong>Latitud:</strong> {selectedDelegation.lat}</p>
            <p className="mb-2"><strong>Longitud:</strong> {selectedDelegation.longVal}</p>
            <Button onClick={() => setDialogOpened(false)} theme="primary" className="mt-m">Cerrar</Button>
          </div>
        )}
      </Dialog>

      <h3 className="text-xl font-bold mt-8 mb-4">Actividades de Ocio y Turismo</h3>
      {googleLeisureSearchUrl ? (
        <div className="w-full max-w-xl bg-white p-4 rounded-lg shadow-md text-left border border-gray-200">
          <p className="mb-2">
            Haz clic en el siguiente enlace para buscar actividades de ocio y turismo en{' '}
            <strong>{selectedDelegation?.city}</strong>:
          </p>
         <a
  href={googleLeisureSearchUrl || '#'}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-500 hover:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
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
