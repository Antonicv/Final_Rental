package dev.renting.delegations;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException; // Importar para manejar errores de parseo de fecha
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Endpoint
@AnonymousAllowed
public class DelegationEndpoint {

    private final DelegationRepository delegationRepository;

    @Autowired
    public DelegationEndpoint(DelegationRepository delegationRepository) {
        this.delegationRepository = delegationRepository;
    }

    // Save Delegation
    public void saveDelegation(Delegation delegation) {
        delegationRepository.save(delegation);
    }

    // Save Car
    public void saveCar(Car car) {
        delegationRepository.save(car);
    }

    /**
     * Saves a new booking. Generates a bookingId and sets the bookingDate if not provided.
     * Assumes the repository can save Booking objects.
     * @param booking The Booking object to save.
     */
    public void saveBooking(Booking booking) {
        System.out.println("DEBUG: saveBooking called for carId: " + booking.getCarId());
        // Generate a bookingId if it doesn't have one
        if (booking.getBookingId() == null || booking.getBookingId().isEmpty()) {
            booking.setBookingId("BOOKING#" + UUID.randomUUID().toString());
        }
        // Assign the current booking date
        booking.setBookingDate(LocalDate.now().toString());
        delegationRepository.save(booking); // Assuming the repository can save Bookings
        System.out.println("DEBUG: Booking saved successfully.");
    }

    // Get Delegation by keys
    public Delegation getDelegation(String delegationId, String operation) {
        return delegationRepository.get(delegationId, operation, Delegation.class);
    }

    // Get Car by keys
    public Car getCar(String id, String operation) {
        return delegationRepository.get(id, operation, Car.class);
    }

    // List Delegations by delegationId
    public List<Delegation> listDelegationsById(String delegationId) {
        return delegationRepository.listByPartitionKey(delegationId, Delegation.class);
    }

    // List Cars by id (partition key)
    public List<Car> listCarsById(String id) {
        return delegationRepository.listByPartitionKey(id, Car.class);
    }

    // List all cars for all delegations
    public List<Car> getAllCars() {
        return delegationRepository.listAllCars();
    }

    // List all delegations with operation = "profile"
    public List<Delegation> getAllProfileDelegations() {
        System.out.println("DEBUG: getAllProfileDelegations called.");
        List<Delegation> allDelegations = delegationRepository.listAllDelegations();
        System.out.println("DEBUG: Total delegations from repo: " + allDelegations.size());
        List<Delegation> profileDelegations = allDelegations.stream()
                .filter(d -> "profile".equals(d.getOperation()))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Profile delegations filtered: " + profileDelegations.size());
        return profileDelegations;
    }

    /**
     * Searches for available cars by delegation and date range, querying real bookings.
     *
     * @param city The city of the delegation.
     * @param startDateStr The start date of the rental period (YYYY-MM-DD format).
     * @param endDateStr The end date of the rental period (YYYY-MM-DD format).
     * @return A list of available cars.
     */
    public List<Car> getAvailableCars(String city, String startDateStr, String endDateStr) {
        System.out.println("DEBUG: getAvailableCars called for city: " + city + ", start: " + startDateStr + ", end: " + endDateStr);

        LocalDate queryStartDate;
        LocalDate queryEndDate;
        try {
            queryStartDate = LocalDate.parse(startDateStr);
            queryEndDate = LocalDate.parse(endDateStr);
            System.out.println("DEBUG: Dates parsed successfully. Query Start: " + queryStartDate + ", Query End: " + queryEndDate);
        } catch (DateTimeParseException e) {
            System.err.println("ERROR: Failed to parse dates: " + e.getMessage());
            // Lanza una excepción para que el frontend reciba un error claro
            throw new IllegalArgumentException("Invalid date format. Expected YYYY-MM-DD.", e);
        }


        // 1. Find the delegation by city
        Optional<Delegation> targetDelegation = delegationRepository.listAllDelegations().stream()
                .filter(d -> d.getCity() != null && d.getCity().equalsIgnoreCase(city))
                .findFirst();

        if (targetDelegation.isEmpty()) {
            System.out.println("DEBUG: Delegation not found for city: " + city);
            return new ArrayList<>(); // If delegation not found, no cars are available
        }

        String delegationId = targetDelegation.get().getDelegationId();
        System.out.println("DEBUG: Delegation found: " + delegationId);

        // 2. Get all cars for that delegation
        List<Car> carsInDelegation = delegationRepository.listAllCars().stream()
                .filter(car -> car.getDelegationId() != null && car.getDelegationId().equals(delegationId))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Number of cars found in delegation " + delegationId + ": " + carsInDelegation.size());

        List<Car> availableCars = new ArrayList<>();

        // 3. For each car, check if there are any overlapping bookings
        for (Car car : carsInDelegation) {
            // IMPORTANT: Use car.getOperation() as the unique ID for the car,
            // as 'operation' is the sort key for car items and matches 'carId' in Bookings.
            String carUniqueId = car.getOperation();
            if (carUniqueId == null || carUniqueId.isEmpty()) {
                System.err.println("WARNING: Car found with null or empty unique ID (operation). Skipping: " + car.getMake() + " " + car.getModel());
                continue; // Skip this car if its unique ID is invalid
            }

            System.out.println("DEBUG: Checking bookings for car ID: " + carUniqueId);
            List<Booking> bookingsForCar = delegationRepository.listByPartitionKey(carUniqueId, Booking.class);
            System.out.println("DEBUG: Number of bookings found for car " + carUniqueId + ": " + bookingsForCar.size());

            boolean isBookedDuringPeriod = false;
            for (Booking booking : bookingsForCar) {
                System.out.println("DEBUG: Checking booking " + booking.getBookingId() + " (Car: " + booking.getCarId() + ") from " + booking.getStartDate() + " to " + booking.getEndDate());
                if (booking.overlapsWith(queryStartDate, queryEndDate)) {
                    isBookedDuringPeriod = true;
                    System.out.println("DEBUG: Car " + carUniqueId + " is booked during the requested period by booking " + booking.getBookingId());
                    break; // No need to check more bookings for this car
                }
            }

            // Only add the car to available list if it's not booked during the period
            if (!isBookedDuringPeriod) {
                availableCars.add(car);
                System.out.println("DEBUG: Car " + carUniqueId + " is available.");
            }
        }
        System.out.println("DEBUG: Final count of available cars found: " + availableCars.size());
        return availableCars;
    }
}
