import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useState } from 'react';
import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import { TextField } from '@vaadin/react-components/TextField';
import { Button } from '@vaadin/react-components/Button';

import { Dialog } from '@vaadin/react-components/Dialog';

// Configuració de la vista per al router de Hilla.
// Defineix el títol que apareixerà a la barra de navegació i a la pestanya del navegador.
export const config: ViewConfig = {
  title: 'Crear Delegación', // Manté el títol en castellà, segons el codi original.
};

// Component principal de la vista "Crear Delegació".
export default function CreateDelegationView() {
  // Estats per emmagatzemar els valors dels camps del formulari.
  const [delegationId, setDelegationId] = useState<string>(''); // ID de la delegació.
  const [operation, setOperation] = useState<string>('profile'); // Tipus d'operació, per defecte 'profile'.
  const [name, setName] = useState<string>(''); // Nom de la delegació.
  const [adress, setAdress] = useState<string>(''); // Adreça de la delegació.
  const [city, setCity] = useState<string>(''); // Ciutat de la delegació.
  const [manager, setManager] = useState<string>(''); // Nom del gestor de la delegació.
  const [telf, setTelf] = useState<string>(''); // Telèfon de la delegació.
  const [carQuantity, setCarQuantity] = useState<number>(0); // Quantitat de cotxes a la delegació.
  const [lat, setLat] = useState<number>(0); // Latitud de la delegació.
  const [longVal, setLongVal] = useState<number>(0); // Longitud de la delegació.
  const [message, setMessage] = useState<string | null>(null); // Missatge d'estat per a l'usuari (èxit/error).
  const [dialogOpened, setDialogOpened] = useState(false); // Controla la visibilitat del diàleg de missatges.

  // Funció que es crida quan es fa clic al botó "Crear Delegació".
  const handleCreateDelegation = async () => {
    // Validació inicial: comprova si els camps obligatoris estan buits.
    if (!delegationId || !name || !adress || !city || !manager || !telf) {
      setMessage('Si us plau, omple tots els camps obligatoris (ID, Nom, Adreça, Ciutat, Gestor, Telèfon).');
      setDialogOpened(true); // Obre el diàleg per mostrar el missatge d'error.
      return; // Surt de la funció si la validació falla.
    }

    try {
      // Crea un objecte amb les dades de la nova delegació.
      const newDelegation = {
        delegationId,
        operation,
        name,
        adress, // El nom de la propietat 'adress' es manté tal qual, segons el codi original.
        city,
        manager,
        telf,
        carQuantity,
        lat,
        longVal, // El nom de la propietat 'longVal' es manté tal qual, segons el codi original.
      };
      // Crida al mètode `saveDelegation` de l'endpoint del backend per guardar la nova delegació.
      await DelegationEndpoint.saveDelegation(newDelegation);
      setMessage('Delegació creada exitosament!'); // Missatge d'èxit.
      // Neteja tots els camps del formulari després d'una creació exitosa.
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
      // Captura i mostra qualsevol error que pugui sorgir durant la crida al backend.
      setMessage(`Error en crear la delegació: ${error.message || 'Error desconegut'}`);
      console.error('Error creating delegation:', error); // Registra l'error a la consola per a depuració.
    } finally {
      setDialogOpened(true); // Obre el diàleg per mostrar el missatge (tant d'èxit com d'error).
    }
  };

  return (
    // Contenidor principal de la vista, centrat horitzontalment i amb padding.
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      {/* Títol de la pàgina. */}
      <h2 className="text-2xl font-bold mb-4">Crear Nueva Delegación</h2>

      {/* Contenidor per als camps del formulari, amb espaiat i amplada màxima. */}
      <div className="flex flex-col gap-m w-full max-w-md">
        {/* Camp de text per a l'ID de la delegació. */}
        <TextField
          label="ID de Delegación" // Etiqueta del camp.
          value={delegationId} // Valor actual del camp.
          onValueChanged={({ detail }) => setDelegationId(detail.value)} // Manejador de canvis.
          placeholder="Ej: DELEG#001" // Text de placeholder.
        />
        {/* Camp de text per al nom de la delegació. */}
        <TextField
          label="Nombre de la Delegación"
          value={name}
          onValueChanged={({ detail }) => setName(detail.value)}
          placeholder="Ej: Viuda de Agapito e Hijas - Yecla"
        />
        {/* Camp de text per a l'adreça. */}
        <TextField
          label="Dirección"
          value={adress}
          onValueChanged={({ detail }) => setAdress(detail.value)}
          placeholder="Ej: Calle de San Francisco, 15"
        />
        {/* Camp de text per a la ciutat. */}
        <TextField
          label="Ciudad"
          value={city}
          onValueChanged={({ detail }) => setCity(detail.value)}
          placeholder="Ej: Yecla"
        />
        {/* Camp de text per al gestor. */}
        <TextField
          label="Gestor"
          value={manager}
          onValueChanged={({ detail }) => setManager(detail.value)}
          placeholder="Ej: Herminia"
        />
        {/* Camp de text per al telèfon. */}
        <TextField
          label="Teléfono"
          value={telf}
          onValueChanged={({ detail }) => setTelf(detail.value)}
          placeholder="Ej: 968791234"
        />
        {/* Camp de text per a la quantitat de cotxes. Converteix el valor a número. */}
        <TextField
          label="Cantidad de Coches"
          value={carQuantity.toString()} // Converteix el número a cadena per al TextField.
          onValueChanged={({ detail }) => {
            const val = parseInt(detail.value); // Intenta convertir a enter.
            setCarQuantity(isNaN(val) ? 0 : val); // Estableix 0 si no és un número vàlid.
          }}
          placeholder="Ej: 10"
        />
        {/* Camp de text per a la latitud. Converteix el valor a número decimal. */}
        <TextField
          label="Latitud"
          value={lat.toString()} // Converteix el número a cadena per al TextField.
          onValueChanged={({ detail }) => {
            const val = parseFloat(detail.value); // Intenta convertir a flotant.
            setLat(isNaN(val) ? 0 : val); // Estableix 0 si no és un número vàlid.
          }}
          placeholder="Ej: 38.12345"
        />
        {/* Camp de text per a la longitud. Converteix el valor a número decimal. */}
        <TextField
          label="Longitud"
          value={longVal.toString()} // Converteix el número a cadena per al TextField.
          onValueChanged={({ detail }) => {
            const val = parseFloat(detail.value); // Intenta convertir a flotant.
            setLongVal(isNaN(val) ? 0 : val); // Estableix 0 si no és un número vàlid.
          }}
          placeholder="Ej: -0.12345"
        />

        {/* Botó per enviar el formulari i crear la delegació. */}
        <Button theme="primary" onClick={handleCreateDelegation}>
          Crear Delegación
        </Button>
      </div>

      {/* Diàleg per mostrar missatges d'estat (èxit o error). */}
      <Dialog
        headerTitle="Estado de la Operación" // Títol del diàleg.
        opened={dialogOpened} // Controla si el diàleg està obert.
        onOpenedChanged={({ detail }) => setDialogOpened(detail.value)} // Permet tancar el diàleg.
      >
        <div className="p-m">
          <p>{message}</p> {/* Mostra el missatge generat. */}
          {/* Botó per tancar el diàleg. */}
          <Button onClick={() => setDialogOpened(false)} theme="primary" className="mt-m">
            Cerrar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}