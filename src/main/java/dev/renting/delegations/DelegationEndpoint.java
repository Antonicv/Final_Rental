package dev.renting.delegations;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Endpoint // Marca la clase como un endpoint de Hilla
@AnonymousAllowed // Permite el acceso a este endpoint sin autenticación (ajusta según tus necesidades de seguridad)
public class DelegationEndpoint {

    private final DelegationRepository delegationRepository;

    // Inyecta el repositorio a través del constructor.
    // Se elimina la dependencia de BookingRepository.
    @Autowired
    public DelegationEndpoint(DelegationRepository delegationRepository) {
        this.delegationRepository = delegationRepository;
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
}