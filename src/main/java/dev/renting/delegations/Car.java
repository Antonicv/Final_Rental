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
@DynamoDbBean // Marks this class as a DynamoDB bean
public class Car {

    private String pk; // Partition Key 
    private String sk; // Sort Key 
    private String itemType; // To distinguish between different item types in the single table 
    private String carId; // Unique ID for the car 
    private String make; // Make of the vehicle 
    private String model; // Model of the vehicle 
    private Integer year; // Year of the vehicle 
    private String color; // Color of the vehicle 
    private Double price; // Price of the operation 
    private Integer rented; // Vehicle status: 0 = Not rented, 1 = Rented 
    private String delegationId; // Delegation managing the car 
    private String operation; // Type of operation (e.g., "rent", "return") 

    // Additional attributes that might be relevant for a car from your table structure
    private String engine;
    private String horsepower;
    private String transmission;
    private String fuelEconomy;
    private String acceleration;
    private String safetyRating;
    private String dimensions;
    private String cargoVolume;
    // Note: features could be a List<String> if stored as a DynamoDB List type.
    // private List<String> features;

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

    @DynamoDbAttribute("carId")
    public String getCarId() {
        return carId;
    }

    public void setCarId(String carId) {
        this.carId = carId;
    }

    @DynamoDbAttribute("make")
    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    @DynamoDbAttribute("model")
    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    @DynamoDbAttribute("year")
    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    @DynamoDbAttribute("color")
    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    @DynamoDbAttribute("price")
    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    @DynamoDbAttribute("rented")
    public Integer getRented() {
        return rented;
    }

    public void setRented(Integer rented) {
        this.rented = rented;
    }

    @DynamoDbAttribute("delegationId")
    public String getDelegationId() {
        return delegationId;
    }

    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    @DynamoDbAttribute("operation")
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    // New attributes based on the mock details provided in book-a-car.tsx
    @DynamoDbAttribute("engine")
    public String getEngine() {
        return engine;
    }

    public void setEngine(String engine) {
        this.engine = engine;
    }

    @DynamoDbAttribute("horsepower")
    public String getHorsepower() {
        return horsepower;
    }

    public void setHorsepower(String horsepower) {
        this.horsepower = horsepower;
    }

    @DynamoDbAttribute("transmission")
    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    @DynamoDbAttribute("fuelEconomy")
    public String getFuelEconomy() {
        return fuelEconomy;
    }

    public void setFuelEconomy(String fuelEconomy) {
        this.fuelEconomy = fuelEconomy;
    }

    @DynamoDbAttribute("acceleration")
    public String getAcceleration() {
        return acceleration;
    }

    public void setAcceleration(String acceleration) {
        this.acceleration = acceleration;
    }

    @DynamoDbAttribute("safetyRating")
    public String getSafetyRating() {
        return safetyRating;
    }

    public void setSafetyRating(String safetyRating) {
        this.safetyRating = safetyRating;
    }

    @DynamoDbAttribute("dimensions")
    public String getDimensions() {
        return dimensions;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }

    @DynamoDbAttribute("cargoVolume")
    public String getCargoVolume() {
        return cargoVolume;
    }

    public void setCargoVolume(String cargoVolume) {
        this.cargoVolume = cargoVolume;
    }


    // Helper method to set PK and SK based on carId
    public void setCarIdentifier(String carId) {
        this.carId = carId;
        this.pk = "CAR#" + carId;
        this.sk = "METADATA#" + carId;
        this.itemType = "car";
    }
}