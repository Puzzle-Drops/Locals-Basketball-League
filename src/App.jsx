import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ScrollManager from './components/ScrollManager.jsx';
import Home from './pages/Home.jsx';
import Standings from './pages/Standings.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import Players from './pages/Players.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Schedule from './pages/Schedule.jsx';
import GameDetail from './pages/GameDetail.jsx';
import Rules from './pages/Rules.jsx';
import Playoffs from './pages/Playoffs.jsx';
import Compare from './pages/Compare.jsx';

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:key" element={<TeamDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/:name" element={<PlayerDetail />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/game/:season/:week/:matchup/:game" element={<GameDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/playoffs" element={<Playoffs />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
