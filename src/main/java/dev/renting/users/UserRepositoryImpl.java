// Implementació del repositori d'usuaris que utilitza DynamoDB per emmagatzemar i recuperar dades d'usuari
package dev.renting.users;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Repository
public class UserRepositoryImpl implements UserRepository {

    // Client millorat de DynamoDB per interactuar amb la base de dades
    private final DynamoDbEnhancedClient enhancedClient;
    // Nom de la taula a DynamoDB on s'emmagatzemen els usuaris
    private final String tableName = "Users";

    // Constructor que injecta el client DynamoDB millorat
    @Autowired
    public UserRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    // Mètode genèric per desar qualsevol tipus d'ítem a la taula
    @Override
    public <T> void save(T item) {
        DynamoDbTable<T> table =
                enhancedClient.table(
                        tableName,
                        TableSchema.fromBean((Class<T>) item.getClass()));
        table.putItem(item);
    }

    // Cerca totes les reserves d'un usuari utilitzant el seu ID
    @Override
    public List<Booking> findBookingsByUserId(String userId) {
        // Aquest client crea una referència a la nostra taula DynamoDB
        // indicant a l'SDK que mapegi els elements de la taula a la nostra classe Booking
        DynamoDbTable<Booking> table = enhancedClient.table(tableName, TableSchema.fromBean(Booking.class));

        // Suposant que 'Booking' té una clau de partició anomenada "userId"
        // Llista buida on recollirem totes les reserves trobades per a l'usuari
        List<Booking> bookings = new ArrayList<>();

        // Consulta per elements on la clau de partició sigui igual a userId i la clau d'ordenació comenci amb "booking"
        Iterator<Booking> results = table.query(
                r -> r.queryConditional(
                        QueryConditional.sortBeginsWith(
                                Key.builder()
                                        .partitionValue(userId)
                                        .sortValue("booking")
                                        .build()
                        )
                )
        ).items().iterator();
        // Obtenim un iterador sobre els resultats de la consulta
        // Cada element es mapeja a un objecte Booking

        // Recorrem els resultats de la consulta i els afegim a la llista 'bookings'
        results.forEachRemaining(bookings::add);
        return bookings;
    }

    // Troba un usuari per ID i tipus d'operació
    @Override
    public User findById(String userId, String operation) {
        DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
        Key key = Key.builder()
                .partitionValue(userId)
                .sortValue(operation)
                .build();
        return table.getItem(key);
    }

    // Elimina un usuari utilitzant el seu ID i tipus d'operació
    @Override
    public void deleteById(String userId, String operation) {
        DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
        Key key = Key.builder()
                .partitionValue(userId)
                .sortValue(operation)
                .build();
        table.deleteItem(key);
    }

    // Recupera tots els usuaris de la taula
    @Override
    public List<User> findAllUsers() {
        DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
        List<User> users = new ArrayList<>();
        table.scan().items().forEach(users::add);
        return users;
    }
}
