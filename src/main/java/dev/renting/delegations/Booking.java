package dev.renting.delegations; // Este será el único paquete para Booking

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDate; // Para manejar fechas

@DynamoDbBean
public class Booking {
    private String carId;       // Partition Key de la tabla Bookings (ID del coche)
    private String startDate;   // Sort Key de la tabla Bookings (Fecha de inicio de la reserva)
    private String endDate;     // Fecha de fin de la reserva (formato YYYY-MM-DD)
    private String userId;      // Atributo para GSI: ID del usuario que realizó la reserva
    private String delegationId; // ID de la delegación principal del coche (ya existía)
    private String bookingId;   // ID único de la reserva (ej. BOOKING#UUID, generado si no se da)
    private String bookingDate; // Fecha en que se realizó esta reserva (ISO 8601)

    // Nuevos campos fusionados de la otra clase Booking
    private String status;              // Ej. "PENDING", "CONFIRMED", "CANCELLED"
    private double totalToPayment;      // Precio total calculado de la reserva
    private String statusPayment;       // Ej. "PAID", "PENDING", "REFUNDED"
    private String statusBooking;       // Ej. "ACTIVE", "COMPLETED", "EXPIRED"
    private String pickUpDelegationId;  // ID de la delegación de recogida
    private String deliverDelegationId; // ID de la delegación de entrega

    // Constructor vacío requerido por DynamoDB Enhanced Client
    public Booking() {}

    // Getters y Setters para las claves primarias
    @DynamoDbPartitionKey
    public String getCarId() {
        return carId;
    }

    public void setCarId(String carId) {
        this.carId = carId;
    }

    @DynamoDbSortKey
    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    // Getters y Setters para atributos adicionales
    @DynamoDbAttribute("endDate")
    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    @DynamoDbAttribute("userId")
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @DynamoDbAttribute("delegationId")
    public String getDelegationId() {
        return delegationId;
    }

    public void setDelegationId(String delegationId) {
        this.delegationId = delegationId;
    }

    @DynamoDbAttribute("bookingId")
    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    @DynamoDbAttribute("bookingDate")
    public String getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    // Getters y Setters para los campos fusionados
    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @DynamoDbAttribute("totalToPayment")
    public double getTotalToPayment() {
        return totalToPayment;
    }

    public void setTotalToPayment(double totalToPayment) {
        this.totalToPayment = totalToPayment;
    }

    @DynamoDbAttribute("statusPayment")
    public String getStatusPayment() {
        return statusPayment;
    }

    public void setStatusPayment(String statusPayment) {
        this.statusPayment = statusPayment;
    }

    @DynamoDbAttribute("statusBooking")
    public String getStatusBooking() {
        return statusBooking;
    }

    public void setStatusBooking(String statusBooking) {
        this.statusBooking = statusBooking;
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

    // Método de ayuda para verificar superposición de fechas
    public boolean overlapsWith(LocalDate queryStartDate, LocalDate queryEndDate) {
        LocalDate bookingStart = LocalDate.parse(this.startDate);
        LocalDate bookingEnd = LocalDate.parse(this.endDate);

        // Una reserva se superpone si:
        // (bookingStart <= queryEndDate) AND (bookingEnd >= queryStartDate)
        return !bookingStart.isAfter(queryEndDate) && !bookingEnd.isBefore(queryStartDate);
    }
}
