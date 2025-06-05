package dev.renting.users;

import dev.renting.delegations.Booking; // Importar la clase Booking consolidada
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue; // Importar para QueryEnhancedRequest

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    // Nombres de las tablas
    private final String USERS_TABLE_NAME = "Users";
    private final String BOOKINGS_TABLE_NAME = "Bookings";
    private final String USER_ID_GSI_NAME = "UserIdIndex"; // Nombre del GSI en la tabla Bookings

    @Autowired
    public UserRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }

    // Helper para obtener la tabla de Users
    private DynamoDbTable<User> getUsersTable() {
        return enhancedClient.table(USERS_TABLE_NAME, TableSchema.fromBean(User.class));
    }

    // Helper para obtener la tabla de Bookings
    private DynamoDbTable<Booking> getBookingsTable() {
        return enhancedClient.table(BOOKINGS_TABLE_NAME, TableSchema.fromBean(Booking.class));
    }

    @Override
    public void save(User user) {
        getUsersTable().putItem(user);
        System.out.println("DEBUG (UserRepositoryImpl): User saved: " + user.getUserId());
    }

    @Override
    public Optional<User> get(String userId, String operation) {
        Key key = Key.builder()
                .partitionValue(userId)
                .sortValue(operation)
                .build();
        User user = getUsersTable().getItem(key);
        System.out.println("DEBUG (UserRepositoryImpl): User retrieved: " + (user != null ? user.getUserId() : "null"));
        return Optional.ofNullable(user);
    }

    @Override
    public List<User> listAllUsers() {
        // Para listar todos los usuarios (requiere Scan), ten cuidado en producción con tablas grandes
        System.out.println("DEBUG (UserRepositoryImpl): Listing all users (SCAN operation).");
        return getUsersTable().scan().items().stream().collect(Collectors.toList());
    }

    @Override
    public void delete(String userId, String operation) {
        Key key = Key.builder()
                .partitionValue(userId)
                .sortValue(operation)
                .build();
        getUsersTable().deleteItem(key);
        System.out.println("DEBUG (UserRepositoryImpl): User deleted: " + userId + " with operation: " + operation);
    }

    @Override
    public List<Booking> findBookingsByUserId(String userId) {
        // Usar el GSI "UserIdIndex" en la tabla "Bookings"
        DynamoDbTable<Booking> bookingsTable = getBookingsTable();

        // Construir la QueryConditional para el GSI
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(userId).build()
        );

        System.out.println("DEBUG (UserRepositoryImpl): Querying bookings for userId: " + userId + " using GSI: " + USER_ID_GSI_NAME);

        // Realizar la consulta al GSI
        // La consulta debe especificar el índice a usar
        Iterator<Booking> results = bookingsTable.index(USER_ID_GSI_NAME) // Especifica el GSI
                .query(QueryEnhancedRequest.builder()
                        .queryConditional(queryConditional)
                        .build())
                .items().iterator();

        List<Booking> bookings = new ArrayList<>();
        results.forEachRemaining(bookings::add);

        System.out.println("DEBUG (UserRepositoryImpl): Found " + bookings.size() + " bookings for userId: " + userId);
        return bookings;
    }
}
