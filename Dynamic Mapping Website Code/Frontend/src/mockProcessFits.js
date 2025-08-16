export const mockProcessFits = (file, elementName, description) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockResult = {
          element: elementName,
          description: description,
          heatmapUrl: 'https://example.com/mock-heatmap.png',
          maxConcentration: Math.random() * 100,
          minConcentration: Math.random() * 50,
          averageConcentration: Math.random() * 75,
          timestamp: new Date().toISOString()
        };
  
        resolve(mockResult);
      }, 2000);
    });
  };
  
  