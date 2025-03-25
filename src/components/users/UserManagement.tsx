interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const UserManagement = () => {
  return (
    <div className="space-y-6">
      {/* Tabs de Gestión */}
      <Tabs>
        <Tab label="Usuarios">
          <UsersList />
        </Tab>
        <Tab label="Roles">
          <RolesManager />
        </Tab>
        <Tab label="Departamentos">
          <DepartmentsManager />
        </Tab>
      </Tabs>
    </div>
  );
}; 