import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { Button } from '@vaadin/react-components/Button'; // Importar Button
import { Dialog } from '@vaadin/react-components/Dialog'; // Importar Dialog
import { DatePicker } from '@vaadin/react-components/DatePicker'; // Importar DatePicker
import { Select } from '@vaadin/react-components/Select'; // Importar Select per a les delegacions
import { DelegationEndpoint } from 'Frontend/generated/endpoints'; // Importar DelegationEndpoint
import Car from 'Frontend/generated/dev/renting/delegations/Car'; // Importar Car per a tipat
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation'; // Importar Delegation per a tipat
import Booking from 'Frontend/generated/dev/renting/delegations/Booking'; // Importar el tipus Booking
import { useNavigate } from 'react-router-dom'; // Importar useNavigate per a la navegació

// Configuració de la vista per al router de Hilla
export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/home-solid.svg' },
  title: 'home'
};

// Funció d'ajuda per a normalitzar cadenes per a noms de fitxer
// Elimina accents, diacrítics, reemplaça espais amb guions baixos i neteja caràcters no permesos.
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD") // Normalitza a la forma de descomposició canònica (ex. 'ë' -> 'e' + '¨')
    .replace(/[\u0300-\u036f]/g, "") // Elimina les marques diacrítiques (accents, dièresis, etc.)
    .replace(/\s+/g, '_') // Reemplaça un o més espais amb un guió baix
    .replace(/[^a-zA-Z0-9_.-]/g, ''); // Elimina qualsevol caràcter que no sigui alfanumèric, guió baix, punt o guió
}

// Funció de guarda de tipus per a assegurar que l'objecte Car té propietats 'make', 'model' i 'year'
function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year: number; color?: string; price?: number; rented?: boolean; } {
  return typeof car.make === 'string' && typeof car.model === 'string' && typeof car.year === 'number';
}


// Component principal de la vista Home
export default function HomeView() {
  const navigate = useNavigate(); // Hook per a la navegació programàtica

  // Estat per a controlar si el mode vintage està actiu (llegit de l'element <html>)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));
  // Estat per a controlar la visibilitat del diàleg del calendari
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Estat per a controlar la visibilitat del diàleg de resultats de cotxes
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Estats per a les dates seleccionades en el DatePicker
  const [startDate, setStartDate] = useState<string | null>(null);
  // Estats per a les dates seleccionades en el DatePicker
  const [endDate, setEndDate] = useState<string | null>(null);
  // Estat per a l'ID de la delegació seleccionada en el Select
  const [selectedDelegationId, setSelectedDelegationId] = useState<string | null>(null);
  // Estat per al nom/ciutat de la delegació seleccionada (per mostrar a la UI)
  const [selectedDelegationLabel, setSelectedDelegationLabel] = useState<string | null>(null);
  // Estat per a les opcions del Select de delegacions, obtingudes del backend
  const [delegationOptions, setDelegationOptions] = useState<{ value: string; label: string; city: string }[]>([]);
  // Estat per a emmagatzemar els cotxes disponibles després de la cerca
  const [availableCarsResult, setAvailableCarsResult] = useState<Car[] | null>(null);
  // Estat per a missatges d'error o advertència a la UI
  const [searchMessage, setSearchMessage] = useState<string | null>(null);


  // useEffect per a escoltar canvis en la classe 'vintage-mode' de l'element <html>
  // Això permet que HomeView reaccioni a l'activació/desactivació del mode vintage des de MainLayout.
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      // Actualitza l'estat isVintageMode si la classe 'vintage-mode' canvia
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });

    // Observa canvis en els atributs de l'element <html>, específicament en la classe
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });

    // Realitza una comprovació inicial de l'estat del mode vintage en muntar el component
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));

    // Funció de neteja per a desconnectar l'observador quan el component es desmunti
    return () => observer.disconnect();
  }, []); // L'array de dependències buit assegura que aquest efecte s'executi només una vegada en muntar

  // useEffect per a carregar les delegacions disponibles des del backend en muntar el component
  useEffect(() => {
    DelegationEndpoint.getAllProfileDelegations()
      .then(delegations => {
        // FIX: Assegurar-se que 'delegations' no sigui undefined abans de mapejar
        // i que cada 'd' dins de 'delegations' no sigui undefined.
        const options = (delegations ?? [])
          .filter((d): d is Delegation => d !== undefined && d !== null) // Filtra elements nuls/undefined
          .map(d => ({
            value: d.delegationId || '', // El valor de l'opció serà el delegationId
            label: d.name || d.city || '', // L'etiqueta visible serà el nom o la ciutat
            city: d.city || '' // Guardem la ciutat també si la necessitem per mostrar
          }));
        setDelegationOptions(options); // Actualitza l'estat amb les opcions de delegació
      })
      .catch(error => {
        console.error("Error fetching delegations:", error); // Log d'error si falla l'obtenció
      });
  }, []); // L'array de dependències buit assegura que aquest efecte s'executi només una vegada en muntar

  // Manejador per al botó "Buscar Disponibilitat" dins del diàleg
  const handleAvailabilitySearch = async () => {
    setSearchMessage(null); // Neteja qualsevol missatge de cerca anterior
    if (startDate && endDate && selectedDelegationId) {
      // Validació bàsica de dates
      if (new Date(startDate) > new Date(endDate)) {
        setSearchMessage('La data de fi no pot ser anterior a la data d\'inici.');
        return;
      }

      try {
        // Crida al backend per obtenir els cotxes disponibles
        const carsResult = await DelegationEndpoint.getAvailableCars(selectedDelegationId, startDate, endDate, isVintageMode);

        // Filtrar els undefined abans d'actualitzar l'estat
        const cars = (carsResult ?? []).filter((car): car is Car => car !== undefined && car !== null);

        setAvailableCarsResult(cars); // Actualitza l'estat amb els cotxes trobats
        setIsCalendarOpen(false); // Tanca el diàleg del calendari
        setIsResultsDialogOpen(true); // Obre el diàleg de resultats

        if (cars.length === 0) {
          setSearchMessage('No es van trobar cotxes disponibles per a la delegació i dates seleccionades.');
        } else {
          setSearchMessage(null); // Neteja el missatge si es troben cotxes
        }
      } catch (error) {
        console.error('Error en la cerca de disponibilitat:', error);
        setAvailableCarsResult([]); // Estableix els resultats a buit en cas d'error
        setIsCalendarOpen(false); // Tanca el diàleg del calendari
        setIsResultsDialogOpen(true); // Obre el diàleg de resultats
        setSearchMessage('Hi va haver un error en la cerca de disponibilitat. Si us plau, intenta-ho de nou més tard.');
      }
    } else {
      setSearchMessage('Si us plau, selecciona ambdues dates i una delegació.'); // Missatge si falten dades
    }
  };

  // Manejador per a reservar un cotxe
  const handleBookCar = async (car: Car) => {
    if (!selectedDelegationId || !startDate || !endDate) {
      setSearchMessage('Error: Les dates o la delegació no estan seleccionades per a la reserva.');
      setIsResultsDialogOpen(false); // Tanca el diàleg de resultats si hi ha un error de dades
      return;
    }

    const userId = "USER#001"; // ID d'usuari fix per a l'exemple
    const carUniqueId = car.operation; // L'ID únic del cotxe és el seu 'operation'

    if (!carUniqueId) {
      setSearchMessage('Error: ID de cotxe no disponible per reservar.');
      // No tancar el diàleg de resultats perquè l'usuari vegi el missatge
      return;
    }

    // Creació de l'objecte Booking
    const booking: Booking = {
      carId: carUniqueId,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
      delegationId: selectedDelegationId, // Usem l'ID de la delegació seleccionada
      bookingId: '', // Serà generat pel backend
      bookingDate: '' // Serà generat pel backend
    };

    try {
      await DelegationEndpoint.saveBooking(booking); // Crida al backend per guardar la reserva
      setSearchMessage(`Cotxe ${car.make} ${car.model} reservat amb èxit.`);
      // Opcional: Tornar a buscar disponibilitat per actualitzar la llista (si la reserva afecta la disponibilitat immediata)
      // Això és important perquè el cotxe reservat desaparegui de la llista
      await handleAvailabilitySearch(); // Re-executa la cerca per actualitzar la llista
      // No tanquem el diàleg de resultats automàticament perquè l'usuari vegi el missatge d'èxit
    } catch (error) {
      console.error('Error en la reserva del cotxe:', error);
      setSearchMessage('Error en la reserva del cotxe. Si us plau, intenta-ho de nou.');
      // Mantenir el diàleg de resultats obert per mostrar el missatge d'error
    }
  };

  // Manejador per a navegar a la pàgina de reserves
  const handleViewAllBookings = () => {
    navigate('/my-bookings'); // Navega a la nova ruta /my-bookings
  };

  // Funció per a generar URL d'imatge de placeholder o API externa
  const getCarThumbnailImageUrl = (car: Car) => {
    // Verifiquem que car tingui les propietats necessàries
    if (!car.make || !car.model) {
      // Retornar una imatge per defecte o placeholder si no té dades
      return 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image';
    }

    const isCarVintageBasedOnYear = car.year < 2000; // Comprova si el cotxe és vintage basant-se en l'any

    // Utilitza el camí local només si el mode vintage està ACTIU I el cotxe és vintage per l'any
    if (isVintageMode && isCarVintageBasedOnYear) {
      const localImagePath = `/images/${sanitizeFilenamePart(car.make)}_${sanitizeFilenamePart(car.model)}.webp`;
      console.log("DEBUG: Generated local vintage car image URL:", localImagePath);
      return localImagePath;
    } else {
      // Utilitza l'API externa per a cotxes moderns o quan el mode vintage no està actiu
      const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make)}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`;
      console.log("DEBUG: Generated external modern car image URL:", imageUrl);
      return imageUrl;
    }
  };

  // Obté la data d'avui en format AAAA-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Més 1 perquè els mesos són base 0
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    // Contenidor principal de la vista, centrat i amb padding
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      {/* Lògica condicional per a la imatge principal (logotip o planta buida) */}
      <img
        style={{ width: '200px' }} // Estil en línia per a l'amplada de la imatge
        src={isVintageMode ? "/images/empty-plant.png" : "/images/NewLogo.webp"} // Tria la imatge segons el mode vintage
        alt={isVintageMode ? "Empty Plant" : "New Logo"} // Text alternatiu per a l'accessibilitat
        onError={(e) => { // Manejador d'errors de càrrega d'imatge
          console.error("ERROR: Failed to load main image:", e.currentTarget.src, e); // Log d'error
          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Image+Not+Found'; // Imatge de fallback
        }}
      />
      {/* Lògica condicional per al títol principal (H2) */}
      <h2>
        {isVintageMode ? "Vehículos a Pupilaje" : "Tu Próximo Vehículo te Espera"} {/* Títol segons el mode */}
      </h2>
      {/* Lògica condicional per al subtítol (H3 o P amb format) */}
      {isVintageMode ? (
        // Paràgraf amb text de mode vintage
        <p>
          Automóviles de postín para caballeros de distinción. ¿Desea usted conducir como un prócer, pero pagar como un jornalero? En nuestra casa de alquiler, el porvenir rueda sobre cuatro ruedas.
          <br/>
          <strong>Súbase, arranque, deslúmbrese… y luego lo devuelve, claro. Motores modernos para espíritus de aventureros, con los últimos, últimos avances del progreso mecánico. Alquile hoy, presuma mañana. Y repita pasado.</strong>
        </p>
      ) : (
        // Títol H3 per al mode modern
        <h3>
          Explora nuestra amplia selección de vehículos modernos y de alto rendimiento.
        </h3>
      )}

      {/* Contenidor per als botons "Ver Disponibilidad" i "Ver Todas las Reservas" */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        {/* Botó per obrir el diàleg del calendari */}
        <Button
          theme="primary" // Tema del botó
          onClick={() => {
            setIsCalendarOpen(true); // Obre el diàleg del calendari
            setSearchMessage(null); // Neteja missatges de cerca anteriors
            setAvailableCarsResult(null); // Neteja resultats anteriors
          }}
        >
          Ver Disponibilidad
        </Button>

        {/* Botó: Ver Todas las Reservas */}
        <Button
          theme="primary" // Tema del botó
          onClick={handleViewAllBookings} // Crida a la funció de navegació
        >
          Ver Todas las Reservas
        </Button>
      </div>

      {/* Missatge de cerca (errors/advertències) - es mostra aquí si els diàlegs no estan oberts */}
      {searchMessage && !isResultsDialogOpen && (
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          {searchMessage}
        </div>
      )}

      {/* Component Dialog per al calendari i selecció de delegació */}
      <Dialog
        headerTitle="Seleccionar Fechas y Delegación" // Títol del diàleg
        opened={isCalendarOpen} // Controla si el diàleg està obert
        onOpenedChanged={({ detail }) => setIsCalendarOpen(detail.value)} // Maneja canvis en l'estat d'obertura
        overlayClass="custom-dialog-overlay" // Classe CSS per a la superposició
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {/* Selector de data d'inici */}
          <DatePicker
            label="Fecha de Inicio" // Etiqueta del camp
            value={startDate || ''} // Valor del camp (data seleccionada)
            onValueChanged={({ detail }) => setStartDate(detail.value)} // Maneja el canvi de valor
            min={getTodayDateString()} // Impedeix seleccionar dates passades
            style={{ width: '100%' }} // Amplada completa
          />
          {/* Selector de data de fi */}
          <DatePicker
            label="Fecha de Fin" // Etiqueta del camp
            value={endDate || ''} // Valor del camp
            onValueChanged={({ detail }) => setEndDate(detail.value)} // Maneja el canvi de valor
            min={startDate || getTodayDateString()} // Impedeix seleccionar dates passades o anteriors a la d'inici
            style={{ width: '100%' }} // Amplada completa
          />
          {/* Selector de delegació */}
          <Select
            label="Delegación" // Etiqueta del camp
            items={delegationOptions} // Opcions per al selector (obtingudes del backend)
            value={selectedDelegationId || ''} // Valor seleccionat
            onValueChanged={({ detail }) => setSelectedDelegationId(detail.value)} // Maneja el canvi de valor
            placeholder="Selecciona una delegación" // Text del placeholder
            style={{ width: '100%' }} // Amplada completa
          />
          {/* Botó per buscar disponibilitat */}
          <Button theme="primary" onClick={handleAvailabilitySearch} style={{ marginTop: '1rem' }}>
            Buscar Disponibilidad
          </Button>
        </div>
      </Dialog>

      {/* Diàleg per mostrar els resultats de cotxes disponibles */}
      <Dialog
        headerTitle={`Coches Disponibles en ${selectedDelegationLabel || 'la delegación seleccionada'}`} // Títol del diàleg dinàmic
        opened={isResultsDialogOpen} // Controla si el diàleg està obert
        onOpenedChanged={({ detail }) => { // Maneja canvis en l'estat d'obertura
          setIsResultsDialogOpen(detail.value);
          if (!detail.value) {
            setSearchMessage(null); // Neteja missatges de cerca en tancar el diàleg
          }
        }}
        overlayClass="custom-dialog-overlay" // Classe CSS per a la superposició
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          {/* Mostra missatges de cerca dins del diàleg de resultats */}
          {searchMessage && (
            <p style={{ color: 'red', fontWeight: 'bold' }}>{searchMessage}</p>
          )}
          {/* Lògica per mostrar els cotxes disponibles o un missatge si no n'hi ha */}
          {availableCarsResult && availableCarsResult.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {availableCarsResult.map(car => (
                // Assegura't que el cotxe té les propietats necessàries abans de renderitzar la imatge
                isCarWithMakeAndModel(car) && (
                  <li key={`${car.delegationId}-${car.operation}-${car.make}-${car.model}`} style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* Imatge del cotxe (miniatura) */}
                    <img
                      src={getCarThumbnailImageUrl(car)} // Utilitzem la nova funció per a la URL de la imatge
                      alt={`${car.make} ${car.model}`} // Text alternatiu
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }}
                      onError={(e) => { // Manejador d'errors de càrrega d'imatge
                        console.error("ERROR: Failed to load car thumbnail image:", e.currentTarget.src, e); // Log d'error
                        (e.target as HTMLImageElement).src = 'https://placehold.co/150x100/E0E0E0/333333?text=No+Image'; // Imatge de fallback
                      }}
                    />
                    {/* Informació del cotxe i preu */}
                    <span>
                      <strong>{car.make} {car.model}</strong> ({car.year}) - {car.color} -{' '}
                      {/* MODIFICACIÓ CLAU AQUÍ: Canvia el símbol de moneda segons isVintageMode */}
                      {isVintageMode ? `${car.price?.toFixed(2) || 'N/A'} Pts` : `${car.price?.toFixed(2) || 'N/A'} €`}
                    </span>
                    {/* Botó per reservar el cotxe */}
                    <Button theme="primary" onClick={() => handleBookCar(car)} style={{ marginTop: '1rem' }}>
                      Reservar
                    </Button>
                  </li>
                )
              ))}
            </ul>
          ) : (
            // Missatge si no hi ha cotxes disponibles i no hi ha un missatge d'error ja mostrat
            !searchMessage && <p>No es van trobar cotxes disponibles per a la delegació i dates seleccionades.</p>
          )}
          {/* Botó per tancar el diàleg de resultats */}
          <Button theme="primary" onClick={() => setIsResultsDialogOpen(false)} style={{ marginTop: '1rem' }}>
            Cerrar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}