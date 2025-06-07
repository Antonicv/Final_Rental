package dev.renting.delegations;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Endpoint
@AnonymousAllowed
public class DelegationEndpoint {

    private final DelegationRepository delegationRepository;

    @Autowired
    public DelegationEndpoint(DelegationRepository delegationRepository) {
        this.delegationRepository = delegationRepository;
    }

    // Save Delegation (Create/Update)
    public void saveDelegation(Delegation delegation) {
        if (delegation.getDelegationId() == null || delegation.getDelegationId().isEmpty()) {
            delegation.setDelegationId(UUID.randomUUID().toString());
        }
        if (delegation.getOperation() == null || delegation.getOperation().isEmpty()) {
            delegation.setOperation("profile");
        }
        delegationRepository.save(delegation);
    }

    // Save Car (Create/Update)
    public void saveCar(Car car) {
        if (car.getDelegationId() == null || car.getDelegationId().isEmpty()) {
            System.err.println("ERROR: No se puede guardar el coche, falta el ID de la delegación.");
            throw new IllegalArgumentException("Se requiere el ID de la delegación para guardar un coche.");
        }
        if (car.getOperation() == null || car.getOperation().isEmpty()) {
            car.setOperation("car#" + UUID.randomUUID().toString());
            System.out.println("DEBUG: Se generó una nueva operación (ID único) para el coche: " + car.getOperation());
        }
        delegationRepository.save(car);
    }

    /**
     * Guarda una nueva reserva. Genera un bookingId y establece la bookingDate si no se proporcionan.
     * @param booking El objeto Booking a guardar.
     */
    public void saveBooking(Booking booking) {
        System.out.println("DEBUG: saveBooking llamado para carId: " + booking.getCarId());
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            booking.setBookingId("BOOKING#" + UUID.randomUUID().toString());
        }
        booking.setBookingDate(LocalDate.now().toString());
        delegationRepository.save(booking);
        System.out.println("DEBUG: Reserva guardada con éxito.");
    }

    /**
     * Elimina una reserva de la tabla Bookings.
     * Requiere carId y startDate ya que forman la clave primaria.
     * @param carId El carId de la reserva a eliminar.
     * @param startDate La startDate de la reserva a eliminar.
     */
    public void deleteBooking(String carId, String startDate) {
        System.out.println("DEBUG: deleteBooking llamado para carId: " + carId + " y startDate: " + startDate);
        Booking bookingToDelete = new Booking();
        bookingToDelete.setCarId(carId);
        bookingToDelete.setStartDate(startDate);
        delegationRepository.delete(bookingToDelete);
        System.out.println("DEBUG: Reserva eliminada con éxito.");
    }

    /**
     * Elimina un coche de la tabla Delegations y todas sus reservas asociadas.
     * Requiere delegationId (clave de partición) y operation (clave de ordenación, que es el ID único del coche).
     * @param delegationId El delegationId al que pertenece el coche.
     * @param operation El ID de operación único del coche (e.g., "car#UUID").
     */
    public void deleteCar(String delegationId, String operation) {
        System.out.println("DEBUG: deleteCar llamado para delegationId: " + delegationId + " y operation: " + operation);

        // 1. Eliminar todas las reservas asociadas a este coche
        List<Booking> bookingsForCar = delegationRepository.listByPartitionKey(operation, Booking.class); // Usa 'operation' como carId
        if (!bookingsForCar.isEmpty()) {
            System.out.println("DEBUG: Encontradas " + bookingsForCar.size() + " reservas para el coche " + operation + ". Eliminando...");
            for (Booking booking : bookingsForCar) {
                // Se asume que Booking tiene carId como clave de partición y startDate como clave de ordenación
                deleteBooking(booking.getCarId(), booking.getStartDate());
            }
            System.out.println("DEBUG: Todas las reservas del coche " + operation + " eliminadas.");
        } else {
            System.out.println("DEBUG: No se encontraron reservas para el coche " + operation + ".");
        }

        // 2. Eliminar el coche en sí
        Car carToDelete = new Car();
        carToDelete.setDelegationId(delegationId);
        carToDelete.setOperation(operation);
        delegationRepository.delete(carToDelete);
        System.out.println("DEBUG: Coche eliminado con éxito.");
    }

    /**
     * Elimina una delegación de la tabla Delegations y todos sus coches asociados,
     * y por ende, todas las reservas de esos coches.
     * Requiere delegationId (clave de partición) y operation (clave de ordenación, e.g., "profile").
     * @param delegationId El ID de la delegación a eliminar.
     * @param operation La operación de la delegación (e.g., "profile").
     */
    public void deleteDelegation(String delegationId, String operation) {
        System.out.println("DEBUG: deleteDelegation llamado para delegationId: " + delegationId + " y operation: " + operation);

        // 1. Obtener y eliminar todos los coches asociados a esta delegación
        List<Car> carsInDelegation = delegationRepository.listAllCars().stream()
                .filter(car -> car.getDelegationId() != null && car.getDelegationId().equals(delegationId))
                .collect(Collectors.toList());

        if (!carsInDelegation.isEmpty()) {
            System.out.println("DEBUG: Encontrados " + carsInDelegation.size() + " coches en la delegación " + delegationId + ". Eliminando...");
            for (Car car : carsInDelegation) {
                // Llamar a deleteCar que a su vez elimina las reservas del coche
                deleteCar(car.getDelegationId(), car.getOperation());
            }
            System.out.println("DEBUG: Todos los coches y sus reservas asociadas de la delegación " + delegationId + " eliminados.");
        } else {
            System.out.println("DEBUG: No se encontraron coches para la delegación " + delegationId + ".");
        }

        // 2. Eliminar la delegación en sí (el item 'profile')
        Delegation delegationToDelete = new Delegation();
        delegationToDelete.setDelegationId(delegationId);
        delegationToDelete.setOperation(operation); // Asumimos "profile"
        delegationRepository.delete(delegationToDelete);
        System.out.println("DEBUG: Delegación eliminada con éxito.");
    }


    // Get Delegation by keys
    public Delegation getDelegation(String delegationId, String operation) {
        return delegationRepository.get(delegationId, operation, Delegation.class);
    }

    // Get Car by keys
    public Car getCar(String id, String operation) {
        return delegationRepository.get(id, operation, Car.class);
    }

    // List Delegations by delegationId
    public List<Delegation> listDelegationsById(String delegationId) {
        return delegationRepository.listByPartitionKey(delegationId, Delegation.class);
    }

    // List Cars by id (partition key)
    public List<Car> listCarsById(String id) {
        return delegationRepository.listByPartitionKey(id, Car.class);
    }

    // List all cars for all delegations
    public List<Car> getAllCars() {
        return delegationRepository.listAllCars();
    }

    // List all delegations with operation = "profile"
    public List<Delegation> getAllProfileDelegations() {
        System.out.println("DEBUG: getAllProfileDelegations llamado.");
        List<Delegation> allDelegations = delegationRepository.listAllDelegations();
        System.out.println("DEBUG: Delegaciones totales del repositorio: " + allDelegations.size());
        List<Delegation> profileDelegations = allDelegations.stream()
                .filter(d -> "profile".equals(d.getOperation()))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Delegaciones de perfil filtradas: " + profileDelegations.size());
        return profileDelegations;
    }

    /**
     * Busca coches disponibles por ID de delegación y rango de fechas, consultando reservas reales.
     * También filtra coches según el modo vintage.
     * @param delegationId El ID de la delegación.
     * @param startDateStr La fecha de inicio del período de alquiler (formato YYYY-MM-DD).
     * @param endDateStr La fecha de fin del período de alquiler (formato YYYY-MM-DD).
     * @param isVintageMode True si se deben mostrar coches vintage, false para coches modernos.
     * @return Una lista de coches disponibles.
     */
    public List<Car> getAvailableCars(String delegationId, String startDateStr, String endDateStr, boolean isVintageMode) {
        System.out.println("DEBUG: getAvailableCars llamado para delegationId: " + delegationId + ", inicio: " + startDateStr + ", fin: " + endDateStr + ", modo vintage: " + isVintageMode);

        LocalDate queryStartDate;
        LocalDate queryEndDate;
        try {
            queryStartDate = LocalDate.parse(startDateStr);
            queryEndDate = LocalDate.parse(endDateStr);
            System.out.println("DEBUG: Fechas analizadas con éxito. Inicio de consulta: " + queryStartDate + ", Fin de consulta: " + queryEndDate);
        } catch (DateTimeParseException e) {
            System.err.println("ERROR: No se pudieron analizar las fechas: " + e.getMessage());
            throw new IllegalArgumentException("Formato de fecha inválido. Se esperaba YYYY-MM-DD.", e);
        }

        // 1. Obtener todos los coches de esa delegación
        List<Car> carsInDelegation = delegationRepository.listAllCars().stream()
                .filter(car -> car.getDelegationId() != null && car.getDelegationId().equals(delegationId))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Número de coches encontrados en la delegación " + delegationId + ": " + carsInDelegation.size());

        // 2. Filtrar coches según el modo vintage
        List<Car> filteredByModeCars = carsInDelegation.stream()
                .filter(car -> {
                    if (isVintageMode) {
                        return car.getYear() < 2000;
                    } else {
                        return car.getYear() >= 2000;
                    }
                })
                .collect(Collectors.toList());
        System.out.println("DEBUG: Número de coches filtrados por modo (" + (isVintageMode ? "Vintage" : "Moderno") + "): " + filteredByModeCars.size());

        List<Car> availableCars = new ArrayList<>();

        // 3. Para cada coche, verificar si hay reservas superpuestas
        for (Car car : filteredByModeCars) {
            String carUniqueId = car.getOperation();
            if (carUniqueId == null || carUniqueId.isEmpty()) {
                System.err.println("ADVERTENCIA: Coche encontrado con ID único (operación) nulo o vacío. Omitiendo: " + car.getMake() + " " + car.getModel());
                continue;
            }

            System.out.println("DEBUG: Verificando reservas para el ID del coche: " + carUniqueId);
            List<Booking> bookingsForCar = delegationRepository.listByPartitionKey(carUniqueId, Booking.class);
            System.out.println("DEBUG: Número de reservas encontradas para el coche " + carUniqueId + ": " + bookingsForCar.size());

            boolean isBookedDuringPeriod = false;
            for (Booking booking : bookingsForCar) {
                System.out.println("DEBUG: Verificando reserva " + booking.getBookingId() + " (Coche: " + booking.getCarId() + ") de " + booking.getStartDate() + " a " + booking.getEndDate());
                if (booking.overlapsWith(queryStartDate, queryEndDate)) {
                    isBookedDuringPeriod = true;
                    System.out.println("DEBUG: El coche " + carUniqueId + " está reservado durante el período solicitado por la reserva " + booking.getBookingId());
                    break;
                }
            }

            if (!isBookedDuringPeriod) {
                availableCars.add(car);
                System.out.println("DEBUG: El coche " + carUniqueId + " está disponible.");
            }
        }
        System.out.println("DEBUG: Recuento final de coches disponibles encontrados: " + availableCars.size());
        return availableCars;
    }

    /**
     * Lista todas las reservas de la tabla Bookings.
     * @return Una lista de todas las reservas.
     */
    public List<Booking> getAllBookings() {
        System.out.println("DEBUG: getAllBookings llamado.");
        List<Booking> allBookings = delegationRepository.listAllItems(Booking.class);
        System.out.println("DEBUG: Reservas totales encontradas: " + allBookings.size());
        return allBookings;
    }
}
