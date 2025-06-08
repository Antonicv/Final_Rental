import React, { useEffect, useState } from "react";
import { getAllBookings } from "Frontend/generated/DelegationEndpoint";
import { getAllUsers } from "Frontend/generated/UserEndpoint";
import { getAllCars } from "Frontend/generated/DelegationEndpoint";

interface Booking {
  bookingId: string;
  carId: string;
  userId: string;
  startDate: string;
  endDate: string;
  delegationId?: string;
  bookingDate?: string;
}

interface User {
  userId: string;
  // otros campos si tienes
}

interface Car {
  delegationId: string;
  operation: string;
  make: string;
  model: string;
  year: number;
  color: string;
  rented: boolean;
  price: number;
}

const Dashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Type guard para validar los coches
  function isCarWithMakeAndModel(car: any): car is Car {
    return (
      typeof car?.make === "string" &&
      typeof car?.model === "string" &&
      typeof car?.year === "number" &&
      typeof car?.delegationId === "string"
    );
  }

useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      const [bookingsDataRaw, usersDataRaw, carsDataRaw] = await Promise.all([
        getAllBookings(),
        getAllUsers(),
        getAllCars(),
      ]);

      const bookingsData = (bookingsDataRaw ?? []).filter(
        (b): b is Booking => b !== undefined
      );
      const usersData = (usersDataRaw ?? []).filter(
        (u): u is User => u !== undefined
      );
      const carsData = (carsDataRaw ?? []).filter(
        (c): c is Car => c !== undefined
      );

      setBookings(bookingsData);
      setUsers(usersData);
      setCars(carsData);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);

  if (loading) return <p>Cargando datos del dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  const validCars = cars.filter(isCarWithMakeAndModel);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Dashboard Administrativo</h1>

      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
        <div>
          <h2>Reservas totales</h2>
          <p>{bookings.length}</p>
        </div>

        <div>
          <h2>Usuarios registrados</h2>
          <p>{users.length}</p>
        </div>

        <div>
          <h2>Vehículos disponibles</h2>
          <p>{validCars.length}</p>
        </div>
      </div>

      <h3>Lista de vehículos</h3>
      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Delegación</th>
            <th>Operación</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Año</th>
            <th>Color</th>
            <th>Estado</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          {validCars.map((car, index) => (
            <tr key={index}>
              <td>{car.delegationId}</td>
              <td>{car.operation}</td>
              <td>{car.make}</td>
              <td>{car.model}</td>
              <td>{car.year}</td>
              <td>{car.color}</td>
              <td>{car.rented ? "Alquilado" : "Disponible"}</td>
              <td>{car.price.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Últimas reservas</h3>
      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Car ID</th>
            <th>Usuario ID</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
          </tr>
        </thead>
        <tbody>
          {bookings
            .slice(-10)
            .reverse()
            .map((b) => (
              <tr key={b.bookingId}>
                <td>{b.bookingId}</td>
                <td>{b.carId}</td>
                <td>{b.userId}</td>
                <td>{b.startDate}</td>
                <td>{b.endDate}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
