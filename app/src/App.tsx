import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Agentes, Captar, Checklist, Confirm, Dashboard, Mais, Perfil, Rappel, VisitaConcluida, Visitar } from "./screens";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/captar" element={<Captar />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/agentes" element={<Agentes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/visitar" element={<Visitar />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/visita-concluida" element={<VisitaConcluida />} />
          <Route path="/rappel" element={<Rappel />} />
          <Route path="/mais" element={<Mais />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
