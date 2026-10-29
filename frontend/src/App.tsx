import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Resources from "./pages/Resources";
import Shelters from "./pages/Shelters";
import Warehouses from "./pages/Warehouses";
import Volunteers from "./pages/Volunteers";
import UsersPage from "./pages/Users";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MapPage from "./pages/MapPage";
import BloodDonors from "./pages/BloodDonors";
import Landing from "./pages/Landing";
import Verify from "./pages/Verify";
import { auth } from "./api/auth";

function Protected({ children }: { children: JSX.Element }) {
  return auth.getToken() ? children : <Navigate to="/login" replace />;
}

function Authenticated({ children }: { children: JSX.Element }) {
  return auth.getToken() ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Authenticated><Landing /></Authenticated>} />
        <Route path="/login" element={<Authenticated><Login /></Authenticated>} />
        <Route path="/register" element={<Authenticated><Register /></Authenticated>} />
        <Route path="/verify" element={<Authenticated><Verify /></Authenticated>} />

        <Route
          path="/*"
          element={
            <Protected>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/donors" element={<BloodDonors />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/warehouses" element={<Warehouses />} />
                  <Route path="/shelters" element={<Shelters />} />
                  <Route path="/volunteers" element={<Volunteers />} />
                  <Route path="/users" element={<UsersPage />} />
                </Routes>
              </Layout>
            </Protected>
          }
        />
      </Routes>
    </Router>
  );
}