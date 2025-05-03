import React, { useEffect } from 'react';
import './detalles.css';

const Detalles = ({ product, onClose, formatPrice }) => {
  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      onClose(); // Close the overlay when the back button is pressed
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton); // Cleanup the event listener
    };
  }, [onClose]);

  return (
    <div className="product-overlay">
      <button className="close-button" onClick={onClose}>X</button>
      <img 
        src={
          product.url && product.url.trim() !== '' 
            ? product.url 
            : require('../RESOURCES/IMAGES/nofound.png')
        } 
        alt={product.name || 'Not Found'} 
        className="overlay-image" 
      />
      <h2>{product.name}</h2>
      <p>{product.ingredients || 'Ingredientes no disponibles'}</p>
      <p>Precio: {formatPrice(product.price)}</p>
      <button className="add-to-cart-button" style={{ display: 'none' }}>Agregar al carrito</button>
    </div>
  );
};

export default Detalles;
