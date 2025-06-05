package dev.renting.users;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import dev.renting.delegations.Booking; // Importar la clase Booking consolidada
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.access.annotation.Secured; // Importar para seguridad

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Endpoint
@AnonymousAllowed // Dejamos AnonymousAllowed por ahora, pero protegeremos métodos específicos
public class UserEndpoint {

    private final UserRepository userRepository;

    @Autowired
    public UserEndpoint(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Saves or updates a user profile.
     * In a real application, this would be protected (e.g., @Secured("ROLE_ADMIN") or check if user is self).
     *
     * @param user The user object to save.
     */
    // @Secured({"ROLE_USER", "ROLE_ADMIN"}) // Ejemplo de cómo protegerlo
    public void saveUser(User user) {
        // En un sistema real, aquí se debería verificar si el usuario autenticado
        // tiene permiso para modificar este perfil (es su propio perfil o es un ADMIN).
        System.out.println("UserEndpoint.saveUser: Attempting to save user " + user.getUserId());
        userRepository.save(user);
        System.out.println("UserEndpoint.saveUser: User " + user.getUserId() + " saved successfully.");
    }

    /**
     * Retrieves a user's profile by userId and operation.
     * This method should also be protected to ensure users can only see their own profile
     * or an ADMIN can see any profile.
     *
     * @param userId The ID of the user.
     * @param operation The sort key for the user profile (e.g., "profile").
     * @return The User object if found.
     */
    // @Secured({"ROLE_USER", "ROLE_ADMIN"})
    public Optional<User> getUser(String userId, String operation) {
        // En un sistema real, aquí se verificaría que el 'userId' solicitado
        // coincida con el 'userId' del usuario autenticado, a menos que el usuario sea ADMIN.
        System.out.println("UserEndpoint.getUser: Attempting to retrieve user " + userId + " with operation " + operation);
        Optional<User> user = userRepository.get(userId, operation);
        System.out.println("UserEndpoint.getUser: User found: " + user.isPresent());
        return user;
    }

    /**
     * Retrieves the profile of the currently authenticated user.
     * This method requires authentication.
     *
     * @return The User object of the authenticated user.
     */
    @Secured("ROLE_USER") // Solo usuarios autenticados pueden llamar a esto
    public Optional<User> getAuthenticatedUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof OidcUser) {
            OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
            String userId = oidcUser.getSubject(); // Cognito 'sub'
            System.out.println("UserEndpoint.getAuthenticatedUserProfile: Attempting to retrieve profile for authenticated user: " + userId);
            // Asumimos que el perfil principal del usuario se guarda con operation="profile"
            return userRepository.get(userId, "profile");
        }
        System.out.println("UserEndpoint.getAuthenticatedUserProfile: No authenticated OIDC user found.");
        return Optional.empty();
    }


    /**
     * Gets all bookings for a specific user.
     * This method should be protected to ensure users can only see their own bookings
     * or an ADMIN can see any user's bookings.
     *
     * @param userId The ID of the user whose bookings to retrieve.
     * @return A list of Booking objects for the specified user.
     */
    // @Secured({"ROLE_USER", "ROLE_ADMIN"})
    public List<Booking> getBookingsByUserId(String userId) {
        // En un sistema real, aquí se verificaría que el 'userId' solicitado
        // coincida con el 'userId' del usuario autenticado, a menos que el usuario sea ADMIN.
        System.out.println("UserEndpoint.getBookingsByUserId: Attempting to retrieve bookings for user " + userId);
        return userRepository.findBookingsByUserId(userId);
    }

    /**
     * Lists all users. Only accessible by ADMINs.
     *
     * @return A list of all User objects.
     */
    @Secured("ROLE_ADMIN") // Solo administradores pueden ver todos los usuarios
    public List<User> listAllUsers() {
        System.out.println("UserEndpoint.listAllUsers: Attempting to list all users.");
        return userRepository.listAllUsers();
    }

    /**
     * Deletes a user profile. Only accessible by ADMINs or the user themselves (with strong checks).
     *
     * @param userId The ID of the user to delete.
     * @param operation The sort key of the profile to delete.
     */
    @Secured("ROLE_ADMIN") // Solo administradores pueden borrar usuarios
    public void deleteUser(String userId, String operation) {
        System.out.println("UserEndpoint.deleteUser: Attempting to delete user " + userId + " with operation " + operation);
        userRepository.delete(userId, operation);
        System.out.println("UserEndpoint.deleteUser: User " + userId + " deleted successfully.");
    }
}
