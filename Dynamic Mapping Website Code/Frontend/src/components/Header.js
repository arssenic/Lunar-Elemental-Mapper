import React from 'react';

// const Header = () => {
//   return (
//     <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
//       <div className="w-16 h-16 rounded-full overflow-hidden">
//         <img src="https://interiit-tech.com/wp-content/uploads/2024/10/Main-colour-4.png" alt="Logo 1" className="w-full h-full object-cover" />
//       </div>
//       <h1 className="text-3xl font-bold text-center text-blue-300">Lunar Element Mapper</h1>
//       <div className="w-16 h-16 rounded-full overflow-hidden">
//         <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnfCGJTk4p0qJgIzM-6pKOe_0GX8PPZVYg4A&s" alt="Logo 2" className="w-full h-full object-cover" />
//       </div>
//     </header>
//   );
// };

// export default Header;


// components/Header.js

import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lunar Element Mapper</h1>
        <nav>
          <Link to="/" className="mr-4 hover:text-blue-200">Home</Link>
          <Link to="/map" className="mr-4 hover:text-blue-200">Map</Link>
          <Link to="/upload" className="hover:text-blue-200">Upload</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;

