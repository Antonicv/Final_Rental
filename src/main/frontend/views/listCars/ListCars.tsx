import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import Car from 'Frontend/generated/dev/renting/delegations/Car';
import { Button } from '@vaadin/react-components/Button';
import { useNavigate } from 'react-router-dom';

export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Book a car',
};

export default function ListCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    DelegationEndpoint.getAllCars()
      .then((result) => {
        const safeCars = (result ?? []).filter(
          (car): car is Car =>
            !!car &&
            typeof car.delegationId === 'string' &&
            typeof car.operation === 'string'
        );
        setCars(safeCars);
      })
      .catch((error) => {
        console.error('Failed to fetch cars:', error);
        setCars([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (car: Car) => {
    const userId = "USER#001";
    try {
      const idHashBookingCar = await generateBookingHash({
        make: car.make ?? '',
        model: car.model ?? '',
        userId
      });
      navigate(`/listCars/bookingCar/${idHashBookingCar}`, { state: { car } });
    } catch (error) {
      console.error('Error generating booking hash:', error);
      alert('Failed to start booking process');
    }
  };

  async function generateBookingHash(data: {
    make: string;
    model: string;
    userId: string;
  }): Promise<string> {
    const encoder = new TextEncoder();
    const dateString = new Date().toISOString().split('T')[0];
    const stringToHash = `${data.make}-${data.model}-${dateString}-${data.userId}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(stringToHash)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Asegúrate de que Car pueda tener .color
  function isCarWithMakeAndModel(car: Car): car is Car & { make: string; model: string; year?: number; color?: string; price?: number; rented?: boolean; } {
    return typeof car.make === 'string' && typeof car.model === 'string';
  }

  if (loading) {
    return <div>Loading cars...</div>;
  }

  if (cars.length === 0) {
    return <div>No cars available.</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      {cars
        .filter(isCarWithMakeAndModel)
        .map(car => (
          <div
            key={`${car.delegationId}-${car.operation}`}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              width: '320px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.5rem',
              background: '#fff'
            }}
          >
            {/* CAMBIO PARA INCLUIR EL COLOR */}
            <img
              src={`https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.make)}&modelFamily=${encodeURIComponent(car.model)}&paintId=${encodeURIComponent(car.color || '')}&zoomType=fullscreen`}
              alt={`${car.make} ${car.model}`}
              style={{
                width: '100%',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/300x180?text=Car+Not+Found';
              }}
            />
            <h3>
              {car.make} {car.model}
            </h3>
            <div style={{ marginBottom: '0.5rem', color: '#555' }}>
              Year: <strong>{car.year}</strong>
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#555' }}>
              Color: <strong>{car.color}</strong>
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#555' }}>
              Price: <strong>{car.price} €</strong>
            </div>
            <div style={{ marginBottom: '1rem', color: car.rented ? '#d33' : '#090' }}>
              {car.rented ? 'Rented' : 'Available'}
            </div>
            <Button
              theme="primary"
              disabled={car.rented}
              onClick={() => handleBook(car)}
              style={{ width: '100%' }}
            >
              BOOK
            </Button>
          </div>
        ))
      }
    </div>
  );
}