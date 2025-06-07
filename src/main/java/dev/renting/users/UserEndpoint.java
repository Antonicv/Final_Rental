// UserEndpoint.java
package dev.renting.users;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Endpoint
@AnonymousAllowed
public class UserEndpoint {

    private final UserRepository userRepository;

    @Autowired
    public UserEndpoint(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Guarda un usuario. Si el userId o operation no están establecidos,
     * genera un UUID para userId y establece "profile" para operation.
     * @param user El objeto User a guardar.
     */
    public void saveUser(User user) {
        System.out.println("UserEndpoint.saveUser llamado para: " + user.getUsername());
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            user.setUserId(UUID.randomUUID().toString());
            System.out.println("DEBUG: Nuevo userId generado: " + user.getUserId());
        }
        if (user.getOperation() == null || user.getOperation().isEmpty()) {
            user.setOperation("profile"); // Operación predeterminada para el perfil de usuario
            System.out.println("DEBUG: Operación establecida para el usuario: " + user.getOperation());
        }
        userRepository.save(user);
        System.out.println("DEBUG: Usuario guardado con éxito.");
    }

    /**
     * Guarda una reserva de usuario. Genera un bookingId y operation (e.g., "booking#UUID")
     * y establece la bookingDate si no se proporcionan.
     * @param booking El objeto Booking a guardar.
     */
    public void saveBooking(Booking booking) {
        System.out.println("UserEndpoint.saveBooking llamado para userId: " + booking.getUserId());
        if (booking.getUserId() == null || booking.getUserId().isEmpty()) {
            System.err.println("ERROR: No se puede guardar la reserva, falta el userId.");
            throw new IllegalArgumentException("Se requiere el ID de usuario para guardar una reserva.");
        }
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            booking.setBookingId(UUID.randomUUID().toString());
        }
        // Genera la clave de ordenación para la reserva del usuario
        if (booking.getOperation() == null || booking.getOperation().isEmpty()) {
            booking.setOperation("booking#" + booking.getBookingId());
            System.out.println("DEBUG: Nueva operación de reserva generada: " + booking.getOperation());
        }
        booking.setBookingDate(LocalDate.now().toString()); // Establece la fecha actual de la reserva
        userRepository.save(booking);
        System.out.println("DEBUG: Reserva guardada con éxito.");
    }

    /**
     * Obtiene un usuario por su ID y operación.
     * @param userId ID del usuario.
     * @param operation Operación del usuario (e.g., "profile").
     * @return El objeto User o null si no se encuentra.
     */
    public User getUser(String userId, String operation) {
        System.out.println("UserEndpoint.getUser llamado para userId: " + userId + ", operation: " + operation);
        return userRepository.get(userId, operation, User.class);
    }

    /**
     * Elimina un usuario y todas sus reservas asociadas.
     * @param userId ID del usuario a eliminar.
     * @param operation Operación del usuario (e.g., "profile").
     */
    public void deleteUser(String userId, String operation) {
        System.out.println("DEBUG: deleteUser llamado para userId: " + userId + ", operation: " + operation);

        // 1. Obtener y eliminar todas las reservas asociadas a este usuario
        List<Booking> bookingsForUser = userRepository.findBookingsByUserId(userId);
        if (!bookingsForUser.isEmpty()) {
            System.out.println("DEBUG: Encontradas " + bookingsForUser.size() + " reservas para el usuario " + userId + ". Eliminando...");
            for (Booking booking : bookingsForUser) {
                // Asegúrate de que la operación de la reserva sea la clave de ordenación correcta para eliminar
                deleteBooking(booking.getUserId(), booking.getOperation());
            }
            System.out.println("DEBUG: Todas las reservas del usuario " + userId + " eliminadas.");
        } else {
            System.out.println("DEBUG: No se encontraron reservas para el usuario " + userId + ".");
        }

        // 2. Eliminar el usuario en sí (el item 'profile')
        User userToDelete = new User();
        userToDelete.setUserId(userId);
        userToDelete.setOperation(operation); // Asumimos "profile"
        userRepository.delete(userToDelete);
        System.out.println("DEBUG: Usuario eliminado con éxito.");
    }

    /**
     * Elimina una reserva de usuario por su ID de usuario y la operación de la reserva.
     * @param userId ID del usuario propietario de la reserva.
     * @param operation La clave de ordenación de la reserva (e.g., "booking#UUID").
     */
    public void deleteBooking(String userId, String operation) {
        System.out.println("UserEndpoint.deleteBooking llamado para userId: " + userId + ", operation: " + operation);
        Booking bookingToDelete = new Booking();
        bookingToDelete.setUserId(userId);
        bookingToDelete.setOperation(operation);
        userRepository.delete(bookingToDelete);
        System.out.println("DEBUG: Reserva de usuario eliminada con éxito.");
    }

    /**
     * Obtiene todas las reservas de un usuario.
     * @param userId ID del usuario.
     * @return Una lista de objetos Booking asociados al usuario.
     */
    public List<Booking> getBookingsByUser(String userId) {
        System.out.println("UserEndpoint.getBookingsByUser llamado para userId: " + userId);
        return userRepository.findBookingsByUserId(userId);
    }

    /**
     * Lista todos los usuarios (ítems con operation = "profile").
     * Esto realizará un Scan en la tabla "Users". Considera el rendimiento para tablas grandes.
     * @return Una lista de todos los objetos User.
     */
    public List<User> getAllUsers() {
        System.out.println("UserEndpoint.getAllUsers llamado.");
        List<User> allItems = userRepository.listAllItems(User.class);
        // Filtrar solo los ítems que representan perfiles de usuario
        return allItems.stream()
                .filter(user -> "profile".equals(user.getOperation()))
                .collect(Collectors.toList());
    }

    /**
     * Lista todas las reservas de usuario (ítems con operation que comienza con "booking#").
     * Esto realizará un Scan en la tabla "Users". Considera el rendimiento para tablas grandes.
     * @return Una lista de todos los objetos Booking de usuario.
     */
    public List<Booking> getAllUserBookings() {
        System.out.println("UserEndpoint.getAllUserBookings llamado.");
        List<Booking> allItems = userRepository.listAllItems(Booking.class);
        // Filtrar solo los ítems que representan reservas de usuario
        return allItems.stream()
                .filter(booking -> booking.getOperation() != null && booking.getOperation().startsWith("booking#"))
                .collect(Collectors.toList());
    }
}
