package dev.renting.delegations;

import java.util.List;
import java.util.Optional;

public interface DelegationRepository {

    /**
     * Guarda un coche en la tabla única.
     * @param car El objeto Car a guardar.
     * @return El coche guardado.
     */
    Car saveCar(Car car);

    /**
     * Busca un coche por su carId.
     * @param carId El ID del coche.
     * @return Un Optional que contiene el Car si se encuentra, o Optional.empty() si no.
     */
    Optional<Car> findCarById(String carId);

    /**
     * Obtiene todos los coches de la tabla única.
     * Esto puede ser costoso en DynamoDB para tablas grandes, se recomienda usar GSIs o filtrar.
     * Por ahora, lo implementaremos para cumplir con getAllCars() del frontend.
     * @return Una lista de todos los coches.
     */
    List<Car> findAllCars();

    /**
     * Actualiza un coche existente en la tabla única.
     * @param car El objeto Car con los datos actualizados.
     * @return El coche actualizado.
     */
    Car updateCar(Car car);

    /**
     * Elimina un coche por su carId.
     * @param carId El ID del coche a eliminar.
     */
    void deleteCar(String carId);

    /**
     * Guarda una delegación en la tabla única.
     * @param delegation El objeto Delegation a guardar.
     * @return La delegación guardada.
     */
    Delegation saveDelegation(Delegation delegation);

    /**
     * Busca una delegación por su delegationId.
     * @param delegationId El ID de la delegación.
     * @return Un Optional que contiene la Delegation si se encuentra, o Optional.empty() si no.
     */
    Optional<Delegation> findDelegationById(String delegationId);

    /**
     * Obtiene todas las delegaciones de la tabla única.
     * @return Una lista de todas las delegaciones.
     */
    List<Delegation> findAllDelegations();

    /**
     * Actualiza una delegación existente en la tabla única.
     * @param delegation El objeto Delegation con los datos actualizados.
     * @return La delegación actualizada.
     */
    Delegation updateDelegation(Delegation delegation);

    /**
     * Elimina una delegación por su delegationId.
     * @param delegationId El ID de la delegación a eliminar.
     */
    void deleteDelegation(String delegationId);
}