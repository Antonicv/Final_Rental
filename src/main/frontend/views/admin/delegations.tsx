import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import { TextField } from '@vaadin/react-components/TextField';
import { Button } from '@vaadin/react-components/Button';

import { Dialog } from '@vaadin/react-components/Dialog';

export const config: ViewConfig = {
  title: 'Crear Delegación', // Mantén el título
};
export default function CreateDelegationView() {
  const [delegationId, setDelegationId] = useState<string>('');
  const [operation, setOperation] = useState<string>('profile'); // Default to 'profile'
  const [name, setName] = useState<string>('');
  const [adress, setAdress] = useState<string>(''); // Corregido: 'adress'
  const [city, setCity] = useState<string>('');
  const [manager, setManager] = useState<string>('');
  const [telf, setTelf] = useState<string>('');
  const [carQuantity, setCarQuantity] = useState<number>(0);
  const [lat, setLat] = useState<number>(0);
  const [longVal, setLongVal] = useState<number>(0); // Corregido: 'longVal'
  const [message, setMessage] = useState<string | null>(null);
  const [dialogOpened, setDialogOpened] = useState(false);

  const handleCreateDelegation = async () => {
    if (!delegationId || !name || !adress || !city || !manager || !telf) {
      setMessage('Por favor, rellena todos los campos obligatorios (ID, Nombre, Dirección, Ciudad, Gestor, Teléfono).');
      setDialogOpened(true);
      return;
    }

    try {
      const newDelegation = {
        delegationId,
        operation,
        name,
        adress, // Corregido: 'adress'
        city,
        manager,
        telf,
        carQuantity,
        lat,
        longVal, // Corregido: 'longVal'
      };
      await DelegationEndpoint.saveDelegation(newDelegation);
      setMessage('Delegación creada exitosamente!');
      // Limpiar formulario
      setDelegationId('');
      setOperation('profile');
      setName('');
      setAdress('');
      setCity('');
      setManager('');
      setTelf('');
      setCarQuantity(0);
      setLat(0);
      setLongVal(0);
    } catch (error: any) {
      setMessage(`Error al crear la delegación: ${error.message || 'Error desconocido'}`);
      console.error('Error creating delegation:', error);
    } finally {
      setDialogOpened(true);
    }
  };

  return (
  <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
    <h2 className="text-2xl font-bold mb-4">Crear Nueva Delegación</h2>

    <div className="flex flex-col gap-m w-full max-w-md">
      <TextField
        label="ID de Delegación"
        value={delegationId}
        onValueChanged={({ detail }) => setDelegationId(detail.value)}
        placeholder="Ej: DELEG#001"
      />
      <TextField
        label="Nombre de la Delegación"
        value={name}
        onValueChanged={({ detail }) => setName(detail.value)}
        placeholder="Ej: Viuda de Agapito e Hijas - Yecla"
      />
      <TextField
        label="Dirección"
        value={adress}
        onValueChanged={({ detail }) => setAdress(detail.value)}
        placeholder="Ej: Calle de San Francisco, 15"
      />
      <TextField
        label="Ciudad"
        value={city}
        onValueChanged={({ detail }) => setCity(detail.value)}
        placeholder="Ej: Yecla"
      />
      <TextField
        label="Gestor"
        value={manager}
        onValueChanged={({ detail }) => setManager(detail.value)}
        placeholder="Ej: Herminia"
      />
      <TextField
        label="Teléfono"
        value={telf}
        onValueChanged={({ detail }) => setTelf(detail.value)}
        placeholder="Ej: 968791234"
      />
      <TextField
        label="Cantidad de Coches"
        value={carQuantity.toString()}
        onValueChanged={({ detail }) => {
          const val = parseInt(detail.value);
          setCarQuantity(isNaN(val) ? 0 : val);
        }}
        placeholder="Ej: 10"
      />
      <TextField
        label="Latitud"
        value={lat.toString()}
        onValueChanged={({ detail }) => {
          const val = parseFloat(detail.value);
          setLat(isNaN(val) ? 0 : val);
        }}
        placeholder="Ej: 38.12345"
      />
      <TextField
        label="Longitud"
        value={longVal.toString()}
        onValueChanged={({ detail }) => {
          const val = parseFloat(detail.value);
          setLongVal(isNaN(val) ? 0 : val);
        }}
        placeholder="Ej: -0.12345"
      />

      <Button theme="primary" onClick={handleCreateDelegation}>
        Crear Delegación
      </Button>
    </div>

    <Dialog
      headerTitle="Estado de la Operación"
      opened={dialogOpened}
      onOpenedChanged={({ detail }) => setDialogOpened(detail.value)}
    >
      <div className="p-m">
        <p>{message}</p>
        <Button onClick={() => setDialogOpened(false)} theme="primary" className="mt-m">
          Cerrar
        </Button>
      </div>
    </Dialog>
  </div>
);
}