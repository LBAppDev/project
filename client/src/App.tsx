import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { EntryFormPage } from './pages/EntryFormPage';
import { LoginPage } from './pages/LoginPage';
import { NursesPage } from './pages/NursesPage';
import { ObservationDetailsPage } from './pages/ObservationDetailsPage';
import { PatientDetailsPage } from './pages/PatientDetailsPage';
import { PatientFormPage } from './pages/PatientFormPage';
import { PatientsPage } from './pages/PatientsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="nurses" element={<ProtectedRoute roles={['admin']}><NursesPage /></ProtectedRoute>} />
          <Route path="patients" element={<PatientsPage status="active" />} />
          <Route path="patients/discharged" element={<PatientsPage status="discharged" />} />
          <Route path="patients/new" element={<ProtectedRoute roles={['admin', 'nurse']}><PatientFormPage /></ProtectedRoute>} />
          <Route path="patients/:patientId" element={<PatientDetailsPage />} />
          <Route path="patients/:patientId/edit" element={<ProtectedRoute roles={['admin', 'nurse']}><PatientFormPage /></ProtectedRoute>} />
          <Route path="patients/:patientId/entries/new" element={<ProtectedRoute roles={['admin', 'nurse']}><EntryFormPage /></ProtectedRoute>} />
          <Route path="entries/:entryId" element={<ObservationDetailsPage />} />
          <Route path="entries/:entryId/edit" element={<ProtectedRoute roles={['admin', 'nurse']}><EntryFormPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
