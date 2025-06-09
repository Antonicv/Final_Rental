package dev.renting.delegations; 

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute; // Anotació per mapejar un atribut Java a un atribut de DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean; // Anotació per indicar que aquesta classe és un bean de DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey; // Anotació per definir la clau de partició de la taula DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey; // Anotació per definir la clau d'ordenació de la taula DynamoDB.

import java.time.LocalDate; // Per a manejar dates de forma moderna i immutables.


@DynamoDbBean // Indica que aquesta classe pot ser mapejada a una taula de DynamoDB.
public class Booking {
    private String carId;       // Clau de partició (Partition Key): ID del cotxe reservat.
    private String startDate;   // Clau d'ordenació (Sort Key): Data d'inici de la reserva (format YYYY-MM-DD).
    private String endDate;     // Data de fi de la reserva (format YYYY-MM-DD).
    private String userId;      // ID de l'usuari que va realitzar la reserva.
    private String delegationId; // ID de la delegació a la qual pertany el cotxe reservat.
    private String bookingId;   // ID únic de la reserva (podria ser generat o ser un compost).
    private String bookingDate; // Data en què es va realitzar aquesta reserva.

    // Constructor buit, requerit per l'Enhanced Client de DynamoDB per instanciar objectes.
    public Booking() {}

    /**
     * Obté l'ID del cotxe.
     * @return L'ID del cotxe.
     */
    @DynamoDbPartitionKey // Marca aquest mètode com el getter de la clau de partició.
    public String getCarId() {
        return carId;
    }

    /**
     * Estableix l'ID del cotxe.
     * @param carId L'ID del cotxe a establir.
     */
    public void setCarId(String carId) {
        this.carId = carId;
    }

    /**
     * Obté la data d'inici de la reserva.
     * @return La data d'inici en format String.
     */
    @DynamoDbSortKey // Marca aquest mètode com el getter de la clau d'ordenació.
    public String getStartDate() {
        return startDate;
    }

    /**
     * Estableix la data d'inici de la reserva.
     * @param startDate La data d'inici a establir en format String (YYYY-MM-DD).
     */
    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    /**
     * Obté la data de fi de la reserva.
     * @return La data de fi en format String.
     */
    @DynamoDbAttribute("endDate") // Mapeja aquest mètode a l'atribut "endDate" a DynamoDB.
    public String getEndDate() {
        return endDate;
    }

    /**
     * Estableix la data de fi de la reserva.
     * @param endDate La data de fi a establir en format String (YYYY-MM-DD).
     */
    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    /**
     * Obté l'ID de l'usuari que va fer la reserva.
     * @return L'ID de l'usuari.
     */
    @DynamoDbAttribute("userId") // Mapeja a l'atribut "userId".
    public String getUserId() {
        return userId;
    }

    /**
     * Estableix l'ID de l'usuari.
     * @param userId L'ID de l'usuari a establir.
     */
    public void setUserId(String userId) {
        this.userId = userId;
    }

    /**
     * Obté l'ID de la delegació.
     * @return L'ID de la delegació.
     */
    @DynamoDbAttribute("delegationId") // Mapeja a l'atribut "delegationId".
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
     * Obté l'ID únic de la reserva.
     * @return L'ID de la reserva.
     */
    @DynamoDbAttribute("bookingId") // Mapeja a l'atribut "bookingId".
    public String getBookingId() {
        return bookingId;
    }

    /**
     * Estableix l'ID de la reserva.
     * @param bookingId L'ID de la reserva a establir.
     */
    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    /**
     * Obté la data en què es va realitzar la reserva.
     * @return La data de la reserva en format String.
     */
    @DynamoDbAttribute("bookingDate") // Mapeja a l'atribut "bookingDate".
    public String getBookingDate() {
        return bookingDate;
    }

    /**
     * Estableix la data en què es va realitzar la reserva.
     * @param bookingDate La data de la reserva a establir en format String (YYYY-MM-DD).
     */
    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    /**
     * Mètode d'ajuda per verificar si la reserva actual se superposa amb un rang de dates donat.
     * Utilitza LocalDate per una comparació de dates precisa.
     * @param queryStartDate La data d'inici del rang a consultar.
     * @param queryEndDate La data de fi del rang a consultar.
     * @return true si hi ha superposició, false en cas contrari.
     */
    public boolean overlapsWith(LocalDate queryStartDate, LocalDate queryEndDate) {
        // Converteix les dates d'inici i fi de la reserva actual de String a LocalDate.
        LocalDate bookingStart = LocalDate.parse(this.startDate);
        LocalDate bookingEnd = LocalDate.parse(this.endDate);

        // Una reserva se superposa amb un rang de consulta si:
        // (la data d'inici de la reserva és anterior o igual a la data de fi de la consulta)
        // AND (la data de fi de la reserva és posterior o igual a la data d'inici de la consulta)
        return !bookingStart.isAfter(queryEndDate) && !bookingEnd.isBefore(queryStartDate);
    }
}