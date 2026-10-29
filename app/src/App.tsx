import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";

const Dashboard = lazy(() => import("./screens").then((m) => ({ default: m.Dashboard })));
const Captar = lazy(() => import("./screens").then((m) => ({ default: m.Captar })));
const Confirm = lazy(() => import("./screens").then((m) => ({ default: m.Confirm })));
const Agentes = lazy(() => import("./screens").then((m) => ({ default: m.Agentes })));
const Perfil = lazy(() => import("./screens").then((m) => ({ default: m.Perfil })));
const Visitar = lazy(() => import("./screens").then((m) => ({ default: m.Visitar })));
const Checklist = lazy(() => import("./screens").then((m) => ({ default: m.Checklist })));
const VisitaConcluida = lazy(() => import("./screens").then((m) => ({ default: m.VisitaConcluida })));
const Rappel = lazy(() => import("./screens").then((m) => ({ default: m.Rappel })));
const Mais = lazy(() => import("./screens").then((m) => ({ default: m.Mais })));

function ACarregarRota() {
  return <div className="empty-state">A abrir…</div>;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<ACarregarRota />}>
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
      </Suspense>
    </HashRouter>
  );
}
