import React from 'react';
import { useLoaderData, useSearchParams, useLocation } from 'react-router-dom';
import { mockHeatmaps } from '../MockData';

export async function loader({ request }) {
  const url = new URL(request.url);
  const element = url.searchParams.get('element') || Object.keys(mockHeatmaps)[0];
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulating API delay
  return mockHeatmaps[element] || mockHeatmaps[Object.keys(mockHeatmaps)[0]];
}

const MainContent = () => {
  const defaultHeatmapData = useLoaderData();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const customHeatmapData = location.state?.customHeatmapData;

  const heatmapData = customHeatmapData || defaultHeatmapData;
  const element = heatmapData.element || searchParams.get('element') || Object.keys(mockHeatmaps)[0];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-300">
        Heat Map for {element}
      </h1>
      {heatmapData ? (
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <img
              src={heatmapData.heatmapUrl || heatmapData.url}
              alt={`Heat map for ${element}`}
              className="w-full h-auto rounded-lg shadow-md mb-6"
            />
            <h2 className="text-2xl font-semibold mb-4 text-blue-200">{heatmapData.name || element}</h2>
            <p className="text-gray-300 leading-relaxed mb-6">{heatmapData.description}</p>
          </div>
          <div className="bg-gray-700 p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-200">Key Findings</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Maximum concentration: {heatmapData.maxConcentration?.toFixed(2) || 'N/A'}%</li>
              <li>Minimum concentration: {heatmapData.minConcentration?.toFixed(2) || 'N/A'}%</li>
              <li>Average concentration: {heatmapData.averageConcentration?.toFixed(2) || 'N/A'}%</li>
              <li>Timestamp: {heatmapData.timestamp || 'N/A'}</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="animate-pulse bg-gray-700 h-96 w-full rounded-2xl"></div>
      )}
    </div>
  );
};

export default MainContent;

