package dev.renting.delegations;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

@DynamoDbBean
public class Car {
    private String delegationId;
    private String operation;
    private String make;
    private String model;
    private int year;
    private String color;
    private boolean rented;
    private int price;

    // Partition key
    @DynamoDbPartitionKey
    public String getDelegationId() {
        return delegationId;
    }

    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    @DynamoDbSortKey
    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
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
    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    @DynamoDbAttribute("color")
    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public boolean isRented() {
        return rented;
    }

    public void setRented(boolean rented) {
        this.rented = rented;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    // Note: DynamoDB Enhanced Client does not natively support dynamic additional properties.
    // If you need to store extra unknown attributes, consider using a Map<String, AttributeValue> field
    // or a JSON string attribute to hold those extra properties.
}
