import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { UserEndpoint } from 'Frontend/generated/endpoints';
import { Button } from '@vaadin/react-components/Button';
import User from 'Frontend/generated/dev/renting/users/User';


export const config: ViewConfig = {
  title: 'Crear Usuario', // Mantén el título
};
const sampleUser: User = {
  userId: "USER#001",
  operation: "profile",
  username: "jdoe",
  email: "jdoe@example.com",
  fullName: "John Doe",
  phone: "+34 600 123 456"
};

export default function UsersView() {
  const handleSaveUser = async () => {
    try {
      await UserEndpoint.saveUser(sampleUser);
      alert('User saved successfully!');
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-l text-center box-border">
      <img style={{ width: '200px' }} src="images/empty-plant.png" />
      <h2>User Management</h2>

      <div className="card p-m">
        <pre className="text-left">
          {JSON.stringify(sampleUser, null, 2)}
        </pre>
        <Button onClick={handleSaveUser}>
          Save User
        </Button>
      </div>

      <p>Manage user accounts and profiles</p>
    </div>
  );
}

