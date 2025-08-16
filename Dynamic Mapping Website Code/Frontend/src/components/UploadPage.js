import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeatmapContext } from '../context/HeatmapContext';

const UploadComponent = ({handleSubmit}) => {
  const [files, setFiles] = useState([]);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addCustomHeatmap } = useHeatmapContext();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleBackgroundChange = (e) => {
    setBackgroundFile(e.target.files[0]);
  };


const func = async (e) => {
        e.preventDefault();
        await handleSubmit(files,backgroundFile)
    }
  return (
    <div className="mb-6 bg-gray-700 p-4 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blue-200">Upload FITS Files</h3>
      <form onSubmit={func} className="space-y-4">
        {/* Main FITS File Upload Section */}
        <div>
          <label htmlFor="files" className="block text-sm font-medium text-gray-400 mb-1">
            Upload FITS Files (Required)
          </label>
          <input
            type="file"
            id="files"
            onChange={handleFileChange}
            accept=".fits"
            multiple
            className="w-full p-2 bg-gray-600 rounded-md text-white"
            required
          />
        </div>

        {/* Background File Upload Section */}
        <div>
          <label htmlFor="backgroundFile" className="block text-sm font-medium text-gray-400 mb-1">
            Upload Background FITS File (Optional)
          </label>
          <input
            type="file"
            id="backgroundFile"
            onChange={handleBackgroundChange}
            accept=".fits"
            className="w-full p-2 bg-gray-600 rounded-md text-white"
          />
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md font-semibold text-white transition duration-300 ease-in-out ${
            isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : 'Upload Files'}
        </button>
      </form>

      {/* Display Selected FITS Files */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Files:</h4>
          <ul className="list-disc list-inside text-sm text-gray-300">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Display Selected Background File */}
      {backgroundFile && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Background File:</h4>
          <p className="text-sm text-gray-300">{backgroundFile.name}</p>
        </div>
      )}
    </div>
  );
};

export default UploadComponent;

