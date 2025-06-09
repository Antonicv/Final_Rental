package dev.renting.delegations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Implementació del repositori de delegacions que utilitza DynamoDB per emmagatzemar les dades.
 * Proporciona operacions CRUD per a les entitats relacionades amb el sistema de lloguer.
 */
@Repository
public class DelegationRepositoryImpl implements DelegationRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final String delegationsTableName = "Delegations"; // Nom de la taula principal de Delegacions
    private final String bookingsTableName = "Bookings"; // Nom de la taula de Reserves

    /**
     * Constructor que rep el client de DynamoDB per injecció de dependències.
     */
    @Autowired
    public DelegationRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    /**
     * Mètode auxiliar per obtenir el nom de la taula correcta basada en la classe.
     */
    private <T> String getTableNameForClass(Class<T> clazz) {
        if (clazz.equals(Booking.class)) {
            return bookingsTableName;
        }
        // Afegir més condicions aquí si tens altres taules específiques per altres classes
        return delegationsTableName; // Per defecte, usa la taula de delegacions per altres tipus (Car, Delegation)
    }

    /**
     * Desa un element a la taula corresponent a DynamoDB.
     */
    @Override
    public <T> void save(T item) {
        // Usa el nom de taula correcte per a la classe de l'ítem
        String actualTableName = getTableNameForClass((Class<T>) item.getClass());
        DynamoDbTable<T> table =
                enhancedClient.table(
                        actualTableName,
                        TableSchema.fromBean((Class<T>) item.getClass()));
        table.putItem(item);
    }

    /**
     * Obté un element específic utilitzant la seva clau de partició i de classificació.
     */
    @Override
    public <T> T get(String partitionKey, String sortKey, Class<T> clazz) {
        // Usa el nom de taula correcte per a la classe
        String actualTableName = getTableNameForClass(clazz);
        DynamoDbTable<T> table = enhancedClient.table(actualTableName, TableSchema.fromBean(clazz));
        Key key = Key.builder()
                .partitionValue(partitionKey)
                .sortValue(sortKey)
                .build();
        return table.getItem(key);
    }

    /**
     * Llista tots els elements amb la mateixa clau de partició.
     */
    @Override
    public <T> List<T> listByPartitionKey(String partitionKey, Class<T> clazz) {
        // Usa el nom de taula correcte per a la classe
        String actualTableName = getTableNameForClass(clazz);
        DynamoDbTable<T> table = enhancedClient.table(actualTableName, TableSchema.fromBean(clazz));
        QueryConditional queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue(partitionKey));
        List<T> items = new ArrayList<>();
        // IMPORTANT: Evita orderBy() a les consultes de Firestore, ja que pot portar a errors en temps d'execució
        // degut a índexs que falten. Si es necessita ordenació, obtingui totes les dades i ordeni a memòria.
        table.query(queryConditional).items().forEach(items::add);
        return items;
    }

    /**
     * Llista tots els cotxes emmagatzemats.
     */
    @Override
    public List<Car> listAllCars() {
        // Crea un objecte de taula DynamoDB per a la classe Car, mapant a la taula "Delegations"
        DynamoDbTable<Car> table = enhancedClient.table(delegationsTableName, TableSchema.fromBean(Car.class));
        // Inicialitza un ArrayList buit per emmagatzemar els objectes Car recuperats
        List<Car> cars = new ArrayList<>();
        // Crea un HashMap per emmagatzemar els valors d'expressió per a l'expressió de filtre
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        // Afegeix un parell clau-valor al mapa, on ":val" és el marcador per a la cadena "car"
        expressionValues.put(":val", AttributeValue.builder().s("car").build());
        // Construeix una expressió de filtre per a coincidències d'ítems on la clau de classificació "operation" comenci amb "car"
        Expression filterExpression = Expression.builder()
                .expression("begins_with(operation, :val)") // Defineix l'expressió utilitzant la funció begins_with
                .expressionValues(expressionValues) // Associa el mapa de valors d'expressió
                .build(); // Construeix l'objecte Expression
        // Construeix una ScanEnhancedRequest amb l'expressió de filtre per limitar els resultats als ítems Car
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(filterExpression) // Aplica l'expressió de filtre a l'escaneig
                .build(); // Construeix l'objecte ScanEnhancedRequest
        // Executa l'operació d'escaneig i itera sobre els resultats, afegint cada ítem Car a la llista cars
        table.scan(scanRequest).items().forEach(cars::add);
        // Retorna la llista d'objectes Car
        return cars;
    }

    /**
     * Llista totes les delegacions emmagatzemades.
     */
    @Override
    public List<Delegation> listAllDelegations() {
        DynamoDbTable<Delegation> table = enhancedClient.table(delegationsTableName, TableSchema.fromBean(Delegation.class));
        List<Delegation> delegations = new ArrayList<>();
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":val", AttributeValue.builder().s("profile").build());
        Expression filterExpression = Expression.builder()
                .expression("operation = :val")
                .expressionValues(expressionValues)
                .build();
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(filterExpression)
                .build();
        table.scan(scanRequest).items().forEach(delegations::add);
        return delegations;
    }

    /**
     * Llista tots els elements d'una classe específica.
     */
    @Override
    public <T> List<T> listAllItems(Class<T> clazz) {
        // Usa el nom de taula correcte per a la classe
        String actualTableName = getTableNameForClass(clazz);
        DynamoDbTable<T> table = enhancedClient.table(actualTableName, TableSchema.fromBean(clazz));
        List<T> items = new ArrayList<>();
        table.scan(ScanEnhancedRequest.builder().build()).items().forEach(items::add);
        return items;
    }
    
    /**
     * Elimina un element genèric de la seva taula corresponent.
     */
    @Override
    public <T> void delete(T item) {
        String actualTableName = getTableNameForClass((Class<T>) item.getClass());
        DynamoDbTable<T> table = enhancedClient.table(actualTableName, TableSchema.fromBean((Class<T>) item.getClass()));
        table.deleteItem(item);
    }

    /**
     * Elimina una reserva específica de la taula de reserves.
     */
    @Override
    public void delete(Booking booking) {
        DynamoDbTable<Booking> table = enhancedClient.table("Bookings", TableSchema.fromBean(Booking.class));
        table.deleteItem(booking);
    }
}
