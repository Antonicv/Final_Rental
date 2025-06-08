package dev.renting.users;

import dev.renting.config.DynamoDBConfig;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<User> userTable;
    private final DynamoDbTable<Booking> bookingTable;

    public UserRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
        this.userTable = enhancedClient.table(DynamoDBConfig.TABLE_NAME, TableSchema.fromBean(User.class));
        this.bookingTable = enhancedClient.table(DynamoDBConfig.TABLE_NAME, TableSchema.fromBean(Booking.class));
    }

    @Override
    public User saveUser(User user) {
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            user.setUserIdentifier(UUID.randomUUID().toString());
        } else {
            user.setUserIdentifier(user.getUserId());
        }
        userTable.putItem(user);
        return user;
    }

    @Override
    public Optional<User> findUserById(String userId) {
        Key key = Key.builder()
                .partitionValue("USER#" + userId)
                .sortValue("METADATA#" + userId)
                .build();
        User user = userTable.getItem(key);
        return Optional.ofNullable(user);
    }

    @Override
    public Optional<User> findUserByUsername(String username) {
        // Implementación con Scan. Para producción, considera un GSI si la consulta por username es frecuente.
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType AND username = :username")
                                .expressionValues(java.util.Map.of(
                                        ":itemType", AttributeValue.builder().s("user").build(),
                                        ":username", AttributeValue.builder().s(username).build()
                                ))
                                .build()
                )
                .build();

        return userTable.scan(scanRequest)
                .items()
                .stream()
                .findFirst(); // Asumimos que el username es único
    }

    @Override
    public List<User> findAllUsers() {
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType")
                                .expressionValues(java.util.Collections.singletonMap(":itemType", AttributeValue.builder().s("user").build()))
                                .build()
                )
                .build();

        return userTable.scan(scanRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public User updateUser(User user) {
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            throw new IllegalArgumentException("User ID must not be null for update operation.");
        }
        user.setUserIdentifier(user.getUserId());
        userTable.updateItem(user);
        return user;
    }

    @Override
    public void deleteUser(String userId) {
        Key key = Key.builder()
                .partitionValue("USER#" + userId)
                .sortValue("METADATA#" + userId)
                .build();
        userTable.deleteItem(key);
    }

    @Override
    public Booking saveBooking(Booking booking) {
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            booking.setBookingIdentifier(UUID.randomUUID().toString());
        } else {
            booking.setBookingIdentifier(booking.getBookingId());
        }
        bookingTable.putItem(booking);
        return booking;
    }

    @Override
    public Optional<Booking> findBookingById(String bookingId) {
        Key key = Key.builder()
                .partitionValue("BOOKING#" + bookingId)
                .sortValue("METADATA#" + bookingId)
                .build();
        Booking booking = bookingTable.getItem(key);
        return Optional.ofNullable(booking);
    }

    @Override
    public List<Booking> findAllBookings() {
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType")
                                .expressionValues(java.util.Collections.singletonMap(":itemType", AttributeValue.builder().s("booking").build()))
                                .build()
                )
                .build();

        return bookingTable.scan(scanRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public List<Booking> findBookingsByUserId(String userId) {
        // Esta operación es más compleja y puede requerir un GSI.
        // Asumiendo que has creado un GSI con PK = USER#<userId> y SK = BOOKING#<bookingId>
        // Si no tienes un GSI, esta operación implicaría un Scan de toda la tabla y filtrar,
        // lo cual es ineficiente para grandes volúmenes de datos.

        // Si tienes un GSI llamado "UserBookingsIndex" con PK='userId' y SK='bookingId'
        // Puedes consultarlo así:
        /*
        return bookingTable.index("UserBookingsIndex").query(QueryConditional.keyEqualTo(Key.builder()
                .partitionValue("USER#" + userId)
                .build())).items().stream().collect(Collectors.toList());
        */

        // Si no tienes un GSI para esto y el PK de Booking es BOOKING#<bookingId>,
        // la única forma es escanear y filtrar, lo cual es ineficiente para producción.
        // Implementación con Scan para este ejemplo:
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType AND userId = :userId")
                                .expressionValues(java.util.Map.of(
                                        ":itemType", AttributeValue.builder().s("booking").build(),
                                        ":userId", AttributeValue.builder().s(userId).build()
                                ))
                                .build()
                )
                .build();

        return bookingTable.scan(scanRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public Booking updateBooking(Booking booking) {
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            throw new IllegalArgumentException("Booking ID must not be null for update operation.");
        }
        booking.setBookingIdentifier(booking.getBookingId());
        bookingTable.updateItem(booking);
        return booking;
    }

    @Override
    public void deleteBooking(String bookingId) {
        Key key = Key.builder()
                .partitionValue("BOOKING#" + bookingId)
                .sortValue("METADATA#" + bookingId)
                .build();
        bookingTable.deleteItem(key);
    }
}