package dev.renting.delegations;

import java.util.List;

public interface DelegationRepository {

    <T> void save(T item);

    <T> T get(String partitionKey, String sortKey, Class<T> clazz);

    <T> List<T> listByPartitionKey(String partitionKey, Class<T> clazz);

    List<Car> listAllCars();

    List<Delegation> listAllDelegations();

    <T> List<T> listAllItems(Class<T> clazz);
}
