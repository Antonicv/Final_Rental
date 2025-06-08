// UserRepository.java
package dev.renting.users;

import java.util.List;

public interface UserRepository {
    <T> void save(T item);  // Create / Update

    User findById(String userId, String operation); // Read

    void deleteById(String userId, String operation); // Delete

    List<User> findAllUsers(); // List all

    List<Booking> findBookingsByUserId(String userId); // Booking retrieval
}