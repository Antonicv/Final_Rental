import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { UserEndpoint } from 'Frontend/generated/endpoints';
import { Button } from '@vaadin/react-components/Button';
import Booking from 'Frontend/generated/dev/renting/users/Booking';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import Delegation from 'Frontend/generated/dev/renting/delegations/Delegation';


export const config: ViewConfig = {
  menu: {
    title: '\u2003Create Booking',
    order: 4, // order within the Create submenu
   // icon: 'line-awesome/svg/list-ol-solid.svg',
  },

};


const sampleBooking: Booking = {
  userId: "USER#001",
  operation: "booking#2025#001",
  car: {
    delegationId: "DELEG#001",
    operation: "car#2025#001",
    make: "Toyota",
    model: "Camry",
    year: 2025,
    color: "Blue",
    rented: false,
    price: 40000
  },
  status: "ACTIVE",
  startDate: "2025-10-01",
  endDate: "2025-10-07",
  totalToPayment: 456.56,
  statusPayment: "PAID",
  statusBooking: "CREATED",
  pickUpDelegation: {
    delegationId: "DELEG#001",
    operation: "profile",
    name: "Barcelona Central",
    address: "Carrer de la Marina, 15",
    city: "Barcelona",
    availableCarQty: 12,
    phone: "+34 931 234 567",
    email: "central@renting.com"
  },
  deliverDelegation: {
    delegationId: "DELEG#001",
    operation: "profile",
    name: "Barcelona Central",
    address: "Carrer de la Marina, 15",
    city: "Barcelona",
    availableCarQty: 12,
    phone: "+34 931 234 567",
    email: "central@renting.com"
  }
};

export default function BookingsView() {
  const handleSaveBooking = async () => {
    try {
      await UserEndpoint.saveBooking(sampleBooking);
      alert('Booking saved successfully!');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save user');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <img style={{ width: '200px' }} src="images/empty-plant.png" />
      <h2>Booking Management</h2>

      <div className="card p-m">
        <pre className="text-left">
          {JSON.stringify(sampleBooking, null, 2)}
        </pre>
        <Button onClick={handleSaveBooking}>
          Save Booking
        </Button>
      </div>

      <p>Manage user bookings and dates</p>
    </div>
  );
}


