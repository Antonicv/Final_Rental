package dev.renting.delegations; // Se unifica en el paquete de delegaciones

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDate; // Para manejar fechas

@Data // Genera getters, setters, toString, equals y hashCode
@NoArgsConstructor // Genera un constructor sin argumentos
@AllArgsConstructor // Genera un constructor con todos los argumentos
@DynamoDbBean // Anotación requerida por el DynamoDB Enhanced Client
public class Booking {

    // Claves Primarias de la tabla DynamoDB (Diseño de Tabla Única)
    private String pk; // Partition Key (BOOKING#<bookingId>)
    private String sk; // Sort Key (METADATA#<bookingId>)
    private String itemType; // Para distinguir tipos de ítems (ej. "booking")

    // Atributos de la reserva
    private String bookingId;       // ID único de la reserva
    private String userId;          // ID del usuario que realizó la reserva
    private String carId;           // Identificador del vehículo reservado
    private Integer carQuantity;    // Cantidad de vehículos reservados (si aplica, ej. para flotas)
    private String bookingDate;     // Fecha en que se realizó esta reserva (ISO 8601)
    private String startDate;       // Fecha de inicio de la reserva (ISO 8601)
    private String endDate;         // Fecha de fin de la reserva (ISO 8601)
    private String status;          // Estado general del ítem (ej. "active", "cancelled")
    private String statusBooking;   // Estado específico de la reserva (ej. "confirmed", "pending")
    private String statusPayment;   // Estado del pago (ej. "paid", "unpaid")
    private Double totalToPayment;  // Total a pagar por la reserva
    private String pickUpDelegationId; // Delegación de recogida del vehículo
    private String deliverDelegationId; // Delegación donde se entrega el vehículo
    private String createdAt;       // Fecha de creación del registro (ISO 8601)

    // Getters y Setters para las claves primarias
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

    // Getters y Setters para itemType
    @DynamoDbAttribute("itemType")
    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    // Getters y Setters para los atributos de la reserva (generados por Lombok, pero mantenidos para claridad en @DynamoDbAttribute)
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

    // Métodos auxiliares

    /**
     * Método de ayuda para establecer PK, SK e itemType basándose en el bookingId.
     * Este método es crucial para el diseño de tabla única de DynamoDB.
     * @param bookingId El ID único de la reserva.
     */
    public void setBookingIdentifier(String bookingId) {
        this.bookingId = bookingId;
        this.pk = "BOOKING#" + bookingId;
        this.sk = "METADATA#" + bookingId;
        this.itemType = "booking";
    }

    /**
     * Verifica si el rango de fechas de esta reserva se superpone con un rango de fechas dado.
     * @param queryStartDate La fecha de inicio del rango a comparar.
     * @param queryEndDate La fecha de fin del rango a comparar.
     * @return true si hay superposición, false en caso contrario.
     */
    public boolean overlapsWith(LocalDate queryStartDate, LocalDate queryEndDate) {
        if (this.startDate == null || this.endDate == null) {
            return false; // No puede haber superposición si las fechas de la reserva no están completas
        }
        LocalDate bookingStart = LocalDate.parse(this.startDate);
        LocalDate bookingEnd = LocalDate.parse(this.endDate);

        // Una reserva se superpone si:
        // (bookingStart <= queryEndDate) AND (bookingEnd >= queryStartDate)
        // Es decir, no comienza después de que la consulta termina Y no termina antes de que la consulta comienza.
        return !bookingStart.isAfter(queryEndDate) && !bookingEnd.isBefore(queryStartDate);
    }
}