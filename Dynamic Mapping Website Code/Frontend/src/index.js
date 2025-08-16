import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import MainContent from './components/MainContent';
import CreateHeatmap from './components/CreateHeatmap';
import LunarMap from './components/LunarMap'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <MainContent />,
      },
      {
        path: 'create-heatmap',
        element: <CreateHeatmap />,
      },
      {
        path: '/map',
        element: <LunarMap />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

