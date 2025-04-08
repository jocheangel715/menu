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
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products
  const [selectedCategory, setSelectedCategory] = useState(null); // New state for selected category

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
