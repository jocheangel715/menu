import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import Carga from './RESOURCES/CARGA/Carga';
import Detalles from './DETALLES/detalles'; // Import the Detalles component
import './App.css';
import { FaTh, FaThLarge, FaList, FaShoppingCart } from 'react-icons/fa'; // Import icons

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
  const [viewType, setViewType] = useState('completa'); // State for view type
  const [selectedProduct, setSelectedProduct] = useState(null); // State for the selected product
  const [imagesLoaded, setImagesLoaded] = useState(false); // Track image loading state

  const trackRef = useRef(null); // Reference to the categories track
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [startX, setStartX] = useState(0); // Store initial X position
  const [scrollLeft, setScrollLeft] = useState(0); // Store initial scroll position
  const scrollIntervalRef = useRef(null); // Reference to store the scroll interval

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Adjust scroll sensitivity
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
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
    const walk = (x - startX) * 1.5; // Adjust scroll sensitivity
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

  useEffect(() => {
    if (products.length > 0) {
      const imagePromises = products.map(product => {
        if (product.url && product.url.trim() !== '') {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = product.url;
            img.onload = resolve;
            img.onerror = resolve; // Resolve even if the image fails to load
          });
        }
        return Promise.resolve();
      });

      Promise.all(imagePromises).then(() => setImagesLoaded(true));
    }
  }, [products]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setFilteredProducts(
      category ? products.filter(product => product.category === category) : products
    );
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product); // Set the clicked product as the selected product
  };

  const closeOverlay = () => {
    setSelectedProduct(null); // Close the overlay by clearing the selected product
  };

  if (loading || !imagesLoaded) {
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
        <div
          className="categories-track"
          ref={trackRef}
          onMouseDown={handleMouseDown} // Enable real-time dragging on mouse down
          onMouseMove={handleMouseMove} // Handle real-time dragging movement
          onMouseUp={handleMouseUpOrLeave} // Stop dragging on mouse up
          onMouseLeave={handleMouseUpOrLeave} // Stop dragging when leaving the area
          onTouchStart={handleTouchStart} // Enable real-time dragging on touch start
          onTouchMove={handleTouchMove} // Handle real-time dragging movement on touch
          onTouchEnd={handleTouchEnd} // Stop dragging on touch end
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
            onClick={() => handleProductClick(product)} // Open overlay on product click
          >
            <img 
              src={
                product.url && product.url.trim() !== '' 
                  ? product.url 
                  : require('./RESOURCES/IMAGES/nofound.png')
              } 
              alt={product.name || 'Not Found'} 
              className="product-image" 
            />
            <div className="product-details">
              <h2>{product.name}</h2>
              {viewType === 'lista' && product.ingredients && (
                <div className="ingredients">{product.ingredients}</div>
              )}
              <p>Precio: {formatPrice(product.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Use Detalles component for the overlay */}
      {selectedProduct && (
        <Detalles 
          product={selectedProduct} 
          onClose={closeOverlay} 
          formatPrice={formatPrice} // Pass formatPrice function to Detalles
        />
      )}

      {/* Floating cart button */}
      <button className="cart-button" style={{ display: 'none' }}>
        <FaShoppingCart size={24} />
      </button>
    </div>
  );
}

export default App;
