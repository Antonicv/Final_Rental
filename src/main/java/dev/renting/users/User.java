package dev.renting.users;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List; // Importar List para roles

@DynamoDbBean
public class User {
    private String userId;      // Clave de Partición (HASH): ID único del usuario (ej. 'sub' de Cognito)
    private String operation;   // Clave de Ordenación (RANGE): Para distintos tipos de datos de usuario (ej. "profile", "settings")
    private String username;    // Nombre de usuario (puede ser el mismo que el email o un alias)
    private String email;
    private String fullName;
    private String phone;
    private List<String> roles; // Ej. ["USER", "ADMIN"]. Roles del usuario para autorización.
    private String createdAt;   // Fecha de creación del registro del usuario (ISO 8601)
    private String lastLogin;   // Última fecha de inicio de sesión (ISO 8601)

    public User() {} // Constructor vacío requerido por DynamoDB Enhanced Client

    @DynamoDbPartitionKey
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbSortKey
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    @DynamoDbAttribute("username") // Atributo para mapeo en DynamoDB
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @DynamoDbAttribute("email")
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @DynamoDbAttribute("fullName")
    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    @DynamoDbAttribute("phone")
    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    @DynamoDbAttribute("roles")
    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    @DynamoDbAttribute("createdAt")
    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    @DynamoDbAttribute("lastLogin")
    public String getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(String lastLogin) {
        this.lastLogin = lastLogin;
    }

    @Override
    public String toString() {
        return "User{" +
               "userId='" + userId + '\'' +
               ", operation='" + operation + '\'' +
               ", username='" + username + '\'' +
               ", email='" + email + '\'' +
               ", fullName='" + fullName + '\'' +
               ", phone='" + phone + '\'' +
               ", roles=" + roles +
               ", createdAt='" + createdAt + '\'' +
               ", lastLogin='" + lastLogin + '\'' +
               '}';
    }
}
