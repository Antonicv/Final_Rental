package dev.renting.users;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
// Importa la clase Booking unificada desde dev.renting.delegations
import dev.renting.delegations.Booking; // <--- CAMBIO AQUÍ

@Endpoint
@AnonymousAllowed // Considera aplicar seguridad con @RolesAllowed o @Secured
public class UserEndpoint {

    private final UserRepository userRepository;

    @Autowired
    public UserEndpoint(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // --- Métodos relacionados con Usuarios ---

    /**
     * Obtiene todos los usuarios.
     * @return Una lista de objetos User.
     */
    public List<User> getAllUsers() {
        return userRepository.findAllUsers();
    }

    /**
     * Obtiene un usuario por su ID.
     * @param userId El ID del usuario.
     * @return El objeto User si se encuentra, o null.
     */
    public User getUserById(String userId) {
        return userRepository.findUserById(userId).orElse(null);
    }

    /**
     * Obtiene un usuario por su nombre de usuario.
     * @param username El nombre de usuario.
     * @return El objeto User si se encuentra, o null.
     */
    public User getUserByUsername(String username) {
        return userRepository.findUserByUsername(username).orElse(null);
    }

    /**
     * Guarda un nuevo usuario.
     * @param user El objeto User a guardar.
     * @return El usuario guardado.
     */
    public User saveUser(User user) {
        return userRepository.saveUser(user);
    }

    /**
     * Actualiza un usuario existente.
     * @param user El objeto User con los datos actualizados.
     * @return El usuario actualizado.
     */
    public User updateUser(User user) {
        return userRepository.updateUser(user);
    }

    /**
     * Elimina un usuario por su ID.
     * @param userId El ID del usuario a eliminar.
     */
    public void deleteUser(String userId) {
        userRepository.deleteUser(userId);
    }

    // --- Métodos relacionados con Reservas ---

    /**
     * Obtiene todas las reservas.
     * @return Una lista de objetos Booking.
     */
    public List<Booking> getAllBookings() {
        return userRepository.findAllBookings();
    }

    /**
     * Obtiene una reserva por su ID.
     * @param bookingId El ID de la reserva.
     * @return El objeto Booking si se encuentra, o null.
     */
    public Booking getBookingById(String bookingId) {
        return userRepository.findBookingById(bookingId).orElse(null);
    }

    /**
     * Obtiene todas las reservas de un usuario específico.
     * @param userId El ID del usuario.
     * @return Una lista de reservas del usuario.
     */
    public List<Booking> getBookingsByUserId(String userId) {
        return userRepository.findBookingsByUserId(userId);
    }

    /**
     * Guarda una nueva reserva.
     * @param booking El objeto Booking a guardar.
     * @return La reserva guardada.
     */
    public Booking saveBooking(Booking booking) {
        return userRepository.saveBooking(booking);
    }

    /**
     * Actualiza una reserva existente.
     * @param booking La reserva con los datos actualizados.
     * @return La reserva actualizada.
     */
    public Booking updateBooking(Booking booking) {
        return userRepository.updateBooking(booking);
    }

    /**
     * Elimina una reserva por su ID.
     * @param bookingId El ID de la reserva a eliminar.
     */
    public void deleteBooking(String bookingId) {
        userRepository.deleteBooking(bookingId);
    }
}