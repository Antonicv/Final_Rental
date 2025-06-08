package dev.renting.users;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

    /**
     * Guarda un usuario en la tabla única.
     * @param user El objeto User a guardar.
     * @return El usuario guardado.
     */
    User saveUser(User user);

    /**
     * Busca un usuario por su userId.
     * @param userId El ID del usuario.
     * @return Un Optional que contiene el User si se encuentra, o Optional.empty() si no.
     */
    Optional<User> findUserById(String userId);

    /**
     * Busca un usuario por su username. (Requiere un GSI o un scan, optaremos por un scan por simplicidad si no hay GSI)
     * @param username El nombre de usuario.
     * @return Un Optional que contiene el User si se encuentra, o Optional.empty() si no.
     */
    Optional<User> findUserByUsername(String username);

    /**
     * Obtiene todos los usuarios de la tabla única.
     * @return Una lista de todos los usuarios.
     */
    List<User> findAllUsers();

    /**
     * Actualiza un usuario existente en la tabla única.
     * @param user El objeto User con los datos actualizados.
     * @return El usuario actualizado.
     */
    User updateUser(User user);

    /**
     * Elimina un usuario por su userId.
     * @param userId El ID del usuario a eliminar.
     */
    void deleteUser(String userId);

    /**
     * Guarda una reserva en la tabla única.
     * @param booking El objeto Booking a guardar.
     * @return La reserva guardada.
     */
    Booking saveBooking(Booking booking);

    /**
     * Busca una reserva por su bookingId.
     * @param bookingId El ID de la reserva.
     * @return Un Optional que contiene la Booking si se encuentra, o Optional.empty() si no.
     */
    Optional<Booking> findBookingById(String bookingId);

    /**
     * Obtiene todas las reservas de la tabla única.
     * @return Una lista de todas las reservas.
     */
    List<Booking> findAllBookings();

    /**
     * Obtiene todas las reservas asociadas a un usuario específico.
     * (Esto probablemente requerirá un GSI en la tabla única si el `PK` de Booking no es `USER#<userId>`)
     * @param userId El ID del usuario.
     * @return Una lista de reservas para el usuario dado.
     */
    List<Booking> findBookingsByUserId(String userId);

    /**
     * Actualiza una reserva existente en la tabla única.
     * @param booking El objeto Booking con los datos actualizados.
     * @return La reserva actualizada.
     */
    Booking updateBooking(Booking booking);

    /**
     * Elimina una reserva por su bookingId.
     * @param bookingId El ID de la reserva a eliminar.
     */
    void deleteBooking(String bookingId);
}