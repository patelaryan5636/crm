import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ProspectList from '../../pages/sales/salesExecutive/ProspectList';
import CreateProspect from '../../pages/sales/salesExecutive/CreateProspect';
import EditProspect from '../../pages/sales/salesExecutive/EditProspect';

export default function SalesExecutiveRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="prospects" replace />} />
        <Route path="prospects" element={<ProspectList />} />
        <Route path="create-prospect" element={<CreateProspect />} />
        <Route path="edit-prospect/:id" element={<EditProspect />} />
      </Route>
    </Routes>
  );
}
