import React, { createContext, useState, useContext } from 'react';

const HeatmapContext = createContext();

export const useHeatmapContext = () => {
  const context = useContext(HeatmapContext);
  if (!context) {
    throw new Error('useHeatmapContext must be used within a HeatmapProvider');
  }
  return context;
};

export const HeatmapProvider = ({ children }) => {
  const [customHeatmaps, setCustomHeatmaps] = useState([]);

  const addCustomHeatmap = (newHeatmap) => {
    setCustomHeatmaps(prevHeatmaps => [...prevHeatmaps, newHeatmap]);
  };

  return (
    <HeatmapContext.Provider value={{ customHeatmaps, addCustomHeatmap }}>
      {children}
    </HeatmapContext.Provider>
  );
};

