package dev.renting.users;


import dev.renting.delegations.Car;
import dev.renting.delegations.Delegation;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;


@DynamoDbBean
public class Booking {
    private String userId;
    private String operation;
    private Car car;
    private String status;
    private String startDate;
    private String endDate;
    private double totalToPayment;
    private String statusPaymemt;
    private String statusBooking;
    private Delegation pickUpDelegation;
    private Delegation deliverDelegation;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @DynamoDbSortKey
    @DynamoDbAttribute("operation")
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    @DynamoDbAttribute("car")
    public Car getCar() { return car; }
    public void setCar(Car car) { this.car = car; }

    @DynamoDbAttribute("status")
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @DynamoDbAttribute("startDate")
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    @DynamoDbAttribute("endDate")
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    @DynamoDbAttribute("totalToPayment")
    public double getTotalToPayment() { return totalToPayment; }
    public void setTotalToPayment(double totalToPayment) { this.totalToPayment = totalToPayment; }

    @DynamoDbAttribute("statusPayment")
    public String getStatusPayment() { return statusPaymemt; }
    public void setStatusPayment(String statusPayment) { this.statusPaymemt = statusPayment; }

    @DynamoDbAttribute("statusBooking")
    public String getStatusBooking() { return statusBooking; }
    public void setStatusBooking(String statusBooking) { this.statusBooking = statusBooking; }

    @DynamoDbAttribute("pickUpDelegation")
    public Delegation getPickUpDelegation() { return pickUpDelegation; }
    public void setPickUpDelegation(Delegation pickUpDelegation) { this.pickUpDelegation = pickUpDelegation; }

    @DynamoDbAttribute("deliverDelegation")
    public Delegation getDeliverDelegation() { return deliverDelegation; }
    public void setDeliverDelegation(Delegation deliverDelegation) { this.deliverDelegation = deliverDelegation; }
}