// UserRepository.java
package dev.renting.users;

import java.util.List;

public interface UserRepository {
    <T> void save(T item);

    List<Booking> findBookingsByUserId(String userId);

}
