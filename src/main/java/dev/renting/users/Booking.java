package dev.renting.users;


import dev.renting.delegations.Car;
import dev.renting.delegations.Delegation;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;


/**
 * Classe que representa una reserva de lloguer de cotxe.
 * S'utilitza DynamoDB per persistir les dades de les reserves.
 */
@DynamoDbBean
public class Booking {
    // Identificador de l'usuari que fa la reserva
    private String userId;
    // Identificador de l'operació de reserva
    private String operation;
    // El cotxe seleccionat per la reserva
    private Car car;
    // Estat general de la reserva
    private String status;
    // Data d'inici del lloguer
    private String startDate;
    // Data de finalització del lloguer
    private String endDate;
    // Import total a pagar
    private double totalToPayment;
    // Estat del pagament (pendent, pagat, etc.)
    private String statusPaymemt;
    // Estat de la reserva (confirmada, cancel·lada, etc.)
    private String statusBooking;
    // Delegació de recollida del vehicle
    private Delegation pickUpDelegation;
    // Delegació d'entrega del vehicle
    private Delegation deliverDelegation;

    /**
     * Clau de partició per DynamoDB.
     * Retorna l'identificador d'usuari.
     */
    @DynamoDbPartitionKey
    @DynamoDbAttribute("userId")
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    /**
     * Clau d'ordenació per DynamoDB.
     * Retorna l'identificador d'operació.
     */
    @DynamoDbSortKey
    @DynamoDbAttribute("operation")
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    // Mètodes getter i setter per al cotxe
    @DynamoDbAttribute("car")
    public Car getCar() { return car; }
    public void setCar(Car car) { this.car = car; }

    // Mètodes getter i setter per a l'estat
    @DynamoDbAttribute("status")
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    // Mètodes getter i setter per a la data d'inici
    @DynamoDbAttribute("startDate")
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    // Mètodes getter i setter per a la data de finalització
    @DynamoDbAttribute("endDate")
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    // Mètodes getter i setter per al total a pagar
    @DynamoDbAttribute("totalToPayment")
    public double getTotalToPayment() { return totalToPayment; }
    public void setTotalToPayment(double totalToPayment) { this.totalToPayment = totalToPayment; }

    // Mètodes getter i setter per a l'estat del pagament
    @DynamoDbAttribute("statusPayment")
    public String getStatusPayment() { return statusPaymemt; }
    public void setStatusPayment(String statusPayment) { this.statusPaymemt = statusPayment; }

    // Mètodes getter i setter per a l'estat de la reserva
    @DynamoDbAttribute("statusBooking")
    public String getStatusBooking() { return statusBooking; }
    public void setStatusBooking(String statusBooking) { this.statusBooking = statusBooking; }

    // Mètodes getter i setter per a la delegació de recollida
    @DynamoDbAttribute("pickUpDelegation")
    public Delegation getPickUpDelegation() { return pickUpDelegation; }
    public void setPickUpDelegation(Delegation pickUpDelegation) { this.pickUpDelegation = pickUpDelegation; }

    // Mètodes getter i setter per a la delegació d'entrega
    @DynamoDbAttribute("deliverDelegation")
    public Delegation getDeliverDelegation() { return deliverDelegation; }
    public void setDeliverDelegation(Delegation deliverDelegation) { this.deliverDelegation = deliverDelegation; }
}