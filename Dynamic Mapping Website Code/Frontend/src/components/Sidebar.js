import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockHeatmaps } from '../MockData';
import { useHeatmapContext } from '../context/HeatmapContext';
import UploadComponent from './UploadPage';
import { image } from 'd3';

const Sidebar = ({ onFilterApply, setImages }) => {
  const { customHeatmaps } = useHeatmapContext();
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState('');
  const [files, setFiles] = useState([]);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addCustomHeatmap } = useHeatmapContext();
//   const [images, setImages] = useState([]); // State to store images


  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleBackgroundChange = (e) => {
    setBackgroundFile(e.target.files[0]);
  };
//   const navigate = useNavigate();

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [elementalRatio, setElementalRatio] = useState('');
  const [isOverlapping, setIsOverlapping] = useState(false);


  useEffect(() => {
    const allElements = [...Object.keys(mockHeatmaps), ...customHeatmaps.map(h => h.element)];
    setElements(allElements);
    setSelectedElement(allElements[0] || '');
  }, [customHeatmaps]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filterData = { year, month, elementalRatio, isOverlapping };
    console.log('Applying filter:', filterData);
    onFilterApply(filterData);
  };

  const handleForm = async (files,backgroundFile) => {
    // e.preventDefault();
    if (files?.length === 0) {
      alert('Please upload at least one FITS file.');
      return;
    }

    setIsLoading(true);

    try {
        console.log('hellopwpeioiwh')
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      if (backgroundFile) {
        formData.append('backgroundFile', backgroundFile);
      }

      // API request to upload files
      const response = await fetch('http://10.10.75.173:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files.');
      }

      const result = await response.json();
      console.log('result:', result);

      if (result?.heatmap_images.length>0 && Object.keys(result?.heatmap_images[0]).length > 0) {
        // Convert heatmap_images object into an array of { key, src }
        const imageArray = Object.entries(result.heatmap_images[0]).map(([key, base64String]) => ({
            [key]: `data:image/png;base64,${base64String}`,  // Create a key-value pair where the key is the original key and the value is the Base64 string
          }));
          
        console.log(imageArray)
        setImages(imageArray); // Store the array in state
      }
      
    //   // Using the function
    //   const decodedImages = decodeImages(jsonData);
      const { filePaths } = result; // Assuming backend returns file paths for each uploaded file

      // Add uploaded files to the heatmap context
      filePaths.forEach((path, index) => {
        addCustomHeatmap({
          element: `Element_${index + 1}`,
          description: `Processed from ${files[index]?.name}`,
          heatmapUrl: path,
          maxConcentration: Math.random() * 100,
          minConcentration: Math.random() * 50,
          averageConcentration: Math.random() * 75,
          timestamp: new Date().toISOString(),
        });
      });

      alert('Files uploaded successfully!');
    //   navigate('/');
    } catch (error) {
      console.error('Error uploading files:', error);
    //   alert('Failed to upload files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-80 bg-gray-800 p-6 flex flex-col shadow-lg overflow-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-blue-300">Moon Heat Map</h2>
      
      {/* Mini-form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-700 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-blue-200">Data Filter</h3>
        <div className="mb-4">
          <label htmlFor="year" className="block text-sm font-medium text-gray-400 mb-1">Year</label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded-md text-white"
          >
            <option value="">Select Year</option>
            {[2020, 2021, 2022, 2023].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="month" className="block text-sm font-medium text-gray-400 mb-1">Month</label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded-md text-white"
          >
            <option value="">Select Month</option>
            {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="elementalRatio" className="block text-sm font-medium text-gray-400 mb-1">XRF Ratio</label>
          <select
            id="elementalRatio"
            value={elementalRatio}
            onChange={(e) => setElementalRatio(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded-md text-white"
          >
            <option value="">Select XRF Ratios</option>
            <option value="Mg:Si">Mg/Si</option>
            <option value="Al:Si">Al/Si</option>
            <option value="Ca:Si">Ca/Si</option>
            <option value="Na:Si">Na/Si</option>
          </select>
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="overlapping"
            checked={isOverlapping}
            onChange={() => setIsOverlapping(!isOverlapping)}
            className="hidden"
          />
          <label
            htmlFor="overlapping"
            className={`flex items-center cursor-pointer w-12 h-6 rounded-full p-1 ${
              isOverlapping ? 'bg-blue-500' : 'bg-gray-400'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                isOverlapping ? 'translate-x-6' : ''
              }`}
            ></div>
          </label>
          <span className="ml-2 text-sm text-gray-400">Overlapping</span>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
        >
          Apply Filter
        </button>
      </form>

      <div className="mb-6">
        <label htmlFor="element-select" className="block text-sm font-medium text-gray-400 mb-2">Select Element</label>
        <select
          id="element-select"
          value={selectedElement}
          onChange={(e) => setSelectedElement(e.target.value)}
          className="w-full p-3 bg-gray-700 rounded-lg text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
        >
          {elements.map((element) => (
            <option key={element} value={element}>
              {element}
            </option>
          ))}
        </select>
      </div>
      <Link
        to={`/?element=${selectedElement}`}
        className="bg-blue-600 text-white py-3 px-6 rounded-lg mb-6 hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 text-center font-semibold shadow-md"
      >
        View Heatmap
      </Link>
      
      <UploadComponent handleSubmit={handleForm} />

      <div className="flex-1 overflow-auto mb-6 space-y-2">
        {elements.map((element) => (
          <Link
            key={element}
            to={`/?element=${element}`}
            className={`block py-3 px-4 rounded-lg transition duration-300 ease-in-out ${
              element === selectedElement
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {element}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;







