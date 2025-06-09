package dev.renting.delegations;

import java.util.List;

/**
 * Interfície que defineix les operacions de persistència per a les delegacions.
 * Proporciona mètodes per desar, obtenir i llistar diferents tipus d'entitats.
 */
public interface DelegationRepository {

    /**
     * Desa un element a la base de dades.
     * @param item Element que cal desar
     */
    <T> void save(T item);

    /**
     * Obté un element específic utilitzant les seves claus.
     * @param partitionKey Clau de partició de l'element
     * @param sortKey Clau d'ordenació de l'element
     * @param clazz Classe de l'element a obtenir
     * @return L'element sol·licitat
     */
    <T> T get(String partitionKey, String sortKey, Class<T> clazz);

    /**
     * Llista tots els elements amb la mateixa clau de partició.
     * @param partitionKey Clau de partició per filtrar
     * @param clazz Classe dels elements a obtenir
     * @return Llista d'elements amb la clau de partició especificada
     */
    <T> List<T> listByPartitionKey(String partitionKey, Class<T> clazz);

    /**
     * Llista tots els cotxes disponibles.
     * @return Llista de tots els cotxes
     */
    List<Car> listAllCars();

    /**
     * Llista totes les delegacions registrades.
     * @return Llista de totes les delegacions
     */
    List<Delegation> listAllDelegations();

    /**
     * Llista tots els elements d'una classe específica.
     * @param clazz Classe dels elements a llistar
     * @return Llista de tots els elements de la classe especificada
     */
    <T> List<T> listAllItems(Class<T> clazz);
    
    /**
     * Elimina un element de la base de dades.
     * @param item Element que cal eliminar
     */
    <T> void delete(T item);
    
    /**
     * Elimina una reserva específica.
     * @param booking La reserva que cal eliminar
     */
    void delete(Booking booking);
}
