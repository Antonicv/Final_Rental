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

  // Estados para filtros
  const [carSearchTerm, setCarSearchTerm] = useState("");
  const [carAvailabilityFilter, setCarAvailabilityFilter] = useState<
    "all" | "available" | "rented"
  >("all");

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

  // Filtrado según búsqueda y estado
  const filteredCars = validCars.filter((car) => {
    const matchesSearch =
      car.make.toLowerCase().includes(carSearchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(carSearchTerm.toLowerCase());

    const matchesAvailability =
      carAvailabilityFilter === "all" ||
      (carAvailabilityFilter === "available" && !car.rented) ||
      (carAvailabilityFilter === "rented" && car.rented);

    return matchesSearch && matchesAvailability;
  });

  // ---------- NUEVAS ESTADÍSTICAS ----------

  // Vehículos por delegación
  const carsByDelegation = validCars.reduce((acc, car) => {
    acc[car.delegationId] = (acc[car.delegationId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fecha hoy para comparar reservas activas
  const today = new Date();

  // Reservas activas hoy (startDate <= today <= endDate)
  const activeBookings = bookings.filter((b) => {
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    return start <= today && today <= end;
  });

  // Duración promedio de reserva (en días)
  const avgBookingDuration =
    bookings.length === 0
      ? 0
      : bookings.reduce((sum, b) => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate);
          const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
          return sum + diffDays;
        }, 0) / bookings.length;

  // Usuarios con reservas activas (únicos)
  const activeUsersSet = new Set(activeBookings.map((b) => b.userId));
  const activeUsersCount = activeUsersSet.size;

  // Usuarios frecuentes (top 5 por número de reservas)
  const bookingCountByUser = bookings.reduce((acc, b) => {
    acc[b.userId] = (acc[b.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUsers = Object.entries(bookingCountByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Ingreso total estimado por reservas activas (sumar precio coches de reservas activas)
  // Map de coches por ID para acceso rápido
  const carById = new Map(validCars.map((car) => [car.delegationId, car]));
  // Nota: no tengo carId key explícito en Car, supongo delegationId == carId?
  // Si no es así, ajusta esto:
  const carByCarId = new Map(validCars.map((car) => [car.delegationId, car]));

  // Suma precios de coches alquilados en reservas activas
  const totalIncomeActiveBookings = activeBookings.reduce((sum, booking) => {
    const car = carByCarId.get(booking.carId);
    return sum + (car ? car.price : 0);
  }, 0);

  // -----------------------------------------

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

      {/* Estadísticas nuevas */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>Estadísticas adicionales</h3>

        <p>
          <strong>Vehículos por delegación:</strong>
        </p>
        <ul>
          {Object.entries(carsByDelegation).map(([delegation, count]) => (
            <li key={delegation}>
              {delegation}: {count}
            </li>
          ))}
        </ul>

        <p>
          <strong>Reservas activas hoy:</strong> {activeBookings.length}
        </p>

        <p>
          <strong>Duración promedio de reserva:</strong>{" "}
          {avgBookingDuration.toFixed(1)} días
        </p>

        <p>
          <strong>Usuarios con reservas activas:</strong> {activeUsersCount}
        </p>

        <p>
          <strong>Usuarios frecuentes (top 5):</strong>
        </p>
        <ol>
          {topUsers.map(([userId, count]) => (
            <li key={userId}>
              Usuario {userId}: {count} reservas
            </li>
          ))}
        </ol>

        <p>
          <strong>Ingreso total estimado por reservas activas:</strong>{" "}
          {totalIncomeActiveBookings.toFixed(2)} €
        </p>
      </div>

      <h3>Lista de vehículos</h3>

      {/* Filtros para vehículos */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Buscar por marca o modelo"
          value={carSearchTerm}
          onChange={(e) => setCarSearchTerm(e.target.value)}
          style={{ marginRight: "1rem" }}
        />
        <select
          value={carAvailabilityFilter}
          onChange={(e) =>
            setCarAvailabilityFilter(e.target.value as "all" | "available" | "rented")
          }
        >
          <option value="all">Todos</option>
          <option value="available">Disponibles</option>
          <option value="rented">Alquilados</option>
        </select>
      </div>

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
          {filteredCars.map((car, index) => (
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
