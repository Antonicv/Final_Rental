import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';
import { Button } from '@vaadin/react-components/Button';
import { Dialog } from '@vaadin/react-components/Dialog';

// Configuració de la vista per al router de Hilla.
// Defineix el títol que apareixerà a la barra de navegació i a la pestanya del navegador.
export const config: ViewConfig = {
  title: 'Delegacions / Ubicacions',
};

// Funció auxiliar per obtenir la ruta de la imatge d'una delegació segons el seu nom.
// Utilitza imatges locals per a delegacions específiques, altrament retorna una imatge de placeholder.
const getDelegationImage = (delegationName: string) => {
  if (delegationName.includes('Yecla')) return '/images/yecla.webp';
  if (delegationName.includes('Orcera')) return '/images/orcera.webp';
  if (delegationName.includes('Despeñaperros')) return '/images/despeñaperros.webp';
  if (delegationName.includes('Guarromán')) return '/images/guarroman.webp';
  if (delegationName.includes('Cornellà')) return '/images/cornella.webp';
  return 'https://placehold.co/300x150?text=No+Image'; // Imatge per defecte si no hi ha coincidència.
};

// Component principal de la vista de Llista de Delegacions.
export default function LocationsView() {
  // Estat per emmagatzemar la llista de delegacions.
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  // Estat per indicar si les dades s'estan carregant.
  const [loading, setLoading] = useState(true);
  // Estat per emmagatzemar qualsevol missatge d'error.
  const [error, setError] = useState<string | null>(null);
  // Referència a l'element DOM on es renderitzarà el mapa de Leaflet.
  const mapRef = useRef<HTMLDivElement>(null);
  // Referència a la instància de l'objecte mapa de Leaflet.
  const leafletMapInstance = useRef<any>(null);
  // Estat per saber si la biblioteca Leaflet s'ha carregat correctament.
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Estat per emmagatzemar la delegació seleccionada per veure els detalls.
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  // Estat per controlar si el diàleg de detalls està obert.
  const [dialogOpened, setDialogOpened] = useState(false);
  // Estat per emmagatzemar la URL de cerca de Google per a oci i turisme.
  const [googleLeisureSearchUrl, setGoogleLeisureSearchUrl] = useState<string | null>(null);

  // Efecte per carregar dinàmicament els scripts i estils de Leaflet.
  // S'executa una única vegada al muntar el component.
  useEffect(() => {
    const loadLeafletScriptAndStyle = async () => {
      // Comprova si Leaflet ja està disponible globalment (window.L).
      if (window.L) {
        setLeafletLoaded(true); // Si ja està carregat, actualitza l'estat.
      } else {
        // Crea i afegeix l'script de Leaflet al <head> del document.
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        document.head.appendChild(script);

        // Crea i afegeix l'estil CSS de Leaflet al <head> del document.
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Retorna una Promise que es resol quan l'script de Leaflet s'ha carregat.
        return new Promise<void>((resolve) => {
          script.onload = () => {
            setLeafletLoaded(true); // Actualitza l'estat quan l'script carrega.
            resolve();
          };
          script.onerror = () => {
            setError("Error en carregar la biblioteca de mapes."); // Mostra un error si falla la càrrega.
            setLoading(false); // Atura l'estat de càrrega.
            resolve();
          };
        });
      }
    };

    loadLeafletScriptAndStyle(); // Crida a la funció per carregar Leaflet.

    // Funció de neteja: elimina la instància del mapa de Leaflet quan el component es desmunta.
    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove(); // Elimina el mapa del DOM.
        leafletMapInstance.current = null; // Neteja la referència.
      }
    };
  }, []); // Array de dependències buit, s'executa només al muntar.

  // Efecte per obtenir les delegacions des del backend.
  // S'executa quan `leafletLoaded` canvia a true.
  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        setLoading(true); // Inicia l'estat de càrrega.
        setError(null); // Neteja qualsevol error previ.
        // Crida a l'endpoint del backend per obtenir totes les delegacions.
        const result = await DelegationEndpoint.getAllProfileDelegations();
        // Filtra els resultats per assegurar-se que són objectes de Delegació vàlids.
        const validDelegations = (result ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
        setDelegations(validDelegations); // Actualitza l'estat amb les delegacions obtingudes.

        // Si no es troben delegacions, estableix un missatge d'error.
        if (validDelegations.length === 0) setError('No es van trobar delegacions.');
      } catch (e) {
        // En cas d'error en la crida, registra i mostra un missatge d'error.
        setError('Hi va haver un error en carregar les delegacions.');
        setDelegations([]); // Buidar la llista de delegacions en cas d'error.
      } finally {
        setLoading(false); // Finalitza l'estat de càrrega.
      }
    };

    // Només intenta obtenir les delegacions si Leaflet ja s'ha carregat.
    if (leafletLoaded) fetchDelegations();
  }, [leafletLoaded]); // S'executa quan leafletLoaded canvia.

  // Efecte per inicialitzar el mapa de Leaflet i afegir marcadors de delegacions.
  // S'executa quan `delegations` o `leafletLoaded` canvien.
  useEffect(() => {
    // Inicialitza el mapa només si no hi ha una instància existent, Leaflet està carregat,
    // el contenidor del mapa existeix i l'objecte global L (Leaflet) està disponible.
    if (!leafletMapInstance.current && leafletLoaded && mapRef.current && window.L) {
      const L = window.L; // Obté l'objecte Leaflet global.
      // Solució per a un problema comú amb les icones per defecte de Leaflet.
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Defineix les coordenades inicials del mapa. Si hi ha delegacions, utilitza la primera,
      // altrament, utilitza una ubicació per defecte (centre d'Espanya).
      const initialLat = delegations[0]?.lat || 40.416775;
      const initialLong = delegations[0]?.longVal || -3.70379;

      // Crea una nova instància del mapa i l'assigna a la referència.
      leafletMapInstance.current = L.map(mapRef.current).setView([initialLat, initialLong], 6);

      // Afegeix una capa de tiles (mapa base) d'OpenStreetMap.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', // Atribució requerida per OpenStreetMap.
      }).addTo(leafletMapInstance.current);
    }

    // Afegeix marcadors per a cada delegació un cop el mapa i les dades estan disponibles.
    if (leafletLoaded && leafletMapInstance.current && delegations.length > 0) {
      const L = window.L;
      // Neteja els marcadors existents per evitar duplicats en cada actualització.
      leafletMapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) leafletMapInstance.current.removeLayer(layer);
      });

      // Afegeix un marcador per a cada delegació amb la seva informació.
      delegations.forEach(d => {
        if (d.lat && d.longVal && d.name) {
          L.marker([d.lat, d.longVal])
            .addTo(leafletMapInstance.current)
            .bindPopup(`<b>${d.name}</b><br>${d.adress || ''}<br>${d.city || ''}`); // Afegeix un popup amb informació.
        }
      });
    }
  }, [delegations, leafletLoaded]); // S'executa quan delegations o leafletLoaded canvien.

  // Efecte per invalidar la mida del mapa i ajustar la vista del mapa quan el diàleg es tanca.
  // Això és necessari perquè el mapa es renderitzi correctament quan el contenidor és invisible o té la mida alterada.
  useEffect(() => {
    // S'activa només quan el diàleg està tancat, Leaflet i el mapa estan carregats.
    if (!dialogOpened && leafletMapInstance.current && leafletLoaded && window.L) {
      // Un setTimeout de 0ms assegura que la invalidació es faci després que el DOM hagi actualitzat la visibilitat.
      setTimeout(() => {
        if (leafletMapInstance.current) {
          leafletMapInstance.current.invalidateSize(); // Força el mapa a recalcular la seva mida.

          // Ajusta la vista del mapa:
          // Si hi ha una delegació seleccionada, centra el mapa en ella amb un zoom més proper.
          if (selectedDelegation?.lat && selectedDelegation?.longVal) {
            leafletMapInstance.current.setView([selectedDelegation.lat, selectedDelegation.longVal], 13);
          }
          // Si no hi ha delegació seleccionada però hi ha delegacions, centra en la primera amb un zoom més allunyat.
          else if (delegations.length > 0) {
            leafletMapInstance.current.setView(
              [delegations[0].lat || 40.416775, delegations[0].longVal || -3.70379],
              6
            );
          }
          // Si no hi ha delegacions, centra en la posició per defecte.
          else {
            leafletMapInstance.current.setView([40.416775, -3.70379], 6);
          }
        }
      }, 0);
    }
  }, [dialogOpened, leafletLoaded, selectedDelegation, delegations]); // S'executa quan aquestes dependències canvien.

  // Manejador de clic per a cada delegació.
  // Quan es fa clic en una delegació, s'estableix com a seleccionada, s'obre el diàleg i es genera la URL de cerca de Google.
  const handleDelegationClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation); // Estableix la delegació clicada.
    setDialogOpened(true); // Obre el diàleg.
    if (delegation.city) {
      // Genera la URL de cerca de Google per a activitats d'oci a la ciutat de la delegació.
      const query = encodeURIComponent(`oci turisme llocs històrics ${delegation.city}`);
      setGoogleLeisureSearchUrl(`https://www.google.com/search?q=${query}`);
    } else {
      setGoogleLeisureSearchUrl(null); // Si no hi ha ciutat, no hi ha URL de cerca.
    }
  };

  return (
    // Contenidor principal de la vista.
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      {/* Estils CSS incrustats per personalitzar botons i contenidors de targetes. */}
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
            transform: scale(1.05); /* Efecte d'escala en passar el ratolí per sobre. */
          }
          .delegation-card-container {
            overflow: hidden; /* Amaga el contingut que sobresurt. */
          }
        `}
      </style>

      {/* Títol principal de la secció. */}
      <h2 className="text-2xl font-bold mb-4">Les Nostres Delegacions</h2>

      {/* Missatges d'estat: càrrega o error. */}
      {loading && <p>Carregant delegacions i mapa...</p>}
      {error && <div className="text-red-600 font-bold mt-4">{error}</div>}

      {/* Contenidor del mapa de Leaflet. */}
      <div
        ref={mapRef} // Assigna la referència a l'element DOM.
        style={{
          height: '500px',
          width: '100%',
          maxWidth: '900px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '1rem',
          marginBottom: '2rem',
          // Ajusta la opacitat i els esdeveniments de punter quan el diàleg està obert.
          opacity: dialogOpened ? 0 : 1,
          pointerEvents: dialogOpened ? 'none' : 'auto',
          transition: 'opacity 0.3s ease-in-out', // Transició suau per a l'opacitat.
        }}
      />

      {/* Títol de la secció de llistat de delegacions. */}
      <h3 className="text-xl font-bold mb-4">Llistat de Delegacions</h3>
      {delegations.length > 0 ? (
        // Reixeta de targetes de delegacions.
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {delegations.map(d => (
            // Targeta individual de cada delegació.
            <div
              key={d.delegationId} // Clau única per a cada targeta.
              className="bg-white p-4 rounded-lg shadow-md text-left border relative overflow-hidden delegation-card-container"
              style={{
                backgroundImage: `url(${getDelegationImage(d.name || '')})`, // Imatge de fons.
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '150px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Contenidor per al nom de la delegació i el botó, amb efecte de fons translúcid. */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1, // Assegura que el contingut sigui per sobre de la imatge de fons.
                  backgroundColor: 'rgba(255, 255, 255, 0.85)', // Fons blanc semitransparent.
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  backdropFilter: 'blur(2px)', // Efecte de desenfocament darrere del text.
                  minWidth: '80%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {/* Botó amb el nom de la delegació que obre el diàleg de detalls. */}
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
        // Missatge si no hi ha delegacions a mostrar (després de la càrrega i sense error).
        !loading && !error && <p>No hi ha delegacions per mostrar.</p>
      )}

      {/* Diàleg per mostrar els detalls de la delegació seleccionada. */}
      <Dialog
        headerTitle={selectedDelegation?.name || 'Detalls de la Delegació'} // Títol del diàleg.
        opened={dialogOpened} // Controla si el diàleg està obert.
        onOpenedChanged={({ detail }) => setDialogOpened(detail.value)} // Funció per tancar el diàleg.
      >
        {selectedDelegation && (
          // Contingut dels detalls de la delegació dins del diàleg.
          <div className="p-m text-left" style={{ position: 'relative', zIndex: 1000 }}>
            <p className="mb-2"><strong>ID:</strong> {selectedDelegation.delegationId}</p>
            <p className="mb-2"><strong>Adreça:</strong> {selectedDelegation.adress}</p>
            <p className="mb-2"><strong>Ciutat:</strong> {selectedDelegation.city}</p>
            <p className="mb-2"><strong>Gestor:</strong> {selectedDelegation.manager}</p>
            <p className="mb-2"><strong>Telèfon:</strong> {selectedDelegation.telf}</p>
            <p className="mb-2"><strong>Cotxes Disponibles:</strong> {selectedDelegation.carQuantity}</p>
            <p className="mb-2"><strong>Latitud:</strong> {selectedDelegation.lat}</p>
            <p className="mb-2"><strong>Longitud:</strong> {selectedDelegation.longVal}</p>
            {/* Botó per tancar el diàleg. */}
            <Button onClick={() => setDialogOpened(false)} theme="primary" className="mt-m">Tancar</Button>
          </div>
        )}
      </Dialog>

      {/* Secció per a la cerca d'activitats d'oci i turisme. */}
      <h3 className="text-xl font-bold mt-8 mb-4">Activitats d'Oci i Turisme</h3>
      {googleLeisureSearchUrl ? (
        // Si hi ha una URL de cerca, mostra un botó per buscar en Google.
        <div className="w-full max-w-xl bg-white p-4 rounded-lg shadow-md text-left border border-gray-200">
          <p className="mb-2">
            Fes clic en el següent enllaç per cercar activitats d'oci i turisme a{' '}
            <strong>{selectedDelegation?.city}</strong>:
          </p>
          <a
            href={googleLeisureSearchUrl || '#'} // La URL de cerca.
            target="_blank" // Obre en una nova pestanya.
            rel="noopener noreferrer" // Seguretat per a enllaços externs.
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-indigo-600 hover:to-blue-500 hover:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Cercar a Google: Oci i Turisme a {selectedDelegation?.city}
          </a>
        </div>
      ) : (
        // Missatge si no s'ha seleccionat cap delegació encara.
        <p className="text-gray-700 max-w-prose">
          Selecciona una delegació per cercar activitats d'oci i punts d'interès propers.
        </p>
      )}
    </div>
  );
}