
import { Route } from "react-router-dom";
import AdminDashBord from "@/pages/Admin/DashBord";
import AdminPrivateRoute from "./AdminPrivateRoute";

const AdminRoutes = () => (
  <Route
    path="/admin/dashboard"
    element={
      <AdminPrivateRoute>
        <AdminDashBord />
      </AdminPrivateRoute>
    }
  />
);

export default AdminRoutes;
