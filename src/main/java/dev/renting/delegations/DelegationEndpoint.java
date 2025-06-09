package dev.renting.delegations; // Defineix el paquet on es troba aquesta classe Java.

import com.vaadin.flow.server.auth.AnonymousAllowed; // Anotació de Vaadin per permetre accés anònim a l'endpoint.
import com.vaadin.hilla.Endpoint; // Anotació de Hilla per marcar una classe com a endpoint de backend accessible des del frontend.
import org.springframework.beans.factory.annotation.Autowired; // Anotació de Spring per a la injecció de dependències automàtica.
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional; // Importació de la classe per a condicions de consulta de DynamoDB (tot i que no s'usa directament aquí).

import java.time.LocalDate; // Per a manejar dates sense informació d'hora.
import java.time.format.DateTimeParseException; // Importació específica per capturar errors de parsing de dates.
import java.util.ArrayList; // Per a crear llistes dinàmiques.
import java.util.List; // Interfície per a col·leccions de tipus llista.
import java.util.Optional; // Per a manejar valors que poden ser nuls. (No s'usa directament en aquest codi, però pot ser útil).
import java.util.UUID; // Per a generar identificadors únics universals.
import java.util.stream.Collectors; // Per a utilitzar operacions de col·lecció amb streams.

/**
 * Endpoint de Hilla per a la gestió de delegacions, cotxes i reserves.
 * Permet la comunicació entre el frontend de Vaadin/Hilla i el backend de Spring/DynamoDB.
 */
@Endpoint // Marca aquesta classe com un endpoint de Hilla, disponible per crides RPC des del frontend.
@AnonymousAllowed // Permet que els usuaris no autenticats puguin accedir als mètodes d'aquest endpoint.
public class DelegationEndpoint {

    // Dependència del repositori de delegacions, que s'encarrega de la persistència a DynamoDB.
    private final DelegationRepository delegationRepository;

    /**
     * Constructor de la classe, amb injecció de dependències de DelegationRepository.
     * @param delegationRepository El repositori de delegacions que s'injectarà.
     */
    @Autowired // Spring injectarà automàticament una instància de DelegationRepository.
    public DelegationEndpoint(DelegationRepository delegationRepository) {
        this.delegationRepository = delegationRepository;
    }

    /**
     * Guarda una nova delegació a la base de dades.
     * @param delegation L'objecte Delegation a guardar.
     */
    public void saveDelegation(Delegation delegation) {
        delegationRepository.save(delegation);
    }

    /**
     * Guarda un nou cotxe a la base de dades.
     * @param car L'objecte Car a guardar.
     */
    public void saveCar(Car car) {
        delegationRepository.save(car);
    }

    /**
     * Guarda una nova reserva. Genera un bookingId i assigna la bookingDate actual si no s'han proporcionat.
     * S'assumeix que el repositori pot guardar objectes Booking.
     * @param booking L'objecte Booking a guardar.
     */
    public void saveBooking(Booking booking) {
        System.out.println("DEBUG: saveBooking cridat per a carId: " + booking.getCarId());
        // Genera un bookingId si no en té cap (o si està buit).
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            booking.setBookingId("BOOKING#" + UUID.randomUUID().toString()); // Crea un ID únic.
        }
        // Assigna la data actual com a bookingDate.
        booking.setBookingDate(LocalDate.now().toString());
        delegationRepository.save(booking); // Utilitza el repositori per guardar la reserva.
        System.out.println("DEBUG: Reserva guardada exitosament.");
    }

    /**
     * Elimina una reserva de la taula de Bookings.
     * Requereix el carId i la startDate ja que formen la clau primària (Partition Key i Sort Key).
     * @param carId L'ID del cotxe de la reserva a eliminar.
     * @param startDate La data d'inici de la reserva a eliminar.
     */
    public void deleteBooking(String carId, String startDate) {
        System.out.println("DEBUG: deleteBooking cridat per a carId: " + carId + " i startDate: " + startDate);
        // Crea un objecte Booking "dummy" amb només la clau primària necessària per a l'eliminació.
        Booking bookingToDelete = new Booking();
        bookingToDelete.setCarId(carId);
        bookingToDelete.setStartDate(startDate);
        delegationRepository.delete(bookingToDelete); // S'assumeix que el repositori pot eliminar objectes Booking.
        System.out.println("DEBUG: Reserva eliminada exitosament.");
    }

    /**
     * Obté una delegació per les seves claus (delegationId i operation).
     * @param delegationId L'ID de la delegació.
     * @param operation El tipus d'operació/element (p. ex., "profile").
     * @return L'objecte Delegation trobat.
     */
    public Delegation getDelegation(String delegationId, String operation) {
        return delegationRepository.get(delegationId, operation, Delegation.class);
    }

    /**
     * Obté un cotxe per les seves claus (id i operation).
     * @param id L'ID de la delegació a la qual pertany el cotxe (clau de partició).
     * @param operation L'identificador d'operació del cotxe (clau d'ordenació).
     * @return L'objecte Car trobat.
     */
    public Car getCar(String id, String operation) {
        return delegationRepository.get(id, operation, Car.class);
    }

    /**
     * Llista totes les delegacions amb un ID de delegació específic.
     * @param delegationId L'ID de la delegació.
     * @return Una llista de Delegations.
     */
    public List<Delegation> listDelegationsById(String delegationId) {
        return delegationRepository.listByPartitionKey(delegationId, Delegation.class);
    }

    /**
     * Llista tots els cotxes per un ID de partició (que sol ser el delegationId).
     * @param id L'ID de la delegació per la qual es volen llistar els cotxes.
     * @return Una llista de Cars.
     */
    public List<Car> listCarsById(String id) {
        return delegationRepository.listByPartitionKey(id, Car.class);
    }

    /**
     * Llista tots els cotxes disponibles en totes les delegacions.
     * @return Una llista de tots els Cars.
     */
    public List<Car> getAllCars() {
        return delegationRepository.listAllCars();
    }

    /**
     * Llista totes les delegacions que tenen una 'operation' igual a "profile".
     * @return Una llista de Delegations amb operation "profile".
     */
    public List<Delegation> getAllProfileDelegations() {
        System.out.println("DEBUG: getAllProfileDelegations cridat.");
        List<Delegation> allDelegations = delegationRepository.listAllDelegations(); // Obté totes les delegacions.
        System.out.println("DEBUG: Delegacions totals del repositori: " + allDelegations.size());
        // Filtra les delegacions per aquelles amb operation "profile".
        List<Delegation> profileDelegations = allDelegations.stream()
                .filter(d -> "profile".equals(d.getOperation())) // Compara l'operació.
                .collect(Collectors.toList()); // Recull els resultats en una nova llista.
        System.out.println("DEBUG: Delegacions de perfil filtrades: " + profileDelegations.size());
        return profileDelegations;
    }

    /**
     * Cerca cotxes disponibles per ID de delegació i rang de dates, consultant reserves reals.
     * També filtra els cotxes segons el mode vintage (any de fabricació).
     *
     * @param delegationId L'ID de la delegació.
     * @param startDateStr La data d'inici del període de lloguer (format YYYY-MM-DD).
     * @param endDateStr La data de fi del període de lloguer (format YYYY-MM-DD).
     * @param isVintageMode True si s'han de mostrar cotxes vintage, false per a cotxes moderns.
     * @return Una llista de cotxes disponibles.
     * @throws IllegalArgumentException si el format de les dates no és vàlid.
     */
    public List<Car> getAvailableCars(String delegationId, String startDateStr, String endDateStr, boolean isVintageMode) {
        System.out.println("DEBUG: getAvailableCars cridat per a delegationId: " + delegationId + ", inici: " + startDateStr + ", fi: " + endDateStr + ", mode vintage: " + isVintageMode);

        LocalDate queryStartDate;
        LocalDate queryEndDate;
        try {
            // Intenta parsejar les cadenes de data a objectes LocalDate.
            queryStartDate = LocalDate.parse(startDateStr);
            queryEndDate = LocalDate.parse(endDateStr);
            System.out.println("DEBUG: Dates parsejades exitosament. Inici de consulta: " + queryStartDate + ", Fi de consulta: " + queryEndDate);
        } catch (DateTimeParseException e) {
            System.err.println("ERROR: No s'han pogut parsejar les dates: " + e.getMessage());
            // Llança una excepció per tal que el frontend rebi un error clar si el format de data és incorrecte.
            throw new IllegalArgumentException("Format de data invàlid. S'espera YYYY-MM-DD.", e);
        }

        // 1. Obté tots els cotxes de totes les delegacions i filtra per l'ID de la delegació.
        List<Car> carsInDelegation = delegationRepository.listAllCars().stream()
                .filter(car -> car.getDelegationId() != null && car.getDelegationId().equals(delegationId))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Nombre de cotxes trobats a la delegació " + delegationId + ": " + carsInDelegation.size());

        // 2. Filtra els cotxes basant-se en el mode vintage/modern.
        List<Car> filteredByModeCars = carsInDelegation.stream()
                .filter(car -> {
                    if (isVintageMode) {
                        return car.getYear() < 2000; // Exemple: els cotxes vintage són anteriors a l'any 2000.
                    } else {
                        return car.getYear() >= 2000; // Exemple: els cotxes moderns són de l'any 2000 o posteriors.
                    }
                })
                .collect(Collectors.toList());
        System.out.println("DEBUG: Nombre de cotxes filtrats per mode (" + (isVintageMode ? "Vintage" : "Modern") + "): " + filteredByModeCars.size());


        List<Car> availableCars = new ArrayList<>(); // Llista per emmagatzemar els cotxes disponibles.

        // 3. Per a cada cotxe, comprova si hi ha reserves que se superposen amb el període sol·licitat.
        for (Car car : filteredByModeCars) { // Itera sobre els cotxes ja filtrats per mode.
            String carUniqueId = car.getOperation(); // Utilitza car.getOperation() com a identificador únic del cotxe.
            if (carUniqueId == null || carUniqueId.isEmpty()) {
                System.err.println("AVÍS: Cotxe trobat amb ID (operació) nul o buit. S'omet: " + car.getMake() + " " + car.getModel());
                continue; // Omet aquest cotxe si el seu ID no és vàlid.
            }

            System.out.println("DEBUG: Comprovant reserves per a l'ID del cotxe: " + carUniqueId);
            // Obté totes les reserves per a aquest cotxe específic.
            List<Booking> bookingsForCar = delegationRepository.listByPartitionKey(carUniqueId, Booking.class);
            System.out.println("DEBUG: Nombre de reserves trobades per al cotxe " + carUniqueId + ": " + bookingsForCar.size());

            boolean isBookedDuringPeriod = false; // Bandera per indicar si el cotxe està reservat en el període.
            for (Booking booking : bookingsForCar) {
                System.out.println("DEBUG: Comprovant reserva " + booking.getBookingId() + " (Cotxe: " + booking.getCarId() + ") de " + booking.getStartDate() + " a " + booking.getEndDate());
                // Comprova si la reserva existent se superposa amb el període de consulta.
                if (booking.overlapsWith(queryStartDate, queryEndDate)) {
                    isBookedDuringPeriod = true; // Si hi ha superposició, el cotxe no està disponible.
                    System.out.println("DEBUG: El cotxe " + carUniqueId + " està reservat durant el període sol·licitat per la reserva " + booking.getBookingId());
                    break; // No cal comprovar més reserves per a aquest cotxe si ja està ocupat.
                }
            }

            // Afegeix el cotxe a la llista de disponibles només si no està reservat durant el període.
            if (!isBookedDuringPeriod) {
                availableCars.add(car);
                System.out.println("DEBUG: El cotxe " + carUniqueId + " està disponible.");
            }
        }
        System.out.println("DEBUG: Recompte final de cotxes disponibles trobats: " + availableCars.size());
        return availableCars; // Retorna la llista de cotxes disponibles.
    }

    /**
     * Llista totes les reserves de la taula de Bookings.
     * S'assumeix que el repositori pot escanejar (scan) tots els ítems del tipus Booking.
     * @return Una llista de totes les reserves.
     */
    public List<Booking> getAllBookings() {
        System.out.println("DEBUG: getAllBookings cridat.");
        // Obté totes les reserves, utilitzant un mètode de scan del repositori.
        List<Booking> allBookings = delegationRepository.listAllItems(Booking.class);
        System.out.println("DEBUG: Reserves totals trobades: " + allBookings.size());
        return allBookings;
    }
}