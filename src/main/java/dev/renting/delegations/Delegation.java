package dev.renting.delegations;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@DynamoDbBean
public class Delegation {

    private String delegationId; // Clave de partición
    private String operation;    // Clave de ordenación (ej. "profile")
    private String name;
    private String adress;
    private String city;
    private String manager;
    private String telf;
    private int carQuantity;
    private double lat;
    private double longVal; // 'long' es una palabra reservada en Java, usar 'longVal' o similar

    // Constructor vacío requerido por DynamoDB Enhanced Client
    public Delegation() {}

    @DynamoDbPartitionKey
    @DynamoDbAttribute("delegationId")
    public String getDelegationId() {
        return delegationId;
    }

    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    @DynamoDbSortKey
    @DynamoDbAttribute("operation")
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    @DynamoDbAttribute("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @DynamoDbAttribute("adress")
    public String getAdress() {
        return adress;
    }

    public void setAdress(String adress) {
        this.adress = adress;
    }

    @DynamoDbAttribute("city")
    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    @DynamoDbAttribute("manager")
    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    @DynamoDbAttribute("telf")
    public String getTelf() {
        return telf;
    }

    public void setTelf(String telf) {
        this.telf = telf;
    }

    @DynamoDbAttribute("carQuantity")
    public int getCarQuantity() {
        return carQuantity;
    }

    public void setCarQuantity(int carQuantity) {
        this.carQuantity = carQuantity;
    }

    @DynamoDbAttribute("lat")
    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    // Usar un nombre diferente para evitar conflicto con la palabra reservada 'long'
    @DynamoDbAttribute("long") // La anotación debe coincidir con el nombre del atributo en DynamoDB
    public double getLongVal() {
        return longVal;
    }

    public void setLongVal(double longVal) {
        this.longVal = longVal;
    }
}
