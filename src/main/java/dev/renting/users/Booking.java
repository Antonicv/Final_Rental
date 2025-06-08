package dev.renting.users;

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
public class Booking {

    private String pk; // Partition Key 
    private String sk; // Sort Key 
    private String itemType; // To distinguish between different item types 
    private String bookingId; // ID único de la reserva 
    private String userId; // ID del usuario 
    private String carId; // Identificador del vehículo 
    private Integer carQuantity; // Cantidad de vehículos reservados 
    private String bookingDate; // Fecha de la reserva (ISO 8601) 
    private String startDate; // Fecha de inicio de la reserva (ISO 8601) 
    private String endDate; // Fecha de fin de la reserva (ISO 8601) 
    private String status; // Estado general del ítem 
    private String statusBooking; // Estado específico de la reserva 
    private String statusPayment; // Estado del pago 
    private Double totalToPayment; // Total a pagar 
    private String pickUpDelegationId; // Delegación de recogida del vehículo 
    private String deliverDelegationId; // Delegación donde se entrega el vehículo 
    private String createdAt; // Fecha de creación del registro (ISO 8601) 


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

    @DynamoDbAttribute("bookingId")
    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    @DynamoDbAttribute("userId")
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbAttribute("carId")
    public String getCarId() {
        return carId;
    }

    public void setCarId(String carId) {
        this.carId = carId;
    }

    @DynamoDbAttribute("carQuantity")
    public Integer getCarQuantity() {
        return carQuantity;
    }

    public void setCarQuantity(Integer carQuantity) {
        this.carQuantity = carQuantity;
    }

    @DynamoDbAttribute("bookingDate")
    public String getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    @DynamoDbAttribute("startDate")
    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    @DynamoDbAttribute("endDate")
    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @DynamoDbAttribute("statusBooking")
    public String getStatusBooking() {
        return statusBooking;
    }

    public void setStatusBooking(String statusBooking) {
        this.statusBooking = statusBooking;
    }

    @DynamoDbAttribute("statusPayment")
    public String getStatusPayment() {
        return statusPayment;
    }

    public void setStatusPayment(String statusPayment) {
        this.statusPayment = statusPayment;
    }

    @DynamoDbAttribute("totalToPayment")
    public Double getTotalToPayment() {
        return totalToPayment;
    }

    public void setTotalToPayment(Double totalToPayment) {
        this.totalToPayment = totalToPayment;
    }

    @DynamoDbAttribute("pickUpDelegationId")
    public String getPickUpDelegationId() {
        return pickUpDelegationId;
    }

    public void setPickUpDelegationId(String pickUpDelegationId) {
        this.pickUpDelegationId = pickUpDelegationId;
    }

    @DynamoDbAttribute("deliverDelegationId")
    public String getDeliverDelegationId() {
        return deliverDelegationId;
    }

    public void setDeliverDelegationId(String deliverDelegationId) {
        this.deliverDelegationId = deliverDelegationId;
    }

    @DynamoDbAttribute("createdAt")
    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    // Helper method to set PK and SK based on bookingId
    public void setBookingIdentifier(String bookingId) {
        this.bookingId = bookingId;
        this.pk = "BOOKING#" + bookingId;
        this.sk = "METADATA#" + bookingId;
        this.itemType = "booking";
    }
}