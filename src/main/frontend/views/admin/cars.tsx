import React, { useEffect, useState } from 'react';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { Button } from '@vaadin/react-components/Button';
import { Dialog } from '@vaadin/react-components/Dialog';
import { TextField } from '@vaadin/react-components/TextField';
import { Checkbox } from '@vaadin/react-components/Checkbox';
import { Details } from '@vaadin/react-components/Details'; // Importació de Details per a seccions plegables
import { NumberField } from '@vaadin/react-components/NumberField'; // Importació de NumberField per a entrades numèriques

// Importació del DelegationEndpoint per obtenir dades del backend
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
// Importació de la interfície Car des dels tipus generats
import Car from 'Frontend/generated/dev/renting/delegations/Car';

// Configuració per al Router de Hilla
export const config: ViewConfig = {
  menu: { order: 6, icon: 'line-awesome/svg/car-side-solid.svg' },
  title: 'Gestió de Vehicles',
};

// Funció auxiliar per sanititzar noms de fitxers per a imatges locals (si s'utilitzen)
function sanitizeFilenamePart(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
}

export default function CarsManagementView() {
  // Estat per mantenir la llista de cotxes obtinguda del backend
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estats per al formulari de cotxes (afegir/editar)
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Estats per al diàleg de confirmació d'eliminació (actualment desactivat, però mantenint l'estructura)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [carToDeleteOperationId, setCarToDeleteOperationId] = useState<string | null>(null);

  // Estat per al mode vintage (de l'exemple ListCars)
  const [isVintageMode, setIsVintageMode] = useState(document.documentElement.classList.contains('vintage-mode'));

  // Estat per al diàleg de detalls del cotxe (de l'exemple ListCars)
  const [selectedCarDetails, setSelectedCarDetails] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // --- Efectes ---

  // Efecte per observar canvis en la classe 'vintage-mode' a l'element html
  useEffect(() => {
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    // Comprovació inicial
    setIsVintageMode(htmlElement.classList.contains('vintage-mode'));
    return () => observer.disconnect();
  }, []);

  // Efecte per obtenir cotxes del backend quan el component es munta
  useEffect(() => {
    fetchCars();
  }, []);

  // Efecte per esborrar missatges després d'uns segons
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return;
  }, [message]);

  // --- Obtenció i Gestió de Dades ---

  // Funció per obtenir cotxes del backend
  async function fetchCars() {
    setLoading(true);
    setError(null);
    try {
      const result = await DelegationEndpoint.getAllCars();
      // Assegurar la integritat de les dades abans de configurar l'estat
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
      console.error('Error en obtenir cotxes:', err);
      setError(err.message || 'Error en carregar els cotxes.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  }

  // --- Operacions CRUD (utilitzant endpoints del backend) ---

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

  // Temporalment desactivar la funcionalitat d'edició segons sol·licitat
  const handleTemporarilyDisabledEdit = () => {
    setMessage('La funcionalitat d\'editar s\'implementarà en una actualització futura.');
  };

  const handleSaveCar = async () => {
    if (!editingCar) return;

    // Validació bàsica
    if (!editingCar.make || !editingCar.model || !editingCar.delegationId || !editingCar.operation || editingCar.price <= 0 || editingCar.year < 1900 || !editingCar.color) {
      setMessage('Si us plau, completa tots els camps requerits i assegura\'t que el preu i any són vàlids.');
      return;
    }
    if (editingCar.operation.trim() === '') {
      setMessage('El camp "Operation" no pot estar buit.');
      return;
    }

    try {
      // Comprovar si és un cotxe existent (per ID d'operació)
      const isExistingCar = cars.some(c => c.operation === editingCar.operation);

      if (isExistingCar) {
        // Actualitzar cotxe
        await DelegationEndpoint.updateCar(editingCar);
        setMessage(`Cotxe ${editingCar.make} ${editingCar.model} actualitzat amb èxit.`);
      } else {
        // Afegir nou cotxe
        await DelegationEndpoint.saveCar(editingCar);
        setMessage(`Cotxe ${editingCar.make} ${editingCar.model} afegit amb èxit.`);
      }
      await fetchCars(); // Tornar a obtenir cotxes per actualitzar la llista
      setIsFormDialogOpen(false);
      setEditingCar(null);
    } catch (err: any) {
      console.error('Error en desar cotxe:', err);
      setMessage(`Error: ${err.message || 'No s\'ha pogut desar el cotxe.'}`);
    }
  };

  // Temporalment desactivar la funcionalitat d'eliminació segons sol·licitat
  const handleTemporarilyDisabledDelete = () => {
    setMessage('La funcionalitat d\'eliminar s\'implementarà en una actualització futura.');
    // No cal obrir el diàleg de confirmació
  };

  // --- Detalls del cotxe des de l'API externa (NHTSA) ---
  const fetchCarDetails = async (car: Car) => {
    setFetchingDetails(true);

    if (!car.make || !car.model) {
      setSelectedCarDetails(null);
      setFetchingDetails(false);
      return;
    }

    const modelLower = car.model.toLowerCase();

    if (car.year < 2000) {
      // Dades simulades per a cotxes antics
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
          features: ['Model no trobat a NHTSA'],
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
          features: ['Model trobat a NHTSA'], // En una aplicació real, analitzaries més detalls
          make: car.make,
          model: car.model,
        });
      }
    } catch (apiError) {
      console.error('Error en obtenir dades de NHTSA:', apiError);
      setSelectedCarDetails({
        engine: 'Error en carregar detalls',
        horsepower: 'Error en carregar detalls',
        transmission: 'Error en carregar detalls',
        fuelEconomy: 'Error en carregar detalls',
        acceleration: 'Error en carregar detalls',
        safetyRating: 'Error en carregar detalls',
        dimensions: 'Error en carregar detalls',
        cargoVolume: 'Error en carregar detalls',
        features: ['Error de connexió API'],
        make: car.make,
        model: car.model,
      });
    } finally {
      setFetchingDetails(false);
    }
  };

  // --- Funcions Auxiliars ---

  const formatPrice = (car: Car) => {
    if (car.year < 2000) {
      return `${car.price.toFixed(2)} Pts`;
    } else {
      return `${car.price.toFixed(2)} €`;
    }
  };

  // Agrupar cotxes per delegationId per a seccions plegables
  const carsByDelegation: { [key: string]: Car[] } = cars.reduce((acc, car) => {
    // Corregit: Assegurar que delegationId és una cadena vàlida abans d'utilitzar-la com a clau
    if (typeof car.delegationId === 'string' && car.delegationId.trim() !== '') {
      if (!acc[car.delegationId]) {
        acc[car.delegationId] = [];
      }
      acc[car.delegationId].push(car);
    } else {
      // Agrupar cotxes amb delegationId absent/invàlid sota una clau comuna
      const noDelegationKey = 'Sense Delegació Assignada';
      if (!acc[noDelegationKey]) {
        acc[noDelegationKey] = [];
      }
      acc[noDelegationKey].push(car);
    }
    return acc;
  }, {} as { [key: string]: Car[] });

  // --- Lògica de Renderització ---

  if (loading) {
    return <div className="p-4 text-center">Carregant vehicles...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full items-center p-l text-center box-border">
      <h1 className="text-3xl font-bold mb-6">Gestió de Vehicles (Admin)</h1>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <Button theme="primary" onClick={handleAddCar} className="mb-6">
        Afegir Nou Cotxe
      </Button>

      {/* Seccions plegables per a cada delegació */}
      <div className="w-full max-w-6xl">
        {Object.keys(carsByDelegation).length === 0 ? (
          <p className="text-gray-600">No hi ha cotxes registrats o no s'han pogut carregar.</p>
        ) : (
          Object.entries(carsByDelegation).map(([delegationId, delegationCars]) => (
            <Details
              key={delegationId}
              summary={`Delegació: ${delegationId} (${delegationCars.length} cotxes)`}
              theme="filled"
              className="mb-4"
              opened // Pots configurar això a false per defecte si vols que estiguin plegats inicialment
            >
              <div className="p-4 bg-white shadow-md rounded-b-lg">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left">Operació ID</th>
                      <th className="px-4 py-2 text-left">Marca</th>
                      <th className="px-4 py-2 text-left">Model</th>
                      <th className="px-4 py-2 text-left">Any</th>
                      <th className="px-4 py-2 text-left">Color</th>
                      <th className="px-4 py-2 text-left">Estat</th>
                      <th className="px-4 py-2 text-right">Preu Diari</th>
                      <th className="px-4 py-2 text-center">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegationCars
                      .filter((car) => {
                        // Aplicar filtre de mode vintage
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
                          <td className="px-4 py-2">{car.rented ? 'Llogat' : 'Disponible'}</td>
                          <td className="px-4 py-2 text-right">{formatPrice(car)}</td>
                          <td className="px-4 py-2 flex justify-center gap-2">
                            {/* Canviat onClick per mostrar missatge en lloc d'intentar editar */}
                            <Button theme="tertiary small" onClick={handleTemporarilyDisabledEdit}>
                              Editar
                            </Button>
                            <Button theme="error small" onClick={handleTemporarilyDisabledDelete}>
                              Eliminar
                            </Button>
                            <Button
                                theme="primary small"
                                onClick={() => fetchCarDetails(car).then(() => setIsDetailsDialogOpen(true))}
                                disabled={car.rented} // Deshabilitar "Detalls" si està llogat
                            >
                                Detalls
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

      {/* Diàleg Afegir/Editar Cotxe */}
      <Dialog
        headerTitle={editingCar && cars.some(c => c.operation === editingCar.operation) ? 'Editar Cotxe' : 'Afegir Nou Cotxe'}
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
              label="ID d'Operació"
              value={editingCar.operation}
              onValueChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, operation: detail.value } : null)}
              readonly={cars.some(c => c.operation === editingCar.operation)}
              helperText={cars.some(c => c.operation === editingCar.operation) ? "No es pot canviar l'ID d'Operació d'un cotxe existent." : "Ha de ser únic. Ex: car#any#seqüència"}
              required
            />
            <TextField
              label="ID de Delegació"
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
              label="Model"
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
              label="Llogat"
              checked={editingCar.rented}
              onCheckedChanged={({ detail }) => setEditingCar(prev => prev ? { ...prev, rented: detail.value } : null)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button theme="tertiary" onClick={() => setIsFormDialogOpen(false)}>
                Cancel·lar
              </Button>
              <Button theme="primary" onClick={handleSaveCar}>
                Desar Cotxe
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Diàleg de Confirmació per a Eliminació (mantingut per a ús futur, però no s'obre amb el botó) */}
      <Dialog
        headerTitle="Confirmar Eliminació"
        opened={isConfirmDialogOpen}
        onOpenedChanged={({ detail }) => setIsConfirmDialogOpen(detail.value)}
      >
        <div className="p-4">
          <p>Estàs segur que vols eliminar el cotxe amb ID d'Operació: <strong>{carToDeleteOperationId}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button theme="tertiary" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel·lar
            </Button>
            {/* La lògica d'eliminació real s'ha eliminat de l'accés directe al botó per ara */}
            <Button theme="error" onClick={() => setMessage('La funcionalitat d\'eliminar encara no està activa.')}>
              Eliminar (Deshabilitat)
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Diàleg de Detalls del Cotxe */}
      <Dialog
        headerTitle={
          selectedCarDetails
            ? `Detalls de ${selectedCarDetails.make} ${selectedCarDetails.model}`
            : 'Detalls del Cotxe'
        }
        opened={isDetailsDialogOpen}
        onOpenedChanged={({ detail }) => setIsDetailsDialogOpen(detail.value)}
        overlayClass="custom-dialog-overlay"
      >
        {fetchingDetails ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregant detalls...</div>
        ) : selectedCarDetails ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p>
              <strong>Motor:</strong> {selectedCarDetails.engine}
            </p>
            <p>
              <strong>Potència:</strong> {selectedCarDetails.horsepower}
            </p>
            <p>
              <strong>Parell motor:</strong> {selectedCarDetails.torque}
            </p>
            <p>
              <strong>Transmissió:</strong> {selectedCarDetails.transmission}
            </p>
            <p>
              <strong>Consum:</strong> {selectedCarDetails.fuelEconomy}
            </p>
            <p>
              <strong>Acceleració 0-100 km/h:</strong> {selectedCarDetails.acceleration}
            </p>
            <p>
              <strong>Valoració de seguretat:</strong> {selectedCarDetails.safetyRating}
            </p>
            <p>
              <strong>Dimensions:</strong> {selectedCarDetails.dimensions}
            </p>
            <p>
              <strong>Volum de càrrega:</strong> {selectedCarDetails.cargoVolume}
            </p>
            <p>
              <strong>Característiques:</strong> {selectedCarDetails.features?.join(', ')}
            </p>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No hi ha detalls per mostrar.</div>
        )}
      </Dialog>
    </div>
  );
}