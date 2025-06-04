package dev.renting.delegations; // Asegúrate de que el paquete sea el correcto

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.LocalDate; // Para manejar fechas

@DynamoDbBean
public class Booking {
    private String carId;       // Partition Key: ID del coche reservado
    private String startDate;   // Sort Key: Fecha de inicio de la reserva (formato YYYY-MM-DD)
    private String endDate;     // Fecha de fin de la reserva (formato YYYY-MM-DD)
    private String userId;      // ID del usuario que realizó la reserva
    private String delegationId; // ID de la delegación del coche reservado
    private String bookingId;   // ID único de la reserva (podría ser generado o compuesto)
    private String bookingDate; // Fecha en que se realizó esta reserva

    // Constructor vacío requerido por DynamoDB Enhanced Client
    public Booking() {}

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

    // Método de ayuda para verificar superposición de fechas
    public boolean overlapsWith(LocalDate queryStartDate, LocalDate queryEndDate) {
        LocalDate bookingStart = LocalDate.parse(this.startDate);
        LocalDate bookingEnd = LocalDate.parse(this.endDate);

        // Una reserva se superpone si:
        // (bookingStart <= queryEndDate) AND (bookingEnd >= queryStartDate)
        return !bookingStart.isAfter(queryEndDate) && !bookingEnd.isBefore(queryStartDate);
    }
}
