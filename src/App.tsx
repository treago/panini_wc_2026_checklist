import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import SharedCollectionPage from "./pages/SharedCollectionPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/collection/:collectionId"
            element={<CollectionPage />}
          />
          <Route
            path="/share/:collectionId"
            element={<SharedCollectionPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
