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
import { auth } from "./api/auth";

function Protected({ children }: { children: JSX.Element }) {
  return auth.getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/*"
          element={
            <Protected>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
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