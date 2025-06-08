package dev.renting.delegations;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class Delegation {

    private String pk; // Partition Key 
    private String sk; // Sort Key 
    private String itemType; // To distinguish between different item types 
    private String delegationId; // ID de la delegación 
    private String name; // Nombre asociado al ítem (para delegación) 
    private String address; // Dirección del evento o entrega 
    private String city; // Ciudad donde ocurre la operación 
    private Double lat; // Latitud de la ubicación 
    private Double long; // Longitud de la ubicación 
    private String manager; // Encargado o gestor 
    private String phone; // Número de teléfono (para delegación) 

    @DynamoDbPartitionKey
    public String getPk() {
        return this.pk;
    }

    public void setPk(String pk) {
        this.pk = pk;
    }

    @DynamoDbSortKey
    public String getSk() {
        return this.sk;
    }

    public void setSk(String sk) {
        this.sk = sk;
    }

    @DynamoDbAttribute("itemType")
    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    @DynamoDbAttribute("delegationId")
    public String getDelegationId() {
        return delegationId;
    }

    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    @DynamoDbAttribute("name")
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @DynamoDbAttribute("address")
    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    @DynamoDbAttribute("city")
    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    @DynamoDbAttribute("lat")
    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    @DynamoDbAttribute("long")
    public Double getLong() {
        return long;
    }

    public void setLong(Double longVal) { // Renamed parameter to avoid conflict with method name
        this.long = longVal;
    }

    @DynamoDbAttribute("manager")
    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    @DynamoDbAttribute("phone")
    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    // Helper method to set PK and SK based on delegationId
    public void setDelegationIdentifier(String delegationId) {
        this.delegationId = delegationId;
        this.pk = "DELEGATION#" + delegationId;
        this.sk = "METADATA#" + delegationId;
        this.itemType = "delegation";
    }
}