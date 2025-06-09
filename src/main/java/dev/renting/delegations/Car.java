package dev.renting.delegations; // Defineix el paquet on es troba aquesta classe Java.

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean; // Anotació per indicar que aquesta classe és un bean de DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey; // Anotació per definir la clau de partició (Partition Key) a DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute; // Anotació per mapejar un atribut Java a un atribut de DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey; // Anotació per definir la clau d'ordenació (Sort Key) a DynamoDB.

/**
 * Classe que representa un cotxe en el sistema de lloguer.
 * Aquesta classe es mapeja a una taula de DynamoDB utilitzant l'Enhanced Client.
 */
@DynamoDbBean // Indica que aquesta classe és un "bean" mapeable per DynamoDB.
public class Car {
    private String delegationId; // ID de la delegació a la qual pertany el cotxe. (Clau de Partició)
    private String operation;    // Identificador únic de l'operació/cotxe dins d'una delegació. (Clau d'Ordenació)
    private String make;         // Marca del cotxe.
    private String model;        // Model del cotxe.
    private int year;            // Any de fabricació del cotxe.
    private String color;        // Color del cotxe.
    private boolean rented;      // Estat del cotxe: true si està llogat, false si està disponible.
    private int price;           // Preu diari de lloguer del cotxe.

    // No cal un constructor explícitament buit si no hi ha altres constructors,
    // ja que Java en proporciona un per defecte.

    /**
     * Obté l'ID de la delegació.
     * Aquest és l'atribut utilitzat com a Clau de Partició a DynamoDB.
     * @return L'ID de la delegació.
     */
    @DynamoDbPartitionKey // Marca aquest mètode com el getter de la clau de partició.
    public String getDelegationId() {
        return delegationId;
    }

    /**
     * Estableix l'ID de la delegació.
     * @param delegationId L'ID de la delegació a establir.
     */
    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    /**
     * Obté l'identificador d'operació del cotxe.
     * Aquest és l'atribut utilitzat com a Clau d'Ordenació a DynamoDB,
     * permetent ordenar o accedir a cotxes dins de la mateixa delegació.
     * @return L'identificador d'operació.
     */
    @DynamoDbSortKey // Marca aquest mètode com el getter de la clau d'ordenació.
    public String getOperation() {
        return operation;
    }

    /**
     * Estableix l'identificador d'operació del cotxe.
     * @param operation L'identificador d'operació a establir.
     */
    public void setOperation(String operation) {
        this.operation = operation;
    }

    /**
     * Obté la marca del cotxe.
     * @return La marca del cotxe.
     */
    @DynamoDbAttribute("make") // Mapeja aquest mètode a l'atribut "make" a DynamoDB.
    public String getMake() {
        return make;
    }

    /**
     * Estableix la marca del cotxe.
     * @param make La marca a establir.
     */
    public void setMake(String make) {
        this.make = make;
    }

    /**
     * Obté el model del cotxe.
     * @return El model del cotxe.
     */
    @DynamoDbAttribute("model") // Mapeja a l'atribut "model".
    public String getModel() {
        return model;
    }

    /**
     * Estableix el model del cotxe.
     * @param model El model a establir.
     */
    public void setModel(String model) {
        this.model = model;
    }

    /**
     * Obté l'any de fabricació del cotxe.
     * @return L'any del cotxe.
     */
    @DynamoDbAttribute("year") // Mapeja a l'atribut "year".
    public int getYear() {
        return year;
    }

    /**
     * Estableix l'any de fabricació del cotxe.
     * @param year L'any a establir.
     */
    public void setYear(int year) {
        this.year = year;
    }

    /**
     * Obté el color del cotxe.
     * @return El color del cotxe.
     */
    @DynamoDbAttribute("color") // Mapeja a l'atribut "color".
    public String getColor() {
        return color;
    }

    /**
     * Estableix el color del cotxe.
     * @param color El color a establir.
     */
    public void setColor(String color) {
        this.color = color;
    }

    /**
     * Comprova si el cotxe està llogat.
     * @return true si el cotxe està llogat, false si està disponible.
     */
    // Per defecte, DynamoDB Enhanced Client mapeja "isRented()" a "rented" si no hi ha @DynamoDbAttribute.
    public boolean isRented() {
        return rented;
    }

    /**
     * Estableix l'estat de lloguer del cotxe.
     * @param rented L'estat de lloguer a establir.
     */
    public void setRented(boolean rented) {
        this.rented = rented;
    }

    /**
     * Obté el preu diari de lloguer del cotxe.
     * @return El preu del cotxe.
     */
    // Per defecte, DynamoDB Enhanced Client mapeja "getPrice()" a "price" si no hi ha @DynamoDbAttribute.
    public int getPrice() {
        return price;
    }

    /**
     * Estableix el preu diari de lloguer del cotxe.
     * @param price El preu a establir.
     */
    public void setPrice(int price) {
        this.price = price;
    }
}