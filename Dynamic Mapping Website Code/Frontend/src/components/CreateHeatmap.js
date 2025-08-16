import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProcessFits } from '../mockProcessFits';
import { useHeatmapContext } from '../context/HeatmapContext';

const CreateHeatmap = () => {
  const [elementName, setElementName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addCustomHeatmap } = useHeatmapContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!elementName || !description || !file) return;

    setIsLoading(true);

    try {
      const result = await mockProcessFits(file, elementName, description);
      addCustomHeatmap(result);
      navigate(`/?element=${elementName}`, { state: { customHeatmapData: result } });
    } catch (error) {
      console.error('Error creating heatmap:', error);
      alert('Failed to create heatmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-300">Create Heat Map</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="elementName" className="block text-sm font-medium text-gray-400 mb-2">Element Name</label>
          <input
            type="text"
            id="elementName"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-lg text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-lg text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            rows="4"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-400 mb-2">Upload .fits File</label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".fits"
            className="w-full p-3 bg-gray-700 rounded-lg text-white border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            required
          />
        </div>
        <button
          type="submit"
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition duration-300 ease-in-out ${
            isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Heatmap...' : 'Create Heatmap'}
        </button>
      </form>
    </div>
  );
};

export default CreateHeatmap;

