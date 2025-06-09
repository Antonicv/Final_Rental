import React, { useEffect, useState } from "react";
import { getAllBookings } from "Frontend/generated/DelegationEndpoint";
import { getAllUsers } from "Frontend/generated/UserEndpoint";
import { getAllCars } from "Frontend/generated/DelegationEndpoint";
import { Details } from '@vaadin/react-components/Details'; // Import Details for collapsible sections

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
  name?: string;
}

interface Car {
  delegationId: string;
  operation: string;
  make: string;
  model: string;
  year: number;
  color: string;
  rented: boolean;
  price: number; // Precio diario en euros
}

const IVA_RATE = 0.21;

const Dashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros para búsqueda de coches
  const [carSearchTerm, setCarSearchTerm] = useState("");
  const [carAvailabilityFilter, setCarAvailabilityFilter] = useState<
    "all" | "available" | "rented"
  >("all");

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bookingsDataRaw, usersDataRaw, carsDataRaw] = await Promise.all([
          getAllBookings(),
          getAllUsers(),
          getAllCars(),
        ]);

        setBookings((bookingsDataRaw ?? []).filter((b): b is Booking => b !== undefined));
        setUsers((usersDataRaw ?? []).filter((u): u is User => u !== undefined));
        setCars((carsDataRaw ?? []).filter((c): c is Car => c !== undefined));
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

  // Valid cars filter
  const validCars = cars.filter(
    (car) =>
      typeof car.make === "string" &&
      typeof car.model === "string" &&
      typeof car.year === "number" &&
      typeof car.delegationId === "string" &&
      typeof car.price === "number"
  );

  // Función para formatear precio según año
  const formatPrice = (car: Car) => {
    if (car.year < 2000) {
      // Conversión euros -> pesetas
      const pricePts = car.price * 166.386;
      return `${pricePts.toFixed(0)} Pts`;
    } else {
      return `${car.price.toFixed(2)} €`;
    }
  };

  // Filtrar coches según búsqueda y estado
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

  // Estadísticas por delegación
  interface DelegationStats {
    delegationId: string;
    totalReservations: number;
    totalIncome: number;
    totalCars: number;
    rentedCars: number;
    availableCars: number;
  }

  // Obtener delegaciones únicas
  const delegations = Array.from(new Set(cars.map((c) => c.delegationId)));

  const delegationStats: DelegationStats[] = delegations.map((delegId) => {
    const carsInDelegation = cars.filter((c) => c.delegationId === delegId);
    const totalCars = carsInDelegation.length;
    const rentedCars = carsInDelegation.filter((c) => c.rented).length;
    const availableCars = totalCars - rentedCars;

    // Reservas en esta delegación (buscamos coche con carId igual a operation en booking)
    const bookingsInDelegation = bookings.filter((b) => {
      const car = cars.find((c) => c.operation === b.carId); // Changed c.delegationId to c.operation
      return car?.delegationId === delegId;
    });

    const totalReservations = bookingsInDelegation.length;

    const totalIncome = bookingsInDelegation.reduce((acc, booking) => {
      const car = cars.find((c) => c.operation === booking.carId); // Changed c.delegationId to c.operation
      if (!car) return acc;
      const days = calculateDays(booking.startDate, booking.endDate);
      const priceWithoutIVA = car.price * days;
      const priceWithIVA = priceWithoutIVA * (1 + IVA_RATE);
      return acc + priceWithIVA;
    }, 0);

    return {
      delegationId: delegId,
      totalReservations,
      totalIncome,
      totalCars,
      rentedCars,
      availableCars,
    };
  });

  // Delegación con más ingresos
  const topDelegation = delegationStats.reduce((prev, current) =>
    current.totalIncome > prev.totalIncome ? current : prev,
    delegationStats[0]
  );

  // Función para descargar CSV
  const downloadCSV = (header: string[], rows: (string | number)[][], filename: string) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Para descargar CSV de coches filtrados
  const downloadCarsCSV = () => {
    const header = ["Delegación", "Operación", "Marca", "Modelo", "Año", "Color", "Estado", "Precio Diario"];
    const rows = filteredCars.map((car) => [
      car.delegationId,
      car.operation,
      car.make,
      car.model,
      car.year,
      car.color,
      car.rented ? "Alquilado" : "Disponible",
      car.year < 2000 ? `${(car.price * 166.386).toFixed(0)} Pts` : `${car.price.toFixed(2)} €`,
    ]);
    downloadCSV(header, rows, "vehiculos_filtrados.csv");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Dashboard Administrativo</h1>

      {/* Main Stats Summary (Always visible) */}
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

      {/* --- */}
      {/* Collapsible Section for Vehicle List */}
      <Details summary="Lista de vehículos y filtros" theme="filled">
        <div style={{ padding: "1rem" }}>
          {/* Filtros vehículos */}
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
            <button onClick={downloadCarsCSV} style={{ marginLeft: "1rem" }}>
              Descargar coches filtrados CSV
            </button>
          </div>

          <table border={1} cellPadding={5} style={{ marginBottom: "2rem", width: "100%" }}>
            <thead>
              <tr>
                <th>Delegación</th>
                <th>Operación</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Estado</th>
                <th>Precio Diario</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car, idx) => (
                <tr key={idx}>
                  <td>{car.delegationId}</td>
                  <td>{car.operation}</td>
                  <td>{car.make}</td>
                  <td>{car.model}</td>
                  <td>{car.year}</td>
                  <td>{car.color}</td>
                  <td>{car.rented ? "Alquilado" : "Disponible"}</td>
                  <td>{formatPrice(car)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Details>

      {/* --- */}
      {/* Collapsible Section for Delegation Statistics */}
      <Details summary="Estadísticas por Delegación" theme="filled" style={{ marginTop: "1rem" }}>
        <div style={{ padding: "1rem" }}>
          <p>
            Delegación que más ingresos genera: <b>{topDelegation.delegationId}</b> con{" "}
            <b>{topDelegation.totalIncome.toFixed(2)} €</b>
          </p>

          <table border={1} cellPadding={5} style={{ marginBottom: "1rem", width: "100%" }}>
            <thead>
              <tr>
                <th>Delegación</th>
                <th>Total Reservas</th>
                <th>Ingresos totales (€)</th>
                <th>Total Coches</th>
                <th>Coches Alquilados</th>
                <th>Coches Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {delegationStats.map((d) => (
                <tr key={d.delegationId}>
                  <td>{d.delegationId}</td>
                  <td style={{ textAlign: "center" }}>{d.totalReservations}</td>
                  <td style={{ textAlign: "right" }}>{d.totalIncome.toFixed(2)}</td>
                  <td style={{ textAlign: "center" }}>{d.totalCars}</td>
                  <td style={{ textAlign: "center" }}>{d.rentedCars}</td>
                  <td style={{ textAlign: "center" }}>{d.availableCars}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() =>
              downloadCSV(
                ["Delegación", "Total Reservas", "Ingresos totales (€)", "Total Coches", "Coches Alquilados", "Coches Disponibles"],
                delegationStats.map((d) => [
                  d.delegationId,
                  d.totalReservations,
                  d.totalIncome.toFixed(2),
                  d.totalCars,
                  d.rentedCars,
                  d.availableCars,
                ]),
                "estadisticas_delegaciones.csv"
              )
            }
          >
            Descargar estadísticas por delegación CSV
          </button>
        </div>
      </Details>
    </div>
  );
};

export default Dashboard;