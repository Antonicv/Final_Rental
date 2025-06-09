import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button';
import { TextField } from '@vaadin/react-components/TextField';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Booking from 'Frontend/generated/dev/renting/delegations/Booking';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';
import html2pdf from 'html2pdf.js'; // IMPORTANT: Importa la llibreria

// Configuració de la vista per al router de Hilla
export const config: ViewConfig = {
  title: 'Les Meves Reserves',
};

// Funció auxiliar per netejar cadenes de text per a noms de fitxer.
// Elimina accents, substitueix espais per guions baixos i treu caràcters no alfanumèrics.
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD") // Normalitza la cadena per separar accents de les lletres base.
    .replace(/[\u0300-\u036f]/g, "") // Elimina els diacrítics (accents, etc.).
    .replace(/\s+/g, '_') // Substitueix un o més espais per un guió baix.
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Elimina qualsevol caràcter que no sigui lletra, número, guió baix, punt o guió.
}

// Funció 'type guard' per assegurar que un objecte Car té les propietats 'make', 'model' i 'year'.
function isCarWithMakeAndModel(car: Car | undefined): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  return !!car && typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}

// Funció per generar la URL de la imatge del cotxe.
// Si el cotxe és 'vintage' (any anterior a 2000), utilitza una imatge local.
// Altrament, utilitza una URL externa d'un servei d'imatges de cotxes.
const getCarThumbnailImageUrl = (car: Car) => {
  const isCurrentCarVintage = car.year < 2000;

  if (isCurrentCarVintage) {
    const localImagePath = `/images/${sanitizeFilenamePart(car.make || '')}_${sanitizeFilenamePart(car.model || '')}.webp`;
    console.log("DEBUG (BookingsView): URL d'imatge de cotxe vintage local generada:", localImagePath);
    return localImagePath;
  } else {
    const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make || '')}&modelFamily=${encodeURIComponent(car.model || '')}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
    console.log("DEBUG (BookingsView): URL d'imatge de cotxe modern externa generada:", imageUrl);
    return imageUrl;
  }
};

// Component principal de la vista de Reserves
export default function BookingsView() {
  // Estat per emmagatzemar totes les reserves carregades.
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  // Estat per emmagatzemar les reserves filtrades (mostrades actualment).
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  // Estat per emmagatzemar tots els cotxes carregats.
  const [allCars, setAllCars] = useState<Car[]>([]);
  // Estat per emmagatzemar totes les delegacions carregades.
  const [allDelegations, setAllDelegations] = useState<Delegation[]>([]);
  // Estat per indicar si les dades s'estan carregant.
  const [loading, setLoading] = useState(true);
  // Estat per emmagatzemar qualsevol missatge d'error.
  const [error, setError] = useState<string | null>(null);
  // `isVintageMode` es manté, però ja no influeix en el símbol de la moneda.
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estat per al valor del camp de text del filtre per ID d'usuari.
  const [filterUserId, setFilterUserId] = useState<string>('');


  // Efecte per escoltar els canvis a la classe 'vintage-mode' de l'element <html>.
  // S'utilitza per actualitzar l'estat `isVintageMode` del component.
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    // Observa canvis en els atributs (específicament la classe) de l'element <html>.
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    // Inicialitza l'estat en la càrrega inicial.
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    // Funció de neteja: desconnecta l'observador quan el component es desmunta.
    return () => observer.disconnect();
  }, []); // Array de dependències buit, s'executa només al muntar.

  // Funció per carregar totes les dades (reserves, cotxes, delegacions).
  // Pot rebre un `userIdToFilter` opcional per filtrar les reserves inicialment.
  const fetchAllData = async (userIdToFilter: string | null = null) => {
    console.log("DEBUG (BookingsView): Iniciant la càrrega de dades...");
    try {
      setLoading(true); // Activa l'estat de càrrega.
      setError(null); // Neteja qualsevol error previ.

      // 1. Carrega tots els cotxes.
      const carsResult = await DelegationEndpoint.getAllCars();
      const validCars = (carsResult ?? []).filter(isCarWithMakeAndModel); // Filtra per cotxes vàlids.
      setAllCars(validCars);
      console.log(`DEBUG (BookingsView): S'han carregat ${validCars.length} cotxes.`);

      // 2. Carrega totes les delegacions del perfil.
      const delegationsResult = await DelegationEndpoint.getAllProfileDelegations();
      const validDelegations = (delegationsResult ?? []).filter((d): d is Delegation => d !== undefined && d !== null);
      setAllDelegations(validDelegations);
      console.log(`DEBUG (BookingsView): S'han carregat ${validDelegations.length} delegacions.`);
      // Registra els detalls de les delegacions per a depuració.
      validDelegations.forEach(d => {
        console.log(`DEBUG (BookingsView): Delegació carregada: ID=${d.delegationId}, Nom=${d.name}, Ciutat=${d.city}, Adreça=${d.adress}, Gestor=${d.manager}, Telèfon=${d.telf}, Latitud=${d.lat}, Longitud=${d.longVal}, Quantitat Cotxes=${d.carQuantity}`);
      });

      // 3. Carrega totes les reserves.
      const bookingsResult = await DelegationEndpoint.getAllBookings();
      const validBookings = Array.isArray(bookingsResult)
        ? bookingsResult.filter((b): b is Booking => b !== undefined)
        : [];
      setAllBookings(validBookings);
      console.log(`DEBUG (BookingsView): S'han carregat ${validBookings.length} reserves.`);

      // Aplica el filtre si `userIdToFilter` està present.
      const currentFilteredBookings = userIdToFilter
        ? validBookings.filter(booking => booking.userId === userIdToFilter)
        : validBookings;
      setFilteredBookings(currentFilteredBookings); // Actualitza les reserves filtrades.

      // Estableix el missatge d'error si no es troben reserves.
      if (currentFilteredBookings.length === 0) {
        if (userIdToFilter) {
          setError(`No s'han trobat reserves per a l'usuari "${userIdToFilter}".`);
        } else {
          setError('No hi ha reserves registrades.');
        }
        console.log("DEBUG (BookingsView): No s'han trobat reserves.");
      } else {
        setError(null); // Neteja l'error si hi ha reserves.
      }
    } catch (e) {
      console.error('ERROR (BookingsView): Error en carregar totes les dades:', e);
      setError('Hi va haver un error en carregar les teves reserves. Si us plau, intenta-ho de nou més tard.');
      // Buidar tots els estats en cas d'error.
      setAllBookings([]);
      setFilteredBookings([]);
      setAllCars([]);
      setAllDelegations([]);
    } finally {
      setLoading(false); // Finalitza l'estat de càrrega.
      console.log("DEBUG (BookingsView): Càrrega de dades completada.");
    }
  };

  // Efecte per carregar les dades quan el component es munta (sense filtre inicial).
  useEffect(() => {
    fetchAllData();
  }, []); // Array de dependències buit, s'executa una única vegada al muntar.

  // Manejador per al botó de filtre per usuari.
  const handleFilterByUser = () => {
    fetchAllData(filterUserId); // Crida a `fetchAllData` amb l'ID d'usuari del filtre.
  };

  // Manejador per al botó "Mostrar Totes les Reserves".
  const handleShowAllBookings = () => {
    setFilterUserId(''); // Neteja el camp de filtre.
    fetchAllData(null); // Crida a `fetchAllData` sense filtre per mostrar totes les reserves.
  };

  // Funció per obtenir els detalls del cotxe a partir del seu ID d'operació.
  const getCarDetails = (carId: string) => {
    return allCars.find(car => car.operation === carId);
  };

  // Funció per obtenir els detalls de la delegació.
  const getDelegationDetails = (delegationId: string) => {
    return allDelegations.find(delegation => delegation.delegationId === delegationId);
  };

  // Manejador per eliminar una reserva.
  const handleDeleteBooking = async (booking: Booking) => {
    // Validació bàsica de les dades necessàries per eliminar una reserva.
    if (!booking.carId || !booking.startDate) {
      setError('Error: No es pot eliminar la reserva. Falten dades clau (ID del cotxe o data d\'inici).');
      return;
    }
    console.log(`DEBUG (Frontend): Intentant eliminar la reserva amb carId: "${booking.carId}" i startDate: "${booking.startDate}"`);
    const confirmed = true; // Substituir amb una confirmació de modal personalitzada.

    if (confirmed) {
      try {
        // Crida a l'endpoint del backend per eliminar la reserva.
        await DelegationEndpoint.deleteBooking(booking.carId, booking.startDate);
        setError(`Reserva ${booking.bookingId} eliminada amb èxit.`);
        // Recarregar totes les reserves per actualitzar la llista, aplicant el filtre si existeix.
        await fetchAllData(filterUserId || null);
      } catch (e) {
        console.error('ERROR (BookingsView): Error en eliminar la reserva:', e);
        setError('Hi va haver un error en eliminar la reserva. Si us plau, intenta-ho de nou.');
      }
    }
  };

  // Manejador per modificar una reserva (marcador de posició).
  const handleModifyBooking = (booking: Booking) => {
    setError(`La funcionalitat de modificar la reserva ${booking.bookingId} encara no està implementada.`);
    console.log('Modificar reserva:', booking);
  };

  // --- NOVA FUNCIÓ PER DESCARREGAR EL PDF DE LA RESERVA ---
  const handleDownloadPdf = async (booking: Booking) => {
    console.log('Generant PDF per a la reserva:', booking);

    // 1. Troba l'element HTML de la reserva específica.
    // Utilitza un atribut `data-booking-id` afegit a l'element `<li>` per a una identificació precisa.
    const bookingElement = document.querySelector(`li[data-booking-id="${booking.bookingId}"]`);

    if (bookingElement) {
      setError(null); // Neteja qualsevol error previ.

      // Opcional: Clona el node per netejar-lo de botons i CSS no desitjat abans de generar el PDF.
      // Això assegura que només el contingut visible es converteixi i no els botons d'acció.
      const clonedElement = bookingElement.cloneNode(true) as HTMLElement;

      // Eliminar els botons d'acció del clon perquè no apareguin al PDF.
      const buttonsDiv = clonedElement.querySelector('.print-buttons');
      if (buttonsDiv) {
        buttonsDiv.remove(); // Elimina l'element que conté els botons.
      }

      // Opcions per a html2pdf.
      const pdfOptions = {
        margin: 10, // Marge al voltant del contingut del PDF (en mm).
        filename: `Reserva_${booking.bookingId}.pdf`, // Nom del fitxer PDF.
        image: { type: 'jpeg', quality: 0.98 }, // Qualitat de les imatges incrustades.
        html2canvas: { scale: 2, useCORS: true }, // 'scale' per a millor qualitat, 'useCORS' per a imatges externes.
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } // Unitats, format i orientació del PDF.
      };

      try {
        // Genera el PDF a partir de l'element clonat i el descarrega.
        await html2pdf().from(clonedElement).set(pdfOptions).save();
        setError(`PDF de la reserva ${booking.bookingId} generat i descarregat amb èxit.`);
      } catch (e) {
        console.error('ERROR (BookingsView): Error en generar el PDF:', e);
        setError('Hi va haver un error en generar el PDF de la reserva. Si us plau, intenta-ho de nou.');
      }

    } else {
      console.error('ERROR (BookingsView): No s\'ha pogut trobar l\'element de la reserva per a la generació del PDF amb ID:', booking.bookingId);
      setError('No s\'ha pogut trobar la reserva per generar el PDF. Si us plau, intenta-ho de nou.');
    }
  };
  // --- FI NOVA FUNCIÓ ---

  // Defineix el tipus de canvi d'Euro a Pesseta (es manté per referència, però NO s'utilitza per a la conversió aquí).
  const EUR_TO_PTS_RATE = 166.386; 

  return (
    // Contenidor principal de la vista.
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      {/* Títol principal de la secció. */}
      <h2 className="text-2xl font-bold mb-4">Les Meves Reserves</h2>

      {/* Secció de filtre d'usuari */}
      <div className="flex gap-2 mb-4 items-end filter-section">
        {/* Camp de text per introduir l'ID d'usuari a filtrar. */}
        <TextField
          label="Filtrar per ID d'Usuari"
          placeholder="Ex: USER#001"
          value={filterUserId}
          onValueChanged={({ detail }) => setFilterUserId(detail.value)}
        />
        {/* Botó per aplicar el filtre. */}
        <Button theme="primary" onClick={handleFilterByUser}>
          Filtrar
        </Button>
        {/* Botó per mostrar totes les reserves (netejar filtre). */}
        <Button theme="tertiary" onClick={handleShowAllBookings}>
          Mostrar Totes
        </Button>
      </div>

      {/* Missatge de càrrega. */}
      {loading && (
        <p className="text-gray-600">Carregant reserves...</p>
      )}

      {/* Missatge d'error. */}
      {error && (
        <div className="text-red-600 font-bold mt-4">{error}</div>
      )}

      {/* Missatge si no hi ha reserves després de la càrrega/filtratge. */}
      {!loading && !error && filteredBookings.length === 0 && (
        <p className="text-gray-600 mt-4">No tens reserves registrades {filterUserId ? `per a l'usuari "${filterUserId}"` : ''}.</p>
      )}

      {/* Llista de reserves si hi ha dades i no hi ha errors. */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="w-full max-w-5xl text-left">
          <ul className="list-none p-0">
            {filteredBookings.map(booking => {
              // Obté els detalls del cotxe i la delegació per a cada reserva.
              const car = getCarDetails(booking.carId || '');
              const delegation = getDelegationDetails(booking.delegationId || '');
              // Determina si el cotxe actual és vintage basant-se en el seu any.
              const isCurrentCarVintage = car ? car.year < 2000 : false;

              let totalPrice = 'N/A';
              let duration = 0;
              // Calcula el preu total i la durada de la reserva.
              if (car && booking.startDate && booking.endDate) {
                try {
                  const start = new Date(booking.startDate);
                  const end = new Date(booking.endDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Durada en dies.
                  if (duration === 0 && booking.startDate === booking.endDate) {
                    duration = 1; // Si és el mateix dia, compta com 1 dia.
                  } else if (duration > 0) {
                    duration = duration + 1; // Afegeix 1 per incloure el dia d'inici.
                  }

                  if (duration > 0) {
                    const calculatedPrice = car.price * duration;
                    // **MODIFICACIÓ CLAU**: Usa només `isCurrentCarVintage` per determinar el símbol de la moneda.
                    totalPrice = isCurrentCarVintage
                      ? `${calculatedPrice.toFixed(2)} Pts` // Mostra el valor original amb "Pts" si és vintage.
                      : `${calculatedPrice.toFixed(2)} €`; // Altrament, mostra amb "€".
                  } else {
                    totalPrice = 'Dates Invàlides';
                  }
                } catch (e) {
                  console.error(`ERROR (BookingsView): Error en calcular el preu total per a la reserva ${booking.bookingId}:`, e);
                  totalPrice = 'Error de Càlcul';
                }
              }

              console.log(`DEBUG (BookingsView): Processant la reserva ${booking.bookingId}`);
              console.log(`DEBUG (BookingsView): Cotxe trobat per a la reserva:`, car);
              console.log(`DEBUG (BookingsView): Delegació trobada per a la reserva:`, delegation);
              if (delegation) {
                console.log(`DEBUG (BookingsView): Detalls de la Delegació: Nom=${delegation.name}, Ciutat=${delegation.city}, Adreça=${delegation.adress}, Gestor=${delegation.manager}, Telèfon=${delegation.telf}, Latitud=${delegation.lat}, Longitud=${delegation.longVal}, Quantitat Cotxes=${delegation.carQuantity}`);
              } else {
                console.log(`DEBUG (BookingsView): No s'han trobat detalls de la delegació per a l'ID: ${booking.delegationId}`);
              }

              return (
                <li
                  key={booking.bookingId}
                  data-booking-id={booking.bookingId} // IMPORTANT: Afegeix aquest atribut de dades per a la selecció del PDF.
                  className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  <div className="flex flex-col sm:flex-row w-full gap-4">
                    {/* Secció d'Imatge (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 flex items-center justify-center p-2">
                      {car && isCarWithMakeAndModel(car) ? (
                        <img
                          src={getCarThumbnailImageUrl(car)} // Obté la URL de la imatge del cotxe.
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-[300px] object-cover rounded-lg"
                          onError={(e) => {
                            console.error("ERROR (BookingsView): No s'ha pogut carregar la imatge del cotxe:", e.currentTarget.src, e);
                            (e.target as HTMLImageElement).src = 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image'; // Imatge de fallback en cas d'error.
                          }}
                        />
                      ) : (
                        <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded-lg">
                          <p className="text-gray-500 text-sm">Cotxe No Trobat</p>
                        </div>
                      )}
                    </div>

                    {/* Secció de Detalls de la Reserva i el Cotxe (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 p-2 border-b sm:border-b-0 sm:border-r border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalls de la Reserva</h3>
                      <p className="text-gray-700">
                        <span className="font-medium">Usuari:</span> {booking.userId || 'N/A'}
                      </p>
                      {car ? (
                        <>
                          <p className="text-gray-700">
                            <span className="font-medium">Cotxe:</span> {car.make || 'N/A'} {car.model || 'N/A'} ({car.year || 'N/A'}) - {car.color || 'N/A'}
                          </p>
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">Data de Reserva:</span> {booking.bookingDate || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Dates:</span> {booking.startDate || 'N/A'} a {booking.endDate || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Preu per dia:</span>{' '}
                            <strong>
                              {/* **MODIFICACIÓ CLAU**: Usa només `isCurrentCarVintage` per determinar el símbol de la moneda. */}
                              {isCurrentCarVintage
                                ? `${car.price?.toFixed(2) || 'N/A'} Pts` // Mostra el valor original amb "Pts".
                                : `${car.price?.toFixed(2) || 'N/A'} €`}
                            </strong>
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Nombre de dies reservats:</span> {duration > 0 ? duration : 'N/A'}
                          </p>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            <span className="text-purple-700">Preu Total:</span> {totalPrice}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-700"><span className="font-medium">Cotxe:</span> Detalls No Disponibles</p>
                      )}
                      <p className="text-gray-700 text-sm">
                        <span className="text-blue-600">ID de Reserva:</span> {booking.bookingId || 'N/A'}
                      </p>
                    </div>

                    {/* Secció de Detalls de la Delegació (1/3) */}
                    <div className="flex-1 w-full sm:w-1/3 p-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalls de la Delegació</h3>
                      {delegation ? (
                        <>
                          <p className="text-gray-700">
                            <span className="font-medium">Delegació:</span> {delegation.name || 'N/A'} ({delegation.city || 'N/A'})
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Adreça:</span> {delegation.adress || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Gestor:</span> {delegation.manager || 'N/A'}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Telèfon:</span> {delegation.telf || 'N/A'}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-700"><span className="font-medium">Delegació:</span> Detalls No Disponibles</p>
                      )}
                    </div>
                  </div>
                  {/* Botons sota les tres seccions */}
                  <div className="flex gap-2 mt-4 justify-center sm:justify-start w-full print-buttons">
                    {/* Botó per eliminar la reserva. */}
                    <Button theme="error small" onClick={() => handleDeleteBooking(booking)}>
                      Eliminar
                    </Button>
                    {/* Botó per modificar la reserva (funcionalitat no implementada). */}
                    <Button theme="tertiary small" onClick={() => handleModifyBooking(booking)}>
                      Modificar
                    </Button>
                    {/* Botó per DESCARREGAR PDF. */}
                    <Button theme="contrast small" onClick={() => handleDownloadPdf(booking)}>
                      Descarregar PDF
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