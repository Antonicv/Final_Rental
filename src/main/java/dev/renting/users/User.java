package dev.renting.users;


import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**
 * Classe que representa un usuari al sistema.
 * Utilitza anotacions per mapejar a una taula DynamoDB.
 */
@DynamoDbBean
public class User {
    private String userId;      // Identificador únic de l'usuari
    private String operation;   // Operació associada amb l'usuari
    private String username;    // Nom d'usuari
    private String email;       // Correu electrònic
    private String fullName;    // Nom complet
    private String phone;       // Telèfon

    // Getters i setters
    /**
     * Obté l'identificador de l'usuari.
     * Serveix com a clau de partició.
     */
    @DynamoDbPartitionKey
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    /**
     * Obté l'operació.
     * Serveix com a clau de classificació.
     */
    @DynamoDbSortKey
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    @DynamoDbAttribute("userName")
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    @DynamoDbAttribute("email")
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @DynamoDbAttribute("fullName")
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    @DynamoDbAttribute("phone")
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
