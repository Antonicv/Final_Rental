import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { UserEndpoint } from 'Frontend/generated/endpoints';
import { Grid } from '@vaadin/react-components/Grid';
import { GridColumn } from '@vaadin/react-components/GridColumn';

export const config: ViewConfig = {
  title: 'Crear Reserva', // Mantén el título
};
export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    UserEndpoint.getBookingsByUser('USER#001')
      .then((result) => setBookings(result ?? []))
      .catch((err) => {
        console.error('Failed to fetch bookings:', err);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading bookings...</div>;
  if (bookings.length === 0) return <div>No bookings found.</div>;

  return (
    <div>
        <div className="space-y-m">
            <p>Bookings for USER#001</p>
        </div>
      <Grid items={bookings}>
        <GridColumn path="operation" header="Booking ID" />
        <GridColumn
          header="Car"
          renderer={({ item }) =>
            `${item.car?.make ?? ''} ${item.car?.model ?? ''}`
          }
        />
        <GridColumn path="startDate" header="Start Date" />
        <GridColumn path="endDate" header="End Date" />
        <GridColumn
          header="Pick Up Delegation"
          renderer={({ item }) => item.pickUpDelegation?.name ?? ''}
        />
        <GridColumn
          header="Deliver Delegation"
          renderer={({ item }) => item.deliverDelegation?.name ?? ''}
        />
        <GridColumn path="statusBooking" header="Booking Status" />
        <GridColumn path="statusPayment" header="Payment Status" />
        <GridColumn
          header="Total (€)"
          renderer={({ item }) => item.totalToPayment?.toFixed(2) ?? '0.00'}
        />
      </Grid>
    </div>
  );
}
