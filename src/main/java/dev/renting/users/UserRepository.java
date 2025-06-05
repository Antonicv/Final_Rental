package dev.renting.users;

import dev.renting.delegations.Booking; // Importar la clase Booking consolidada
import java.util.List;
import java.util.Optional; // Importar Optional para get

public interface UserRepository {
    // Métodos CRUD para User
    void save(User user);
    Optional<User> get(String userId, String operation); // Obtener un User por PK y SK
    List<User> listAllUsers(); // Listar todos los usuarios
    void delete(String userId, String operation); // Borrar un User por PK y SK

    // Método para encontrar reservas por userId (usará el GSI en la tabla Bookings)
    List<Booking> findBookingsByUserId(String userId);

}
