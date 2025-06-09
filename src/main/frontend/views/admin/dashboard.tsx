import React, { useEffect, useState } from "react";
import { getAllBookings } from "Frontend/generated/DelegationEndpoint"; // Importa la funció per obtenir totes les reserves
import { getAllUsers } from "Frontend/generated/UserEndpoint"; // Importa la funció per obtenir tots els usuaris
import { getAllCars } from "Frontend/generated/DelegationEndpoint"; // Importa la funció per obtenir tots els cotxes
import { Details } from '@vaadin/react-components/Details'; // Importa el component Details per a seccions col·lapsables

// Definició de la interfície per a una reserva
interface Booking {
  bookingId: string; // Identificador de la reserva
  carId: string; // Identificador del cotxe reservat
  userId: string; // Identificador de l'usuari que fa la reserva
  startDate: string; // Data d'inici de la reserva
  endDate: string; // Data de finalització de la reserva
  delegationId?: string; // ID de la delegació (opcional)
  bookingDate?: string; // Data de la reserva (opcional)
}

// Definició de la interfície per a un usuari
interface User {
  userId: string; // Identificador de l'usuari
  name?: string; // Nom de l'usuari (opcional)
}

// Definició de la interfície per a un cotxe
interface Car {
  delegationId: string; // ID de la delegació a la qual pertany el cotxe
  operation: string; // Identificador d'operació del cotxe (pot ser l'ID del cotxe a la lògica de negoci)
  make: string; // Marca del cotxe
  model: string; // Model del cotxe
  year: number; // Any de fabricació
  color: string; // Color del cotxe
  rented: boolean; // Estat de lloguer (true si està llogat, false si està disponible)
  price: number; // Preu diari en euros
}

const IVA_RATE = 0.21; // Taxa d'IVA fixa del 21%

const Dashboard: React.FC = () => {
  // Estats per emmagatzemar les dades obtingudes del backend
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true); // Estat de càrrega de dades
  const [error, setError] = useState<string | null>(null); // Estat d'error

  // Filtres per a la cerca de cotxes
  const [carSearchTerm, setCarSearchTerm] = useState(""); // Terme de cerca per marca o model
  const [carAvailabilityFilter, setCarAvailabilityFilter] = useState<
    "all" | "available" | "rented" // Filtre per disponibilitat: tots, disponibles, llogats
  >("all"); // Valor per defecte: tots

  // Funció per calcular el nombre de dies entre dues dates
  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime(); // Diferència en mil·lisegons
    // Retorna el nombre de dies, arrodonint cap amunt i assegurant que sigui almenys 1 dia.
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1);
  };

  // Efecte que s'executa una vegada al muntar el component per carregar les dades
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true); // Activa l'estat de càrrega
        // Executa totes les crides a l'API en paral·lel
        const [bookingsDataRaw, usersDataRaw, carsDataRaw] = await Promise.all([
          getAllBookings(),
          getAllUsers(),
          getAllCars(),
        ]);

        // Filtra les dades per assegurar que no hi hagi valors indefinits o nuls
        setBookings((bookingsDataRaw ?? []).filter((b): b is Booking => b !== undefined));
        setUsers((usersDataRaw ?? []).filter((u): u is User => u !== undefined));
        setCars((carsDataRaw ?? []).filter((c): c is Car => c !== undefined));
      } catch (err: any) {
        setError(err.message || "Error inesperado"); // Captura i mostra errors
      } finally {
        setLoading(false); // Desactiva l'estat de càrrega
      }
    }
    fetchData(); // Crida la funció per carregar dades
  }, []); // El array buit assegura que s'executa només una vegada

  // Mostra missatges de càrrega o error
  if (loading) return <p>Cargando datos del dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  // Filtra els cotxes per assegurar que tinguin les propietats necessàries
  const validCars = cars.filter(
    (car) =>
      typeof car.make === "string" &&
      typeof car.model === "string" &&
      typeof car.year === "number" &&
      typeof car.delegationId === "string" &&
      typeof car.price === "number"
  );

  // Funció per formatar el preu segons l'any del cotxe (pesetes o euros)
  const formatPrice = (car: Car) => {
    if (car.year < 2000) {
      // Conversió euros -> pesetes (1 EUR = 166.386 Pts)
      const pricePts = car.price * 166.386;
      return `${pricePts.toFixed(0)} Pts`; // Arrodoneix a 0 decimals per a pessetes
    } else {
      return `${car.price.toFixed(2)} €`; // Mostra amb 2 decimals per a euros
    }
  };

  // Filtra els cotxes segons el terme de cerca i l'estat de disponibilitat
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

  // Interfície per a les estadístiques de delegació
  interface DelegationStats {
    delegationId: string;
    totalReservations: number;
    totalIncome: number;
    totalCars: number;
    rentedCars: number;
    availableCars: number;
  }

  // Obté una llista de delegacions úniques
  const delegations = Array.from(new Set(cars.map((c) => c.delegationId)));

  // Calcula les estadístiques per a cada delegació
  const delegationStats: DelegationStats[] = delegations.map((delegId) => {
    const carsInDelegation = cars.filter((c) => c.delegationId === delegId);
    const totalCars = carsInDelegation.length;
    const rentedCars = carsInDelegation.filter((c) => c.rented).length;
    const availableCars = totalCars - rentedCars;

    // Filtra les reserves que pertanyen a aquesta delegació
    const bookingsInDelegation = bookings.filter((b) => {
      // Troba el cotxe associat a la reserva utilitzant `operation` com a `carId`
      const car = cars.find((c) => c.operation === b.carId);
      return car?.delegationId === delegId; // Comprova si el cotxe pertany a la delegació actual
    });

    const totalReservations = bookingsInDelegation.length;

    // Calcula els ingressos totals per a la delegació
    const totalIncome = bookingsInDelegation.reduce((acc, booking) => {
      const car = cars.find((c) => c.operation === booking.carId); // Troba el cotxe
      if (!car) return acc; // Si el cotxe no es troba, no afegeix res
      const days = calculateDays(booking.startDate, booking.endDate);
      const priceWithoutIVA = car.price * days;
      const priceWithIVA = priceWithoutIVA * (1 + IVA_RATE); // Aplica l'IVA
      return acc + priceWithIVA;
    }, 0); // S'inicialitza l'acumulador a 0

    return {
      delegationId: delegId,
      totalReservations,
      totalIncome,
      totalCars,
      rentedCars,
      availableCars,
    };
  });

  // Troba la delegació amb més ingressos
  const topDelegation = delegationStats.reduce((prev, current) =>
    current.totalIncome > prev.totalIncome ? current : prev,
    delegationStats[0] // S'inicialitza amb la primera delegació per defecte
  );

  // Funció per descarregar dades en format CSV
  const downloadCSV = (header: string[], rows: (string | number)[][], filename: string) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n"); // Uneix capçalera i files amb comes i salts de línia

    const encodedUri = encodeURI(csvContent); // Codifica l'URI per a caràcters especials
    const link = document.createElement("a"); // Crea un element 'a' (enllaç)
    link.setAttribute("href", encodedUri); // Estableix l'URL de l'enllaç
    link.setAttribute("download", filename); // Estableix el nom del fitxer a descarregar
    document.body.appendChild(link); // Afegeix l'enllaç al DOM
    link.click(); // Simula un clic a l'enllaç per iniciar la descàrrega
    document.body.removeChild(link); // Elimina l'enllaç del DOM
  };

  // Funció per descarregar els cotxes filtrats en format CSV
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
      car.year < 2000 ? `${(car.price * 166.386).toFixed(0)} Pts` : `${car.price.toFixed(2)} €`, // Formata el preu
    ]);
    downloadCSV(header, rows, "vehiculos_filtrados.csv"); // Crida a la funció de descàrrega CSV
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Dashboard Administrativo</h1>

      {/* Resum de les estadístiques principals (sempre visibles) */}
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
      {/* Secció Col·lapsable per a la Llista de Vehicles */}
      <Details summary="Lista de vehículos y filtros" theme="filled">
        <div style={{ padding: "1rem" }}>
          {/* Filtres de vehicles */}
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

          {/* Taula de vehicles filtrats */}
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
      {/* Secció Col·lapsable per a les Estadístiques per Delegació */}
      <Details summary="Estadísticas por Delegación" theme="filled" style={{ marginTop: "1rem" }}>
        <div style={{ padding: "1rem" }}>
          {/* Informació de la delegació amb més ingressos */}
          <p>
            Delegación que más ingresos genera: <b>{topDelegation.delegationId}</b> con{" "}
            <b>{topDelegation.totalIncome.toFixed(2)} €</b>
          </p>

          {/* Taula d'estadístiques per delegació */}
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

          {/* Botó per descarregar les estadístiques per delegació en CSV */}
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