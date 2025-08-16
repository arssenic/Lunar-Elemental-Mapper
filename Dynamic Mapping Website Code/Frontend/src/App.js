import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LunarMap from './components/LunarMap';
import { HeatmapProvider } from './context/HeatmapContext';

const App = () => {
  const [filterData, setFilterData] = useState(null);
  const[elementalRatio,setElementalRatio] = useState();
  const [images, setImages] = useState([]); // State to store images

  const handleFilterApply = (newFilterData) => {
    console.log('Filter applied:', newFilterData);
    setFilterData(newFilterData);
  };

  const handleFileUpload = async (files) => {
    // In a real application, you would send these files to your server
    // For this example, we'll just log the file names
    console.log('Files to upload:', files.map(f => f.name));

    // Simulate storing files in the public directory
    // In a real application, this would be handled by your server
    const uploadedFileNames = files.map(file => {
      const fileName = `uploaded_${Date.now()}_${file.name}`;
      console.log(`File "${file.name}" would be saved as "${fileName}" in the public/uploads directory`);
      return fileName;
    });

    // You might want to do something with the uploaded file names, like adding them to your app's state
    console.log('Uploaded file names:', uploadedFileNames);
  };

  return (
    <HeatmapProvider>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onFilterApply={handleFilterApply} onFileUpload={handleFileUpload} setImages={setImages} />
          <main className="flex-1 overflow-auto bg-gray-900 p-8">
            <LunarMap filterData={filterData} elementalRatio={elementalRatio} images={images} />
          </main>
            <div className="mb-4">
            <label htmlFor="elementalRatio" className="block text-sm font-medium text-gray-400 mb-1">XRF Ratio</label>
            <select
              id="elementalRatio"
              value={elementalRatio}
              onChange={(e) => setElementalRatio(e?.target?.value)}
              className="w-full p-2 bg-gray-600 rounded-md text-white"
            >
              <option value="">Select Elemental Ratio</option>
              <option value="Mg:Si">Mg/Si</option>
              <option value="Al:Si">Al/Si</option>
              <option value="Ca:Si">Ca/Si</option>
              <option value="Na:Si">Na/Si</option>
            </select>
          </div>
        </div>
      </div>
    </HeatmapProvider>
  );
};

export default App;

///Users/putla_theophila/stress2/LAL252-EazeIt/frontend/src/components/UploadPage.js