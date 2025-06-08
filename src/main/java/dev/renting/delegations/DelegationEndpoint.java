package dev.renting.delegations;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import dev.renting.users.Booking; // Necesario para la lógica de disponibilidad
import dev.renting.users.UserRepository; // Necesario para interactuar con reservas
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Endpoint // Marca la clase como un endpoint de Hilla
@AnonymousAllowed // Permite el acceso a este endpoint sin autenticación (ajusta según tus necesidades de seguridad)
public class DelegationEndpoint {

    private final DelegationRepository delegationRepository;
    private final UserRepository userRepository; // CAMBIO IMPORTANTE: Este campo debe ser declarado

    @Autowired
    public DelegationEndpoint(DelegationRepository delegationRepository, UserRepository userRepository) {
        this.delegationRepository = delegationRepository;
        this.userRepository = userRepository; // Inicializar
    }

    // --- Métodos relacionados con Coches ---

    /**
     * Obtiene todos los coches disponibles.
     * @return Una lista de objetos Car.
     */
    public List<Car> getAllCars() {
        return delegationRepository.findAllCars();
    }

    /**
     * Obtiene un coche por su ID.
     * @param carId El ID del coche.
     * @return El objeto Car si se encuentra, o null.
     */
    public Car getCarById(String carId) {
        return delegationRepository.findCarById(carId).orElse(null);
    }

    /**
     * Guarda un nuevo coche.
     * @param car El objeto Car a guardar.
     * @return El coche guardado.
     */
    public Car saveCar(Car car) {
        return delegationRepository.saveCar(car);
    }

    /**
     * Actualiza un coche existente.
     * @param car El objeto Car con los datos actualizados.
     * @return El coche actualizado.
     */
    public Car updateCar(Car car) {
        return delegationRepository.updateCar(car);
    }

    /**
     * Elimina un coche por su ID.
     * @param carId El ID del coche a eliminar.
     */
    public void deleteCar(String carId) {
        delegationRepository.deleteCar(carId);
    }

    // --- Métodos relacionados con Delegaciones ---

    /**
     * Obtiene todas las delegaciones.
     * @return Una lista de objetos Delegation.
     */
    public List<Delegation> getAllDelegations() {
        return delegationRepository.findAllDelegations();
    }

    /**
     * Obtiene una delegación por su ID.
     * @param delegationId El ID de la delegación.
     * @return El objeto Delegation si se encuentra, o null.
     */
    public Delegation getDelegationById(String delegationId) {
        return delegationRepository.findDelegationById(delegationId).orElse(null);
    }

    /**
     * Guarda una nueva delegación.
     * @param delegation El objeto Delegation a guardar.
     * @return La delegación guardada.
     */
    public Delegation saveDelegation(Delegation delegation) {
        return delegationRepository.saveDelegation(delegation);
    }

    /**
     * Actualiza una delegación existente.
     * @param delegation La delegación con los datos actualizados.
     * @return La delegación actualizada.
     */
    public Delegation updateDelegation(Delegation delegation) {
        return delegationRepository.updateDelegation(delegation);
    }

    /**
     * Elimina una delegación por su ID.
     * @param delegationId El ID de la delegación a eliminar.
     */
    public void deleteDelegation(String delegationId) {
        delegationRepository.deleteDelegation(delegationId);
    }

    // --- Métodos para interacciones entre Coches y Reservas (si fuera necesario en este endpoint) ---

    // Ejemplo: Marcar un coche como rentado/no rentado
    public Car setCarRentedStatus(String carId, boolean rented) {
        Optional<Car> optionalCar = delegationRepository.findCarById(carId);
        if (optionalCar.isPresent()) {
            Car car = optionalCar.get();
            car.setRented(rented ? 1 : 0);
            return delegationRepository.updateCar(car);
        }
        return null; // O lanzar una excepción
    }

    /**
     * Busca coches disponibles en una delegación y rango de fechas,
     * considerando el modo vintage.
     * @param delegationId El ID de la delegación.
     * @param startDateStr La fecha de inicio de la reserva en formato String (YYYY-MM-DD).
     * @param endDateStr La fecha de fin de la reserva en formato String (YYYY-MM-DD).
     * @param isVintageMode Si el modo vintage está activo.
     * @return Una lista de coches disponibles.
     */
    public List<Car> findAvailableCars(String delegationId, String startDateStr, String endDateStr, boolean isVintageMode) {
        LocalDate startDate, endDate;
        try {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de fin.");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha inválido. Use YYYY-MM-DD.", e);
        }

        List<Car> allCars = delegationRepository.findAllCars();
        List<Car> carsInDelegation = allCars.stream()
            .filter(car -> delegationId.equals(car.getDelegationId())) // Asegúrate de que Car.java tenga delegationId
            .filter(car -> isVintageMode == (car.getYear() != null && car.getYear() < 2000))
            .collect(Collectors.toList());

        List<Booking> allBookings = userRepository.findAllBookings();
        List<Booking> overlappingBookings = allBookings.stream()
            .filter(booking -> booking.getStartDate() != null && booking.getEndDate() != null)
            .filter(booking -> {
                try {
                    LocalDate bookingStartDate = LocalDate.parse(booking.getStartDate());
                    LocalDate bookingEndDate = LocalDate.parse(booking.getEndDate());
                    return !bookingStartDate.isAfter(endDate) && !bookingEndDate.isBefore(startDate);
                } catch (DateTimeParseException e) {
                    System.err.println("Error parsing booking date: " + e.getMessage());
                    return false;
                }
            })
            .collect(Collectors.toList());

        return carsInDelegation.stream()
            .filter(car -> car.getCarId() != null)
            .filter(car -> overlappingBookings.stream()
                .noneMatch(booking -> car.getCarId().equals(booking.getCarId())))
            .collect(Collectors.toList());
    }
}