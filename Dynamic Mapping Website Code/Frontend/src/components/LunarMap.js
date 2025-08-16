import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const LunarMap = ({filterData, elementalRatio, images}) => {
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef(null);  // Ref for the canvas element


  const handleZoomChange = (ref) => {
    setScale(ref.state.scale);
  };

  const loadImage = () => {
    const img = new Image();
    img.src = "/lunarMap.png"; // Path to your map image

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      setImageError(true);
    };
  };

  // Function to remove white color and make it transparent
  const processOverlayImage = (imgSrc) => {
    const img = new Image();
    img.src = imgSrc; // Path to your overlay image

    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Get the image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Loop through all pixels and replace white pixels with transparent pixels
      for (let i = 0; i < data.length; i += 4) {
        // If the pixel is white (RGB: 255, 255, 255), set alpha to 0 (transparent)
        if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
          data[i + 3] = 0;  // Make the pixel transparent
        }
      }

      // Put the modified image data back into the canvas
      ctx.putImageData(imageData, 0, 0);
    };
  };

  useEffect(() => {
    loadImage();
    let path = '/'+filterData?.year+'/'+filterData?.month+'/'+filterData?.elementalRatio.replace(':','_')
    if(filterData?.isOverlapping)
         path+='_overlapped.png'
        else
        path+='_unoverlapped.png'

    console.log(path)
    processOverlayImage(path);
 // Path to your overlay image
  }, [filterData]);

  const addElementalImageLayer = (key) => {

    const getImageByKey = (key) => {
        //         // Find the object with the matching key in the imageArray
        const imageObj = images.find(item => item.hasOwnProperty(key));
        console.log('dev2',imageObj)
        
        // If the key exists, return the image URL; otherwise, return null or a default image
        return imageObj ? imageObj[key] : null;
    };
        
    // Check if the image for the current key exists
    const imageSrc = getImageByKey(elementalRatio?.replace(':','/'));

    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;  // Get the image path from the images object

    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Draw the elemental ratio image on the canvas (top layer)
      ctx.drawImage(img, 0, 0); // Adjust position if necessary
    };
    let path = '/'+elementalRatio?.replace(':','_')+'.png'
    processOverlayImage(path)

  };

  useEffect(()=>{
    addElementalImageLayer(elementalRatio);

  },[elementalRatio, images])

  if (imageError) {
    return <div className="text-white">Error loading the map. Please try again later.</div>;
  }

  if (!imageLoaded) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-4 text-white">Loading Map...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] bg-gray-800 rounded-lg overflow-hidden">
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        onZoomChange={handleZoomChange}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 left-4 z-10 space-x-2">
              <button
                onClick={() => zoomIn()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => zoomOut()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => resetTransform()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <TransformComponent>
              <div className="relative w-full h-auto">
                {/* Map Image */}
                <img
                  src="/lunarMap.png"  // Path to your map image
                  alt="Lunar Map"
                  className="w-full h-auto"
                  loading="lazy"
                  style={{ objectFit: 'contain' }}
                />

                {/* Overlay Image with Rectangles */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Scale information */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded">
        Scale: {scale.toFixed(2)}x
      </div>
    </div>
  );
};

export default LunarMap;

