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

  const handleViewChange = (type) => {
    setViewType(type);
    // Additional logic for handling view change can be added here
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
