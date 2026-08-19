import { Routes, Route } from "react-router-dom";
import { useContext } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthContext from "./context/AuthContext";

function App() {

    const { user, setUser } =
        useContext(AuthContext);

    return (
        <Routes>

            {/* PUBLIC */}

            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />


            {/* PROTECTED */}

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile
                            user={user}
                            setUser={setUser}
                        />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}

export default App;