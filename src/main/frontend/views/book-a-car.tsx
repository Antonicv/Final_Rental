import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import { Button } from '@vaadin/react-components/Button';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@vaadin/react-components/Dialog';

// Configuració de la vista per al router de Hilla.
// Defineix l'ordre al menú, la icona i el títol de la pàgina.
export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Vehicles',
};

// Funció d'ajuda per netejar cadenes de text per utilitzar-les en noms de fitxer.
// Elimina accents, caràcters diacrítics, reemplaça espais amb guions baixos i elimina caràcters no permesos.
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD") // Normalitza la cadena per separar els accents i diacrítics.
    .replace(/[\u0300-\u036f]/g, "") // Elimina els caràcters diacrítics.
    .replace(/\s+/g, '_') // Reemplaça un o més espais amb un guió baix.
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Elimina qualsevol caràcter que no sigui alfanumèric, guió baix, punt o guió.
}

// Component principal de la vista ListCars.
export default function ListCars() {
  // Estat per emmagatzemar la llista de cotxes. Inicialment un array buit.
  const [cars, setCars] = useState<Car[]>([]);
  // Estat per indicar si s'estan carregant les dades dels cotxes. Inicialment true.
  const [loading, setLoading] = useState(true);
  // Hook per a la navegació programàtica entre rutes.
  const navigate = useNavigate();

  // Estat per controlar si el mode vintage està actiu, llegint-lo de la classe de l'element <html>.
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estat per emmagatzemar els detalls del cotxe seleccionat per al diàleg.
  const [selectedCarDetails, setSelectedCarDetails] = useState<any | null>(null);
  // Estat per controlar la visibilitat del diàleg de detalls.
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  // Estat per indicar si s'estan obtenint els detalls del cotxe d'una API.
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Efecte per escoltar els canvis en la classe 'vintage-mode' de l'element <html>.
  // Això permet que el component reaccioni a l'activació/desactivació del mode vintage.
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      // Actualitza l'estat isVintageMode si la classe 'vintage-mode' canvia.
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    // Observa canvis en els atributs de l'element <html>, específicament en la classe.
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    // Realitza una comprovació inicial de l'estat del mode vintage en muntar el component.
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));

    // Funció de neteja per desconnectar l'observador quan el component es desmunti.
    return () => observer.disconnect();
  }, []); // L'array de dependències buit assegura que aquest efecte s'executa només una vegada en muntar.

  // Efecte per carregar la llista de cotxes des del backend quan el component es munta.
  useEffect(() => {
    DelegationEndpoint.getAllCars() // Crida a l'endpoint del backend per obtenir tots els cotxes.
      .then((result) => {
        // Filtra els resultats per assegurar-se que cada 'car' no és nul/indefinit i té les propietats mínimes requerides.
        const safeCars = (result ?? []).filter(
          (car): car is Car =>
            !!car && // Comprova que el cotxe no sigui null o undefined.
            typeof car.delegationId === 'string' && // Comprova que delegationId sigui una cadena.
            typeof car.operation === 'string' && // Comprova que operation sigui una cadena.
            typeof car.year === 'number' // Comprova que year sigui un número.
        );
        setCars(safeCars); // Actualitza l'estat amb la llista de cotxes filtrada.
      })
      .catch((error) => {
        console.error('Failed to fetch cars:', error); // Registra un error si la crida falla.
        setCars([]); // Estableix la llista de cotxes a buida en cas d'error.
      })
      .finally(() => setLoading(false)); // Finalment, estableix loading a false, independentment del resultat.
  }, []); // L'array de dependències buit assegura que aquest efecte s'executa només una vegada en muntar.

  // Funció per obtenir detalls del cotxe des de l'API NHTSA per a cotxes moderns
  // o dades simulades per a cotxes vintage.
  const fetchCarDetails = async (car: Car) => {
    setFetchingDetails(true); // Indica que s'estan obtenint els detalls.

    // Comprova si les propietats 'make' o 'model' no estan disponibles.
    if (!car.make || !car.model) {
      setSelectedCarDetails(null); // Neteja els detalls seleccionats.
      setFetchingDetails(false); // Atura la càrrega.
      return;
    }

    const modelLower = car.model.toLowerCase(); // Converteix el model a minúscules per a comparacions.

    if (car.year < 2000) {
      // Dades simulades (mock data) per a cotxes vintage (anteriors a l'any 2000).
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
      setSelectedCarDetails(mockDetails); // Estableix els detalls simulats.
      setFetchingDetails(false); // Atura la càrrega.
      return;
    }

    try {
      // Crida real a l'API de NHTSA (National Highway Traffic Safety Administration) per a cotxes moderns.
      // S'obtenen models per una marca donada.
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(car.make)}?format=json`
      );
      const data = await response.json(); // Converteix la resposta a JSON.

      // Busca una coincidència de model dins dels resultats de l'API.
      const modelMatch = data.Results.find(
        (m: any) => m.Model_Name?.toLowerCase() === modelLower
      );

      if (!modelMatch) {
        // Si no es troba el model a l'API, estableix detalls genèrics de "No Trobat".
        setSelectedCarDetails({
          engine: 'N/D',
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Model no trobat a NHTSA'],
          make: car.make,
          model: car.model,
        });
      } else {
        // Si es troba el model, es podrien extreure més detalls, però aquí només es marca com trobat.
        setSelectedCarDetails({
          engine: 'N/D', // Aquests camps haurien de ser mapejats des de la resposta real de l'API.
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Model trobat a NHTSA'],
          make: car.make,
          model: car.model,
        });
      }
    } catch (error) {
      console.error('Error en obtenir dades de NHTSA:', error); // Registra qualsevol error de la crida a l'API.
      setSelectedCarDetails(null); // Neteja els detalls en cas d'error.
    } finally {
      setFetchingDetails(false); // Finalment, atura la càrrega, independentment del resultat.
    }
  };


  // Funció de guarda de tipus per assegurar que un objecte Car té les propietats 'make', 'model' i 'year'.
  function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
    return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
  }

  // Mostra un missatge de càrrega si les dades encara s'estan obtenint.
  if (loading) {
    return <div>Carregant cotxes...</div>;
  }

  // Mostra un missatge si no hi ha cotxes disponibles després de la càrrega.
  if (cars.length === 0) {
    return <div>No hi ha cotxes disponibles.</div>;
  }

  // Taxa de conversió d'euros a pessetes.
  const EUR_TO_PTS_RATE = 166.386;

  return (
    // Contenidor principal que organitza els cotxes en una quadrícula flexible.
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap', // Permet que els elements es col·loquin en múltiples línies.
        gap: '2rem', // Espai entre els elements.
        justifyContent: 'center', // Centra els elements horitzontalment.
        padding: '2rem', // Padding al voltant del contenidor.
      }}
    >
      {cars
        // Filtra els cotxes: primer assegura't que tenen les propietats necessàries.
        .filter(isCarWithMakeAndModel)   // <--- Aquí es fa el filtratge de tipus.
        // Després, filtra segons el mode vintage:
        // Si el mode vintage està actiu, mostra només els cotxes fabricats abans de l'any 2000.
        // Si no, mostra només els cotxes fabricats a partir de l'any 2000.
        .filter((car) => {
          if (isVintageMode) {
            return car.year < 2000;
          } else {
            return car.year >= 2000;
          }
        })
        // Mapeja cada cotxe filtrat per renderitzar la seva targeta.
        .map((car) => {
          // Determina si el cotxe actual és vintage basant-se en el seu any.
          const isCurrentCarVintage = car.year < 2000;

          return (
            // Contenidor individual per a cada targeta de cotxe.
            <div
              key={`${car.delegationId}-${car.operation}`} // Clau única per a cada element de la llista.
              style={{
                border: '1px solid #ddd', // Vora suau.
                borderRadius: '12px', // Cantonades arrodonides.
                width: '320px', // Amplada fixa de la targeta.
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', // Ombra lleugera per un efecte de profunditat.
                display: 'flex',
                flexDirection: 'column', // Organitza els elements en columna.
                alignItems: 'center', // Centra els elements horitzontalment.
                padding: '1.5rem', // Padding intern.
                background: '#fff', // Fons blanc.
              }}
            >
              {/* Imatge del cotxe. */}
              <img
                src={
                  // Si el mode vintage està actiu I el cotxe actual és vintage, utilitza la imatge local.
                  isVintageMode && isCurrentCarVintage
                    ? `/images/${sanitizeFilenamePart(car.make)}_${sanitizeFilenamePart(car.model)}.webp`
                    // Altrament, utilitza la URL de la imatge de l'API externa.
                    : `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(
                        car.make
                      )}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(
                        car.color || ''
                      )}&zoomType=fullscreen`
                }
                alt={`${car.make} ${car.model}`} // Text alternatiu per a l'accessibilitat.
                style={{
                  width: '100%', // Amplada completa de la targeta.
                  height: '180px', // Alçada fixa.
                  objectFit: 'cover', // Ajusta la imatge per cobrir l'àrea.
                  borderRadius: '8px', // Cantonades arrodonides per a la imatge.
                  marginBottom: '1rem', // Marge inferior.
                }}
                onError={(e) => {
                  // Si la imatge no es carrega, mostra una imatge de placeholder.
                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x180?text=Car+Not+Found';
                }}
              />
              {/* Títol del cotxe (marca i model). */}
              <h3>
                {car.make} {car.model}
              </h3>
              {/* Informació de l'any. */}
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Any: <strong>{car.year}</strong>
              </div>
              {/* Informació del color. */}
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Color: <strong>{car.color}</strong>
              </div>
              {/* Informació del preu, amb conversió a pessetes en mode vintage. */}
              <div style={{ marginBottom: '0.5rem', color: '#555' }}>
                Preu:{' '}
                <strong>
                  {isVintageMode && isCurrentCarVintage // Si el mode vintage està actiu I el cotxe és vintage...
                    ? car.price != null // ...i el preu no és nul...
                      ? `${(car.price * EUR_TO_PTS_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} Pts` // ...mostra el preu en pessetes.
                      : 'Preu no disponible' // Si no hi ha preu, mostra "Preu no disponible".
                    : car.price != null // Si no és mode vintage O el cotxe no és vintage...
                      ? `${car.price} €` // ...mostra el preu en euros.
                      : 'Preu no disponible'}
                </strong>
              </div>
              {/* Estat de disponibilitat (reservat o disponible). */}
              <div style={{ marginBottom: '1rem', color: car.rented ? '#d33' : '#090' }}>
                {car.rented ? 'Reservat' : 'Disponible'}
              </div>
              {/* Botó per veure els detalls del cotxe. */}
              <Button
                theme="primary" // Tema principal del botó.
                disabled={car.rented} // El botó està deshabilitat si el cotxe està reservat.
                // Quan es fa clic, crida a fetchCarDetails i després obre el diàleg de detalls.
                onClick={() => fetchCarDetails(car).then(() => setIsDetailsDialogOpen(true))}
                style={{ width: '100%' }} // Amplada completa del botó.
              >
                Detalls
              </Button>
            </div>
          );
        })}

      {/* Diàleg per mostrar els detalls d'un cotxe seleccionat. */}
      <Dialog
        headerTitle={
          selectedCarDetails // Títol del diàleg, dinàmic segons el cotxe seleccionat.
            ? `Detalls de ${selectedCarDetails.make} ${selectedCarDetails.model}`
            : 'Detalls del Cotxe'
        }
        opened={isDetailsDialogOpen} // Controla si el diàleg està obert.
        onOpenedChanged={({ detail }) => setIsDetailsDialogOpen(detail.value)} // Maneja el tancament del diàleg.
        overlayClass="custom-dialog-overlay" // Classe CSS per a la superposició del diàleg.
      >
        {fetchingDetails ? (
          // Mostra un missatge de càrrega si s'estan obtenint els detalls.
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregant detalls...</div>
        ) : selectedCarDetails ? (
          // Si hi ha detalls seleccionats, els mostra en un format de llista.
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>
              <strong>Motor:</strong> {selectedCarDetails.engine}
            </p>
            <p>
              <strong>Potència:</strong> {selectedCarDetails.horsepower}
            </p>
            <p>
              <strong>Par motor:</strong> {selectedCarDetails.torque}
            </p>
            <p>
              <strong>Transmissió:</strong> {selectedCarDetails.transmission}
            </p>
            <p>
              <strong>Consum:</strong> {selectedCarDetails.fuelEconomy}
            </p>
            <p>
              <strong>Acceleració 0-100 km/h:</strong> {selectedCarDetails.acceleration}
            </p>
            <p>
              <strong>Valoració de seguretat:</strong> {selectedCarDetails.safetyRating}
            </p>
            <p>
              <strong>Dimensions:</strong> {selectedCarDetails.dimensions}
            </p>
            <p>
              <strong>Volum de càrrega:</strong> {selectedCarDetails.cargoVolume}
            </p>
            <p>
              <strong>Característiques:</strong> {selectedCarDetails.features?.join(', ')}
            </p>
          </div>
        ) : (
          // Si no hi ha detalls per mostrar.
          <div style={{ padding: '2rem', textAlign: 'center' }}>No hi ha detalls per mostrar.</div>
        )}
      </Dialog>
    </div>
  );
}