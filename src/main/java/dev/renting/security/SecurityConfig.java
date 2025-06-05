package dev.renting.security;

import com.vaadin.flow.spring.security.VaadinWebSecurity;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity // Habilita la seguridad web
public class SecurityConfig extends VaadinWebSecurity {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // Configura Spring Security para usar OAuth2 y Cognito
        http
            .authorizeHttpRequests(authorize -> authorize
                // Permite acceso a recursos públicos de Hilla y Spring
                .requestMatchers(new AntPathRequestMatcher("/images/*.webp")).permitAll() // Permite imágenes webp
                .requestMatchers(new AntPathRequestMatcher("/public/**")).permitAll() // Si tienes recursos públicos
                .requestMatchers(new AntPathRequestMatcher("/")).permitAll() // La página de inicio
                .requestMatchers(new AntPathRequestMatcher("/error")).permitAll() // Página de error
                .requestMatchers(new AntPathRequestMatcher("/oauth2/**")).permitAll() // Para el flujo OAuth2 (callbacks)
                .requestMatchers(new AntPathRequestMatcher("/login")).permitAll() // Página de login
                .requestMatchers(new AntPathRequestMatcher("/login**")).permitAll() // login y login?error
                // Permite el acceso a la vista de información del usuario si existe
                .requestMatchers(new AntPathRequestMatcher("/user-info")).permitAll()


                // Protege los endpoints de Hilla (todos los /api/**)
                // Aquí deberás ajustar las protecciones a tus roles
                .requestMatchers(new AntPathRequestMatcher("/api/UserEndpoint/getAuthenticatedUserProfile")).hasRole("USER") // Solo USER puede ver su perfil
                .requestMatchers(new AntPathRequestMatcher("/api/UserEndpoint/listAllUsers")).hasRole("ADMIN") // Solo ADMIN puede listar usuarios
                .requestMatchers(new AntPathRequestMatcher("/api/UserEndpoint/deleteUser")).hasRole("ADMIN") // Solo ADMIN puede borrar usuarios
                .requestMatchers(new AntPathRequestMatcher("/api/DelegationEndpoint/saveCar")).hasRole("ADMIN") // Solo ADMIN puede guardar coches
                .requestMatchers(new AntPathRequestMatcher("/api/DelegationEndpoint/deleteCar")).hasRole("ADMIN") // Solo ADMIN puede borrar coches
                .requestMatchers(new AntPathRequestMatcher("/api/DelegationEndpoint/saveDelegation")).hasRole("ADMIN") // Solo ADMIN puede guardar delegaciones
                .requestMatchers(new AntPathRequestMatcher("/api/DelegationEndpoint/deleteDelegation")).hasRole("ADMIN") // Solo ADMIN puede borrar delegaciones
                .requestMatchers(new AntPathRequestMatcher("/api/DelegationEndpoint/**")).authenticated() // Otros endpoints de delegaciones, requieren autenticación
                .requestMatchers(new AntPathRequestMatcher("/api/**")).authenticated() // Por defecto, todos los endpoints de Hilla requieren autenticación
                .anyRequest().authenticated() // Cualquier otra petición requiere autenticación
            )
            // Configura la autenticación OAuth2 con un cliente OIDC (Cognito)
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login") // Redirige al Hosted UI de Cognito si no está autenticado
                .userInfoEndpoint(userInfo -> userInfo
                    .oidcUserService(this.oidcUserService()) // Servicio para procesar la información del usuario del OIDC
                )
            )
            // Configura el logout
            .logout(logout -> logout
                .logoutSuccessUrl("/") // Redirige a la página de inicio después del logout
                .permitAll()
            );

        // La llamada a super.configure(http) no es necesaria si se usa setSecurityFilterChain(http) en VaadinWebSecurity
        // En Vaadin Flow 24+, es más común que VaadinWebSecurity construya el filtro.
        // Super.configure(http) ya no se usa directamente en este patrón.
        // VaadinWebSecurity ya se encarga de crear el SecurityFilterChain.
        // Simplemente elimina la línea que causaba el error.
    }

    // Bean para el servicio de información del usuario OIDC
    // Esto es CRUCIAL para mapear los grupos de Cognito a los roles de Spring Security
    @Bean
    public OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        final OidcUserService delegate = new OidcUserService();

        return (userRequest) -> {
            OidcUser oidcUser = delegate.loadUser(userRequest);
            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

            // Obtener los grupos de Cognito del ID Token (claim "cognito:groups")
            // Los grupos de Cognito se mapean a roles de Spring Security con prefijo "ROLE_"
            if (oidcUser.hasClaim("cognito:groups")) {
                @SuppressWarnings("unchecked")
                Collection<String> cognitoGroups = oidcUser.getClaim("cognito:groups");
                if (cognitoGroups != null) {
                    mappedAuthorities.addAll(cognitoGroups.stream()
                            .map(group -> new SimpleGrantedAuthority("ROLE_" + group.toUpperCase()))
                            .collect(Collectors.toList()));
                }
            } else {
                // Si no hay grupos específicos de Cognito, asigna un rol por defecto, ej. "USER"
                mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            // También puedes mapear otros claims a autoridades si lo necesitas (ej. admin-role)
            // Para usuarios autenticados sin grupos específicos, o si el User Pool tiene un rol por defecto
            // Siempre asigna un rol de 'USER' básico si el usuario está autenticado.
            mappedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER")); // Asegurar que siempre hay un ROLE_USER

            // Combinar las autoridades originales (de los scopes, etc.) con las mapeadas
            mappedAuthorities.addAll(oidcUser.getAuthorities());


            // Devolver un nuevo OidcUser con las autoridades mapeadas
            return new DefaultOidcUser(mappedAuthorities, oidcUser.getIdToken(), oidcUser.getUserInfo());
        };
    }
}
