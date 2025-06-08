package dev.renting.delegations;

import dev.renting.config.DynamoDBConfig;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest.Builder;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class DelegationRepositoryImpl implements DelegationRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<Car> carTable;
    private final DynamoDbTable<Delegation> delegationTable;

    public DelegationRepositoryImpl(DynamoDbEnhancedClient enhancedClient) {
        this.enhancedClient = enhancedClient;
        // Obtener la tabla de DynamoDB para Car
        this.carTable = enhancedClient.table(DynamoDBConfig.TABLE_NAME, TableSchema.fromBean(Car.class));
        // Obtener la tabla de DynamoDB para Delegation
        this.delegationTable = enhancedClient.table(DynamoDBConfig.TABLE_NAME, TableSchema.fromBean(Delegation.class));
    }

    @Override
    public Car saveCar(Car car) {
        if (car.getCarId() == null || car.getCarId().isEmpty()) {
            // Generate a unique carId if not provided (e.g., UUID)
            car.setCarIdentifier(java.util.UUID.randomUUID().toString());
        } else {
            car.setCarIdentifier(car.getCarId()); // Ensure PK and SK are set based on existing carId
        }
        carTable.putItem(car);
        return car;
    }

    @Override
    public Optional<Car> findCarById(String carId) {
        Key key = Key.builder()
                .partitionValue("CAR#" + carId)
                .sortValue("METADATA#" + carId) // Assuming METADATA#<carId> as the SK for car details
                .build();
        Car car = carTable.getItem(key);
        return Optional.ofNullable(car);
    }

    @Override
    public List<Car> findAllCars() {
        // Para obtener todos los coches, necesitamos escanear la tabla y filtrar por itemType "car"
        // Opcional: Si los coches están distribuidos en diferentes PKs (e.g., DELEGATION#<id> con SK CAR#<id>),
        // se requeriría una estrategia diferente (e.g., GSI o múltiples queries).
        // Por ahora, asumimos que los coches tienen PK = CAR#<carId> y SK = METADATA#<carId>
        // y que un SCAM es aceptable para el contexto actual (pocos datos o desarrollo).

        // Construir un ScanEnhancedRequest para filtrar por itemType "car"
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType")
                                .expressionValues(java.util.Collections.singletonMap(":itemType", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s("car").build()))
                                .build()
                )
                .build();

        return carTable.scan(scanRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public Car updateCar(Car car) {
        // Asegúrate de que el PK y SK estén correctos antes de actualizar
        if (car.getCarId() == null || car.getCarId().isEmpty()) {
            throw new IllegalArgumentException("Car ID must not be null for update operation.");
        }
        car.setCarIdentifier(car.getCarId()); // Re-establecer PK y SK
        carTable.updateItem(car);
        return car;
    }

    @Override
    public void deleteCar(String carId) {
        Key key = Key.builder()
                .partitionValue("CAR#" + carId)
                .sortValue("METADATA#" + carId)
                .build();
        carTable.deleteItem(key);
    }

    @Override
    public Delegation saveDelegation(Delegation delegation) {
        if (delegation.getDelegationId() == null || delegation.getDelegationId().isEmpty()) {
            delegation.setDelegationIdentifier(java.util.UUID.randomUUID().toString());
        } else {
            delegation.setDelegationIdentifier(delegation.getDelegationId());
        }
        delegationTable.putItem(delegation);
        return delegation;
    }

    @Override
    public Optional<Delegation> findDelegationById(String delegationId) {
        Key key = Key.builder()
                .partitionValue("DELEGATION#" + delegationId)
                .sortValue("METADATA#" + delegationId)
                .build();
        Delegation delegation = delegationTable.getItem(key);
        return Optional.ofNullable(delegation);
    }

    @Override
    public List<Delegation> findAllDelegations() {
        // Similar a findAllCars, usamos un scan con filtro por itemType "delegation"
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder()
                .filterExpression(
                        software.amazon.awssdk.enhanced.dynamodb.model.Expression.builder()
                                .expression("itemType = :itemType")
                                .expressionValues(java.util.Collections.singletonMap(":itemType", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s("delegation").build()))
                                .build()
                )
                .build();

        return delegationTable.scan(scanRequest)
                .items()
                .stream()
                .collect(Collectors.toList());
    }

    @Override
    public Delegation updateDelegation(Delegation delegation) {
        if (delegation.getDelegationId() == null || delegation.getDelegationId().isEmpty()) {
            throw new IllegalArgumentException("Delegation ID must not be null for update operation.");
        }
        delegation.setDelegationIdentifier(delegation.getDelegationId());
        delegationTable.updateItem(delegation);
        return delegation;
    }

    @Override
    public void deleteDelegation(String delegationId) {
        Key key = Key.builder()
                .partitionValue("DELEGATION#" + delegationId)
                .sortValue("METADATA#" + delegationId)
                .build();
        delegationTable.deleteItem(key);
    }
}