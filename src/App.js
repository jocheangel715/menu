import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import Carga from './RESOURCES/CARGA/Carga';
import './App.css';
import { FaTh, FaThLarge, FaList } from 'react-icons/fa'; // Import icons

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '0';

  const numberValue = parseFloat(value.toString().replace(/[$,]/g, ''));

  if (isNaN(numberValue)) return '0';

  return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const viewOptions = [
  { type: 'cuadriculada', label: 'Cuadriculada', icon: <FaTh /> },
  { type: 'completa', label: 'Completa', icon: <FaThLarge /> },
  { type: 'lista', label: 'Lista', icon: <FaList /> },
];

function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products
  const [selectedCategory, setSelectedCategory] = useState(null); // New state for selected category
  const [viewType, setViewType] = useState('cuadriculada'); // State for view type

  const trackRef = useRef(null); // Reference to the categories track
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [startX, setStartX] = useState(0); // Store initial X position
  const [scrollLeft, setScrollLeft] = useState(0); // Store initial scroll position
  const scrollIntervalRef = useRef(null); // Reference to store the scroll interval

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
    trackRef.current.style.animation = 'none'; // Pause animation while dragging
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scroll speed
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    trackRef.current.style.animation = ''; // Resume animation
  };

  const startScroll = (direction) => {
    const scrollAmount = 20; // Increase scroll speed
    scrollIntervalRef.current = setInterval(() => {
      const track = trackRef.current;
      if (direction === 'left') {
        track.scrollBy({ left: -scrollAmount });
      } else if (direction === 'right') {
        track.scrollBy({ left: scrollAmount });
      }
    }, 5); // Reduce interval time for faster scrolling
  };

  const stopScroll = () => {
    clearInterval(scrollIntervalRef.current); // Clear the interval
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scroll speed
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleViewChange = (type) => {
    setViewType(type);
    // Additional logic for handling view change can be added here
  };

  const scrollTrack = (direction) => {
    const scrollAmount = 200; // Adjust scroll amount as needed
    const track = trackRef.current;

    if (direction === 'left') {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      if (track.scrollLeft <= 0) {
        track.scrollLeft = 0; // Prevent scrolling beyond the left limit
      }
    } else if (direction === 'right') {
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      if (track.scrollLeft >= maxScrollLeft) {
        track.scrollLeft = maxScrollLeft; // Prevent scrolling beyond the right limit
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'MENU'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setFilteredProducts(productsData); // Initialize filtered products with all products

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(productsData.map(product => product.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setFilteredProducts(
      category ? products.filter(product => product.category === category) : products
    );
  };

  if (loading) {
    return <Carga />;
  }

  return (
    <div className="app-background">
      {/* Top container for the restaurant title */}
      <div className="header">
        <div className="header-content">
          <div className="view-selector">
            <button className="view-button">
              {viewOptions.find(option => option.type === viewType)?.icon} Vista
            </button>
            <div className="view-options">
              {viewOptions.map(option => (
                <button key={option.type} onClick={() => handleViewChange(option.type)}>
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>
          <img src={require('./RESOURCES/IMAGES/logo512.png')} alt="Restaurante El Sazon Logo" className="logo" />
        </div>
      </div>

      {/* Middle container for categories */}
      <div className="categories-container">
        <button
          className="arrow-button left"
          onMouseDown={() => startScroll('left')}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
        >
          &#8249; {/* Left arrow symbol */}
        </button>
        <div
          className="categories-track"
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button className="category-button" onClick={() => handleCategoryClick(null)}>Ver todas las categorías</button>
          {categories.map((category) => (
            <div key={category} className="category-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategory === category}
                  readOnly
                />
                <button onClick={() => handleCategoryClick(category)}>{category}</button>
              </label>
            </div>
          ))}
        </div>
        <button
          className="arrow-button right"
          onMouseDown={() => startScroll('right')}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
        >
          &#8250; {/* Right arrow symbol */}
        </button>
      </div>

      {/* Bottom container for products */}
      <div className="products-header">
        <h2>{selectedCategory ? `${selectedCategory}` : 'Todos los Productos'}</h2>
      </div>
      <div 
        className="products-container" 
        data-view={viewType} // Dynamically set the view type
      >
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className="product-item" 
            data-status={product.status} // Add data-status attribute
          >
            {viewType !== 'cuadriculada' && (
              <img 
                src={
                  product.image === 'hamburguer' 
                    ? require('./RESOURCES/IMAGES/hamburguer.jpg') 
                    : require('./RESOURCES/IMAGES/nofounds.jpg')
                } 
                alt={product.image === 'hamburguer' ? 'Hamburguer' : 'Not Found'} 
                className="product-image" 
              />
            )}
            <h2>{product.name}</h2>
            {viewType !== 'cuadriculada' && <p>{product.ingredients || 'Ingredientes no disponibles'}</p>}
            <p>Precio: {formatPrice(product.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
