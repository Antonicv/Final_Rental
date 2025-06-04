import { DelegationEndpoint } from 'Frontend/generated/endpoints';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { Button } from '@vaadin/react-components/Button';
import Car from 'Frontend/generated/dev/renting/delegations/Car';


export const config: ViewConfig = {
  menu: {
    title: '\u2003Create Car', // two non-breaking spaces for indentation
    order: 2,
    //icon: 'line-awesome/svg/car-side-solid.svg',
  },

};

const sampleCar: Car = {
  delegationId: "DELEG#001",
  operation: "car#2025#002",
  make: "Toyota",
  model: "Camry",
  year: 2025,
  color: "Blue",
  rented: false,
  price: 40000
};

export default function CarsView() {
  const handleSaveCar = async () => {
    try {
        await DelegationEndpoint.saveCar(sampleCar);
      alert('Car saved successfully!');
    } catch (error) {
      console.error('Error saving car:', error);
      alert('Failed to save car');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <img style={{ width: '200px' }} src="images/empty-plant.png" />
      <h2>Car Management</h2>

      <div className="card p-m">
        <pre className="text-left">
          {JSON.stringify(sampleCar, null, 2)}
        </pre>
        <Button
          onClick={handleSaveCar}

        >
          Save Car
        </Button>
      </div>

      <p>It’s a place where you can grow your own UI 🤗</p>
    </div>
  );
}
