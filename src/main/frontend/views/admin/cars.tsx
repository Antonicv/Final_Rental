import React, { useEffect, useState } from 'react';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { Button } from '@vaadin/react-components/Button';
import { Dialog } from '@vaadin/react-components/Dialog';
import { TextField } from '@vaadin/react-components/TextField';
import { Checkbox } from '@vaadin/react-components/Checkbox';
import { Details } from '@vaadin/react-components/Details'; // Import Details for collapsible sections
import { NumberField } from '@vaadin/react-components/NumberField'; // Import NumberField for numeric inputs

// Import the DelegationEndpoint for fetching data from the backend
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
// Import the Car interface from the generated types
import Car from 'Frontend/generated/dev/renting/delegations/Car';

// Configuration for Hilla Router
export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Gestión de Vehículos',
};

// Helper function to sanitize filenames for local images (if used)
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

export default function CarsManagementView() {
  // State to hold the list of cars fetched from the backend
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for car form (add/edit)
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // States for delete confirmation dialog (now disabled, but keeping structure)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [carToDeleteOperationId, setCarToDeleteOperationId] = useState<string | null>(null);

  // State for vintage mode (from ListCars example)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // State for car details dialog (from ListCars example)
  const [selectedCarDetails, setSelectedCarDetails] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // --- Effects ---

  // Effect to observe changes in 'vintage-mode' class on html element
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    // Initial check
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // Effect to fetch cars from the backend when component mounts
  useEffect(() => {
    fetchCars();
  }, []);

  // Effect to clear messages after a few seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return;
  }, [message]);

  // --- Data Fetching and Management ---

  // Function to fetch cars from the backend
  async function fetchCars() {
    setLoading(true);
    setError(null);
    try {
      const result = await DelegationEndpoint.getAllCars();
      // Ensure data integrity before setting state
      const safeCars = (result ?? []).filter(
        (car): car is Car =>
          !!car &&
          typeof car.delegationId === 'string' &&
          typeof car.operation === 'string' &&
          typeof car.make === 'string' &&
          typeof car.model === 'string' &&
          typeof car.year === 'number' &&
          typeof car.price === 'number' &&
          typeof car.rented === 'boolean' &&
          typeof car.color === 'string'
      );
      setCars(safeCars);
    } catch (err: any) {
      console.error('Failed to fetch cars:', err);
      setError(err.message || 'Error al cargar los coches.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  }

  // --- CRUD Operations (using backend endpoints) ---

  const handleAddCar = () => {
    setEditingCar({
      delegationId: '',
      operation: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      rented: false,
      price: 0
    });
    setIsFormDialogOpen(true);
  };

  // Temporarily disable edit functionality as requested
  const handleTemporarilyDisabledEdit = () => {
    setMessage('La funcionalidad de editar se implementará en una futura actualización.');
  };

  const handleSaveCar = async () => {
    if (!editingCar) return;

    // Basic validation
    if (!editingCar.make || !editingCar.model || !editingCar.delegationId || !editingCar.operation || editingCar.price <= 0 || editingCar.year < 1900 || !editingCar.color) {
      setMessage('Por favor, completa todos los campos requeridos y asegúrate de que el precio y año son válidos.');
      return;
    }
    if (editingCar.operation.trim() === '') {
      setMessage('El campo "Operation" no puede estar vacío.');
      return;
    }

    try {
      // Check if it's an existing car (by operation ID)
      const isExistingCar = cars.some(c => c.operation === editingCar.operation);

      if (isExistingCar) {
        // Update car
        await DelegationEndpoint.updateCar(editingCar);
        setMessage(`Coche ${editingCar.make} ${editingCar.model} actualizado con éxito.`);
      } else {
        // Add new car
        await DelegationEndpoint.saveCar(editingCar);
        setMessage(`Coche ${editingCar.make} ${editingCar.model} añadido con éxito.`);
      }
      await fetchCars(); // Re-fetch cars to update the list
      setIsFormDialogOpen(false);
      setEditingCar(null);
    } catch (err: any) {
      console.error('Error al guardar coche:', err);
      setMessage(`Error: ${err.message || 'No se pudo guardar el coche.'}`);
    }
  };

  // Temporarily disable delete functionality as requested
  const handleTemporarilyDisabledDelete = () => {
    setMessage('La funcionalidad de eliminar se implementará en una futura actualización.');
    // No need to open the confirmation dialog
  };

  // --- Car Details from external API (NHTSA) ---
  const fetchCarDetails = async (car: Car) => {
    setFetchingDetails(true);

    if (!car.make || !car.model) {
      setSelectedCarDetails(null);
      setFetchingDetails(false);
      return;
    }

    const modelLower = car.model.toLowerCase();

    if (car.year < 2000) {
      // Mock data for vintage cars
      const mockDetails = {
        engine: '1.5L Naturally Aspirated Inline-4 (Vintage)',
        horsepower: '75 hp (Vintage)',
        torque: '80 lb-ft (Vintage)',
        transmission: '4-speed Manual (Vintage)',
        fuelEconomy: '18 MPG (Vintage)',
        acceleration: '0-60 mph in 15.0s (Vintage)',
        features: ['Radio AM/FM', 'Manual Windows'],
        safetyRating: 'N/A',
        dimensions: 'L: 160in, W: 64in, H: 55in',
        cargoVolume: '8.0 cu ft',
        make: car.make,
        model: car.model,
      };
      setSelectedCarDetails(mockDetails);
      setFetchingDetails(false);
      return;
    }

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(car.make)}?format=json`
      );
      const data = await response.json();

      const modelMatch = data.Results.find(
        (m: any) => m.Model_Name?.toLowerCase() === modelLower
      );

      if (!modelMatch) {
        setSelectedCarDetails({
          engine: 'N/D',
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Modelo no encontrado en NHTSA'],
          make: car.make,
          model: car.model,
        });
      } else {
        setSelectedCarDetails({
          engine: 'N/D',
          horsepower: 'N/D',
          transmission: 'N/D',
          fuelEconomy: 'N/D',
          acceleration: 'N/D',
          safetyRating: 'N/D',
          dimensions: 'N/D',
          cargoVolume: 'N/D',
          features: ['Modelo encontrado en NHTSA'], // In a real app, you'd parse more details
          make: car.make,
          model: car.model,
        });
      }
    } catch (apiError) {
      console.error('Error al obtener datos de NHTSA:', apiError);
      setSelectedCarDetails({
        engine: 'Error al cargar detalles',
        horsepower: 'Error al cargar detalles',
        transmission: 'Error al cargar detalles',
        fuelEconomy: 'Error al cargar detalles',
        acceleration: 'Error al cargar detalles',
        safetyRating: 'Error al cargar detalles',
        dimensions: 'Error al cargar detalles',
        cargoVolume: 'Error al cargar detalles',
        features: ['Error de conexión API'],
        make: car.make,
        model: car.model,
      });
    } finally {
      setFetchingDetails(false);
    }
  };

  // --- Helper Functions ---

  const formatPrice = (car: Car) => {
    if (car.year < 2000) {
      return `${car.price.toFixed(2)} Pts`;
    } else {
      return `${car.price.toFixed(2)} €`;
    }
  };

  // Group cars by delegationId for collapsible sections
  const carsByDelegation: { [key: string]: Car[] } = cars.reduce((acc, car) => {
    // Corrected: Ensure delegationId is a valid string before using it as a key
    if (typeof car.delegationId === 'string' && car.delegationId.trim() !== '') {
      if (!acc[car.delegationId]) {
        acc[car.delegationId] = [];
      }
      acc[car.delegationId].push(car);
    } else {
      // Group cars with missing/invalid delegationId under a common key
      const noDelegationKey = 'Sin Delegación Asignada';
      if (!acc[noDelegationKey]) {
        acc[noDelegationKey] = [];
      }
      acc[noDelegationKey].push(car);
    }
    return acc;
  }, {} as { [key: string]: Car[] });

  // --- Render Logic ---

  if (loading) {
    return <div className="p-4 text-center">Cargando vehículos...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h1 className="text-3xl font-bold mb-6">Gestión de Vehículos (Admin)</h1>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <Button theme="primary" onClick={handleAddCar} className="mb-6">
        Añadir Nuevo Coche
      </Button>

      {/* Collapsible sections for each delegation */}
      <div className="w-full max-w-6xl">
        {Object.keys(carsByDelegation).length === 0 ? (
          <p className="text-gray-600">No hay coches registrados o no se pudieron cargar.</p>
        ) : (
          Object.entries(carsByDelegation).map(([delegationId, delegationCars]) => (
            <Details
              key={delegationId}
              summary={`Delegación: ${delegationId} (${delegationCars.length} coches)`}
              theme="filled"
              className="mb-4"
              opened // You can set this to false by default if you want them collapsed initially
            >
              <div className="p-4 bg-white shadow-md rounded-b-lg">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left">Operación ID</th>
                      <th className="px-4 py-2 text-left">Marca</th>
                      <th className="px-4 py-2 text-left">Modelo</th>
                      <th className="px-4 py-2 text-left">Año</th>
                      <th className="px-4 py-2 text-left">Color</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-right">Precio Diario</th>
                      <th className="px-4 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegationCars
                      .filter((car) => {
                        // Apply vintage mode filter
                        if (isVintageMode) {
                          return car.year < 2000;
                        } else {
                          return car.year >= 2000;
                        }
                      })
                      .map((car) => (
                        <tr key={car.operation} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2">{car.operation}</td>
                          <td className="px-4 py-2">{car.make}</td>
                          <td className="px-4 py-2">{car.model}</td>
                          <td className="px-4 py-2">{car.year}</td>
                          <td className="px-4 py-2">{car.color}</td>
                          <td className="px-4 py-2">{car.rented ? 'Alquilado' : 'Disponible'}</td>
                          <td className="px-4 py-2 text-right">{formatPrice(car)}</td>
                          <td className="px-4 py-2 flex justify-center gap-2">
                            {/* Changed onClick to show message instead of attempting edit */}
                            <Button theme="tertiary small" onClick={handleTemporarilyDisabledEdit}>
                              Editar
                            </Button>
                            <Button theme="error small" onClick={handleTemporarilyDisabledDelete}>
                              Eliminar
                            </Button>
                            <Button
                                theme="primary small"
                                onClick={() => fetchCarDetails(car).then(() => setIsDetailsDialogOpen(true))}
                                disabled={car.rented} // Disable "Detalles" if rented
                            >
                                Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Details>
          ))
        )}
      </div>

      {/* Add/Edit Car Dialog */}
      <Dialog
        headerTitle={editingCar && cars.some(c => c.operation === editingCar.operation) ? 'Editar Coche' : 'Añadir Nuevo Coche'}
        opened={isFormDialogOpen}
        onOpenedChanged={({ detail }) => {
          setIsFormDialogOpen(detail.value);
          if (!detail.value) {
            setEditingCar(null);
            setMessage(null);
          }
        }}
        overlayClass="custom-dialog-overlay"
        theme="dialog-width"
      >
        {editingCar && (
          <div className="flex flex-col gap-4 p-4 min-w-[300px] md:min-w-[400px]">
            <TextField
              label="ID de Operación"
              value={editingCar.operation}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, operation: detail.value } : null)}
              readonly={cars.some(c => c.operation === editingCar.operation)}
              helperText={cars.some(c => c.operation === editingCar.operation) ? "No se puede cambiar el ID de Operación de un coche existente." : "Debe ser único. Ej: car#año#secuencia"}
              required
            />
            <TextField
              label="ID de Delegación"
              value={editingCar.delegationId}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, delegationId: detail.value } : null)}
              required
            />
            <TextField
              label="Marca"
              value={editingCar.make}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, make: detail.value } : null)}
              required
            />
            <TextField
              label="Modelo"
              value={editingCar.model}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, model: detail.value } : null)}
              required
            />
           
            <TextField
              label="Color"
              value={editingCar.color}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, color: detail.value } : null)}
              required
            />
            
            <Checkbox
              label="Alquilado"
              checked={editingCar.rented}
              onCheckedChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, rented: detail.value } : null)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button theme="tertiary" onClick={() => setIsFormDialogOpen(false)}>
                Cancelar
              </Button>
              <Button theme="primary" onClick={handleSaveCar}>
                Guardar Coche
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirmation Dialog for Deletion (kept for future use, but not opened by button) */}
      <Dialog
        headerTitle="Confirmar Eliminación"
        opened={isConfirmDialogOpen}
        onOpenedChanged={({ detail }) => setIsConfirmDialogOpen(detail.value)}
      >
        <div className="p-4">
          <p>¿Estás seguro de que quieres eliminar el coche con ID de Operación: <strong>{carToDeleteOperationId}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button theme="tertiary" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            {/* The actual delete logic is removed from direct button access for now */}
            <Button theme="error" onClick={() => setMessage('La funcionalidad de eliminar aún no está activa.')}>
              Eliminar (Deshabilitado)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Car Details Dialog */}
      <Dialog
        headerTitle={
          selectedCarDetails
            ? `Detalles de ${selectedCarDetails.make} ${selectedCarDetails.model}`
            : 'Detalles del Coche'
        }
        opened={isDetailsDialogOpen}
        onOpenedChanged={({ detail }) => setIsDetailsDialogOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
      >
        {fetchingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando detalles...</div>
        ) : selectedCarDetails ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>
              <strong>Motor:</strong> {selectedCarDetails.engine}
            </p>
            <p>
              <strong>Potencia:</strong> {selectedCarDetails.horsepower}
            </p>
            <p>
              <strong>Par motor:</strong> {selectedCarDetails.torque}
            </p>
            <p>
              <strong>Transmisión:</strong> {selectedCarDetails.transmission}
            </p>
            <p>
              <strong>Consumo:</strong> {selectedCarDetails.fuelEconomy}
            </p>
            <p>
              <strong>Aceleración 0-100 km/h:</strong> {selectedCarDetails.acceleration}
            </p>
            <p>
              <strong>Valoración de seguridad:</strong> {selectedCarDetails.safetyRating}
            </p>
            <p>
              <strong>Dimensiones:</strong> {selectedCarDetails.dimensions}
            </p>
            <p>
              <strong>Volumen de carga:</strong> {selectedCarDetails.cargoVolume}
            </p>
            <p>
              <strong>Características:</strong> {selectedCarDetails.features?.join(', ')}
            </p>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No hay detalles para mostrar.</div>
        )}
      </Dialog>
    </div>
  );
}