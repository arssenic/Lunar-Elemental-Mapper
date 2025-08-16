function generateHeatmapSVG(element, concentration) {
    const width = 800;
    const height = 400;
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="black"/>
        ${Array(100).fill().map(() => {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const radius = concentration * 0.5;
          const opacity = Math.random() * 0.5 + 0.5;
          return `<circle cx="${x}" cy="${y}" r="${radius}" fill="red" opacity="${opacity}"/>`;
        }).join('')}
        <text x="10" y="30" font-family="Arial" font-size="24" fill="white">${element} Heatmap (${concentration}% concentration)</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  
  export const processInputData = async (inputData) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  
    const { element, concentration } = inputData;
    const heatmapUrl = generateHeatmapSVG(element, concentration);
  
    return {
      url: heatmapUrl,
      name: `Custom ${element} Heat Map`,
      description: `Custom heat map showing the distribution of ${element} on the lunar surface with ${concentration}% concentration.`,
      element: element,
      concentration: concentration
    };
  };
  
  