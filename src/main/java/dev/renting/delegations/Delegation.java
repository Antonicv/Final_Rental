package dev.renting.delegations; // Defineix el paquet on es troba aquesta classe Java.

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute; // Anotació per mapejar un atribut Java a un atribut de DynamoDB amb un nom específic.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean; // Anotació per indicar que aquesta classe és un bean de DynamoDB, permetent el mapeig automàtic.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey; // Anotació per definir la clau de partició (Partition Key) de la taula DynamoDB.
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey; // Anotació per definir la clau d'ordenació (Sort Key) de la taula DynamoDB.

/**
 * Classe que representa una delegació en el sistema de lloguer.
 * Aquesta classe s'utilitza per mapejar dades entre l'aplicació Java i una taula de DynamoDB.
 */
@DynamoDbBean // Indica a l'SDK de DynamoDB Enhanced Client que aquesta classe és un objecte de dades mapejable.
public class Delegation {

    private String delegationId; // **Clau de partició**: Identificador únic de la delegació.
    private String operation;    // **Clau d'ordenació**: S'utilitza per a elements dins de la mateixa clau de partició (p. ex., "profile" per a dades de perfil de la delegació).
    private String name;         // Nom de la delegació.
    private String adress;       // Adreça física de la delegació.
    private String city;         // Ciutat on es troba la delegació.
    private String manager;      // Nom del gestor o responsable de la delegació.
    private String telf;         // Número de telèfon de contacte de la delegació.
    private int carQuantity;     // Quantitat total de cotxes assignats a aquesta delegació.
    private double lat;          // Latitud geogràfica de la delegació.
    private double longVal;      // Longitud geogràfica de la delegació. 'long' és una paraula reservada en Java, per això s'usa 'longVal' o un nom similar per evitar conflictes.

    // Constructor buit, necessari per al DynamoDB Enhanced Client per poder instanciar objectes en la deserialització.
    public Delegation() {}

    /**
     * Obté l'ID de la delegació.
     * @return L'ID de la delegació.
     */
    @DynamoDbPartitionKey // Marca aquest mètode com el getter de la clau de partició per a DynamoDB.
    @DynamoDbAttribute("delegationId") // Opcionalment, especifica el nom de l'atribut a DynamoDB si és diferent del nom del camp.
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
     * Obté el tipus d'operació/element dins de la delegació.
     * @return El tipus d'operació.
     */
    @DynamoDbSortKey // Marca aquest mètode com el getter de la clau d'ordenació per a DynamoDB.
    @DynamoDbAttribute("operation") // Opcionalment, especifica el nom de l'atribut a DynamoDB.
    public String getOperation() {
        return operation;
    }

    /**
     * Estableix el tipus d'operació/element.
     * @param operation El tipus d'operació a establir.
     */
    public void setOperation(String operation) {
        this.operation = operation;
    }

    /**
     * Obté el nom de la delegació.
     * @return El nom de la delegació.
     */
    @DynamoDbAttribute("name") // Mapeja a l'atribut "name" a DynamoDB.
    public String getName() {
        return name;
    }

    /**
     * Estableix el nom de la delegació.
     * @param name El nom a establir.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Obté l'adreça de la delegació.
     * @return L'adreça de la delegació.
     */
    @DynamoDbAttribute("adress") // Mapeja a l'atribut "adress" a DynamoDB.
    public String getAdress() {
        return adress;
    }

    /**
     * Estableix l'adreça de la delegació.
     * @param adress L'adreça a establir.
     */
    public void setAdress(String adress) {
        this.adress = adress;
    }

    /**
     * Obté la ciutat de la delegació.
     * @return La ciutat de la delegació.
     */
    @DynamoDbAttribute("city") // Mapeja a l'atribut "city" a DynamoDB.
    public String getCity() {
        return city;
    }

    /**
     * Estableix la ciutat de la delegació.
     * @param city La ciutat a establir.
     */
    public void setCity(String city) {
        this.city = city;
    }

    /**
     * Obté el nom del gestor de la delegació.
     * @return El nom del gestor.
     */
    @DynamoDbAttribute("manager") // Mapeja a l'atribut "manager" a DynamoDB.
    public String getManager() {
        return manager;
    }

    /**
     * Estableix el nom del gestor.
     * @param manager El nom del gestor a establir.
     */
    public void setManager(String manager) {
        this.manager = manager;
    }

    /**
     * Obté el número de telèfon de la delegació.
     * @return El número de telèfon.
     */
    @DynamoDbAttribute("telf") // Mapeja a l'atribut "telf" a DynamoDB.
    public String getTelf() {
        return telf;
    }

    /**
     * Estableix el número de telèfon de la delegació.
     * @param telf El número de telèfon a establir.
     */
    public void setTelf(String telf) {
        this.telf = telf;
    }

    /**
     * Obté la quantitat de cotxes de la delegació.
     * @return La quantitat de cotxes.
     */
    @DynamoDbAttribute("carQuantity") // Mapeja a l'atribut "carQuantity" a DynamoDB.
    public int getCarQuantity() {
        return carQuantity;
    }

    /**
     * Estableix la quantitat de cotxes de la delegació.
     * @param carQuantity La quantitat de cotxes a establir.
     */
    public void setCarQuantity(int carQuantity) {
        this.carQuantity = carQuantity;
    }

    /**
     * Obté la latitud de la delegació.
     * @return La latitud.
     */
    @DynamoDbAttribute("lat") // Mapeja a l'atribut "lat" a DynamoDB.
    public double getLat() {
        return lat;
    }

    /**
     * Estableix la latitud de la delegació.
     * @param lat La latitud a establir.
     */
    public void setLat(double lat) {
        this.lat = lat;
    }

    /**
     * Obté la longitud de la delegació.
     * Es va utilitzar 'longVal' com a nom de camp per evitar un conflicte amb la paraula clau 'long' de Java.
     * No obstant això, l'atribut de DynamoDB s'anomenarà "long" segons l'anotació.
     * @return La longitud.
     */
    @DynamoDbAttribute("long") // Mapeja a l'atribut "long" a DynamoDB, respectant el nom real de l'atribut a la base de dades.
    public double getLongVal() {
        return longVal;
    }

    /**
     * Estableix la longitud de la delegació.
     * @param longVal La longitud a establir.
     */
    public void setLongVal(double longVal) {
        this.longVal = longVal;
    }
}