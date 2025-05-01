import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import Carga from './RESOURCES/CARGA/Carga';
import './App.css';

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '0';

  const numberValue = parseFloat(value.toString().replace(/[$,]/g, ''));

  if (isNaN(numberValue)) return '0';

  return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products
  const [selectedCategory, setSelectedCategory] = useState(null); // New state for selected category

  const trackRef = useRef(null); // Reference to the categories track
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [startX, setStartX] = useState(0); // Store initial X position
  const [scrollLeft, setScrollLeft] = useState(0); // Store initial scroll position

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

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
    trackRef.current.style.animation = 'none'; // Pause animation while dragging
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scroll speed
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    trackRef.current.style.animation = ''; // Resume animation
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
        <h1 className="title">Restaurante El Sazon</h1>
      </div>

      {/* Middle container for categories */}
      <div className="categories-container">
        <div className="categories-track" ref={trackRef}>
          {/* First set of buttons */}
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

          {/* Second set of buttons for seamless looping */}
          <button className="category-button" onClick={() => handleCategoryClick(null)}>Ver todas las categorías</button>
          {categories.map((category) => (
            <div key={`${category}-duplicate`} className="category-item">
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
      <div className="products-container">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            className="product-item" 
            data-status={product.status} // Add data-status attribute
          >
            <h2>{product.name}</h2>
            <p>Precio: {formatPrice(product.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
