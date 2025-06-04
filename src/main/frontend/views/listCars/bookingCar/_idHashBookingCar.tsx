import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { DelegationEndpoint, UserEndpoint } from 'Frontend/generated/endpoints';
import { DatePicker } from '@vaadin/react-components/DatePicker';
import { Select } from '@vaadin/react-components/Select';
import { Button } from '@vaadin/react-components/Button';

export const config: ViewConfig = {
  menu: { exclude: true },
  title: 'Complete Booking'
};

export default function BookingCar() {
  const { idHashBookingCar } = useParams<{ idHashBookingCar: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const car = location.state?.car;

  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [totalToPayment, setTotalToPayment] = useState<number | null>(null);
  const [sameDelegation, setSameDelegation] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    pickupDelegationId: undefined as any,
    deliverDelegationId: undefined as any
  });

  useEffect(() => {
    const loadDelegations = async () => {
      try {
        const result = await DelegationEndpoint.getAllProfileDelegations();
        setDelegations(result || []);
      } catch (error) {
        console.error('Error loading delegations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDelegations();
  }, []);

  // Keep deliverDelegationId in sync if sameDelegation is checked
  useEffect(() => {
    if (sameDelegation) {
      setFormData(prev => ({
        ...prev,
        deliverDelegationId: prev.pickupDelegationId
      }));
    }
  }, [sameDelegation, formData.pickupDelegationId]);

  const calculateTotalPayment = (startDate: string, endDate: string, price: number) => {
    if (!startDate || !endDate || !price) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const qtyDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (qtyDays <= 0) return 0;
    const totalBeforeTax = qtyDays * price;
    const tax = totalBeforeTax * 0.23;
    return +(totalBeforeTax + tax).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please select start and end dates');
      return;
    }
    if (!car) {
      alert('Car data is missing.');
      return;
    }
    if (!formData.pickupDelegationId || (!sameDelegation && !formData.deliverDelegationId)) {
      alert('Please select pickup and delivery delegations');
      return;
    }

    const total = calculateTotalPayment(formData.startDate, formData.endDate, car.price);
    if (total <= 0) {
      alert('Invalid dates selected.');
      return;
    }

    try {
      await UserEndpoint.saveBooking({
        userId: "USER#001",
        operation: 'booking#2025#009',
        car: car,
        startDate: formData.startDate,
        endDate: formData.endDate,
        pickUpDelegation: formData.pickupDelegationId,
        deliverDelegation: formData.deliverDelegationId,
        totalToPayment: total,
        statusPayment: "PAID",
        statusBooking: "CREATED"
      });
      setTotalToPayment(total);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to complete booking');
    }
  };

  if (!car) {
    return <div>Error: Car data not found. Please navigate from the car list.</div>;
  }

  if (loading) return <div>Loading...</div>;

  if (bookingSuccess) {
    return (
      <div className="p-m max-w-2xl mx-auto text-center">
        <h2 className="text-2xl mb-m text-green-700">Booking Confirmed!</h2>
        <div className="mb-m">
          <div><strong>Booking ID:</strong> {idHashBookingCar}</div>
          <div><strong>Car:</strong> {car?.model} ({car?.make})</div>
          <div><strong>From:</strong> {formData.startDate}</div>
          <div><strong>To:</strong> {formData.endDate}</div>
          <div><strong>Total Paid:</strong> {totalToPayment} €</div>
        </div>
        <Button theme="primary" onClick={() => navigate('/bookings')}>
          Go to My Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="p-m max-w-2xl mx-auto">
      <h2 className="text-xl mb-l">Booking ID: {idHashBookingCar}</h2>
      <div className="space-y-m">
        <DatePicker
          label="Start Date"
          required
          min={new Date().toISOString().split('T')[0]}
          onValueChanged={(e) => setFormData({ ...formData, startDate: e.detail.value })}
        />{" "}
        <DatePicker
          label="End Date"
          required
          min={formData.startDate}
          onValueChanged={(e) => setFormData({ ...formData, endDate: e.detail.value })}
        />
      </div>
      <div className="mt-xl flex items-center gap-m">
        <input
          type="checkbox"
          id="sameDelegation"
          checked={sameDelegation}
          onChange={(e) => setSameDelegation(e.target.checked)}
        />
        <label htmlFor="sameDelegation">Same location for pickup and return</label>
      </div>
      <div className="mt-xl">
        <Select
          label="Pickup Location"
          value={formData.pickupDelegationId}
          items={delegations.map(d => ({ label: d.name, value: d }))}
          onValueChanged={e => {
            const pickup = e.detail.value;
            setFormData(prev => ({
              ...prev,
              pickupDelegationId: pickup,
              deliverDelegationId: sameDelegation ? pickup : prev.deliverDelegationId
            }));
          }}
        />
      </div>
      {!sameDelegation && (
        <div className="mt-xl">
          <Select
            label="Return Location"
            value={formData.deliverDelegationId}
            items={delegations.map(d => ({ label: d.name, value: d }))}
            onValueChanged={e => setFormData({ ...formData, deliverDelegationId: e.detail.value })}
          />
        </div>
      )}
      {formData.startDate && formData.endDate && car?.price &&
        <div className="mt-m font-bold">
          Total to Pay: {calculateTotalPayment(formData.startDate, formData.endDate, car.price)} €
        </div>
      }
      <div className="mt-xl">
        <Button theme="primary" onClick={handleSubmit}>
          Confirm Booking
        </Button>
      </div>
    </div>
  );
}
