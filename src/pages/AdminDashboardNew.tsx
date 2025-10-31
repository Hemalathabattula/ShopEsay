import React, { useState } from 'react';
import FashionEraAdminDashboard from '../components/admin/FashionEraAdminDashboard';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <AdminErrorBoundary>
      <FashionEraAdminDashboard 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
