// UserRepositoryImpl.java
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

    private final DynamoDbEnhancedClient enhancedClient;
    private final String tableName = "Users";

    @Autowired
    public UserRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
    }


    @Override
    public <T> void save(T item) {
        DynamoDbTable<T> table =
                enhancedClient.table(
                        tableName,
                        TableSchema.fromBean((Class<T>) item.getClass()));
        table.putItem(item);
    }

    @Override
    public List<Booking> findBookingsByUserId(String userId) {
        // This client creates a reference to our DynamoDB table
        // telling the SDK to map table items to our Booking Java class
        // it uses the value of enhancedClient
        DynamoDbTable<Booking> table = enhancedClient.table(tableName, TableSchema.fromBean(Booking.class));

        // Assuming ''Booking'' has a partition key named "userId"
        // empty list where we will collect all the bookings found for the user.
        List<Booking> bookings = new ArrayList<>();

        // Query for items where the partition key equals userId and the sort key begins with "booking"
        // QueryConditional.keyEqualTo(...): Tells DynamoDB to return all items
        // where the partition key (here, userId) equals the value you provided.
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
        // .items().iterator(): Gets an iterator over the query results.
        // Each item is mapped to a Booking object.

        // Loop over the query results and add them to the 'bookings' list
        // with the method reference: bookings::add
        results.forEachRemaining(bookings::add);
        return bookings;
    }
    @Override
public User findById(String userId, String operation) {
    DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
    Key key = Key.builder()
            .partitionValue(userId)
            .sortValue(operation)
            .build();
    return table.getItem(key);
}

@Override
public void deleteById(String userId, String operation) {
    DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
    Key key = Key.builder()
            .partitionValue(userId)
            .sortValue(operation)
            .build();
    table.deleteItem(key);
}

@Override
public List<User> findAllUsers() {
    DynamoDbTable<User> table = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
    List<User> users = new ArrayList<>();
    table.scan().items().forEach(users::add);
    return users;
}




}
