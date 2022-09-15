import React from 'react';
import logo from './logo.svg';
import './App.css';
import MainPage from "./Components/MainPage";
import ShortcutSnackbar from "./Components/ShortcutSnackbar";
import UserDashboard from "./Components/UserDashboard";
import { Routes, Route, Outlet, Link } from "react-router-dom";
import NotFound from "./Components/NotFound";


function App() {
  return (

      <div>
        <Routes>
          <Route path="/" element={<Outlet/>}>
              <Route index element={<ShortcutSnackbar />} />
            <Route path="dashboard" element={<UserDashboard />} />
            {/* Using path="*"" means "match anything", so this route
                  acts like a catch-all for URLs that we don't have explicit
                  routes for. */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>

      //<ShortcutSnackbar/>
      //<UserDashboard/>
  );
}

export default App;
