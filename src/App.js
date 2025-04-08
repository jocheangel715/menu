import React, { useState, useEffect } from 'react';
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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false); // New state for background image loading

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'MENU'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setFilteredProducts(productsData);

        const uniqueCategories = [
          ...new Set(productsData.map(product => product.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (backgroundLoaded) setLoading(false); // Only stop loading if background is also loaded
      }
    };

    fetchProducts();
  }, [backgroundLoaded]); // Add backgroundLoaded as a dependency

  const handleBackgroundLoad = () => {
    setBackgroundLoaded(true);
    if (products.length > 0) setLoading(false); // Only stop loading if products are also loaded
  };

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
    <div
      className="app-background"
      style={{ backgroundImage: `url('./RESOURCES/IMAGES/fondo.jpg')` }}
      onLoad={handleBackgroundLoad} // Trigger when background image is loaded
    >
      {/* Top container for the restaurant title */}
      <div className="header">
        <h1 className="title">Restaurante El Sazon</h1>
      </div>

      {/* Middle container for categories */}
      <div className="categories-container">
        <button onClick={() => handleCategoryClick(null)}>Ver todas las categorías</button>
        {categories.map(category => (
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
