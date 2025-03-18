'use client';

import React from 'react';
import '@/styles/Tile.css';

const Tile = ({ index, revealed, value, onClick, disabled }) => {
  // Determinar la fila basada en el índice (0-3: fila 1, 4-7: fila 2, etc.)
  const row = Math.floor(index / 4);
  
  // Determinar el color basado en la fila
  const getColor = () => {
    switch(row) {
      case 0: return 'blue';
      case 1: return 'yellow';
      case 2: return 'red';
      case 3: return 'green';
      default: return 'blue';
    }
  };
  
  // Determinar el ícono basado en el color
  const getIcon = () => {
    switch(getColor()) {
      case 'blue': return '💎'; // diamante
      case 'yellow': return '💰'; // bolsa de dinero
      case 'red': return '🔴'; // círculo rojo
      case 'green': return '🏆'; // trofeo
      default: return '?';
    }
  };
  
  const displayValue = () => {
    if (!revealed) {
      return getIcon();
    }
    
    if (value > 0) {
      return `+${value/1000}K`;
    }
    
    return `${value/1000}K`;
  };
  
  const tileClass = () => {
    const colorClass = getColor();
    
    if (revealed) {
      if (value > 0) {
        return `tile ${colorClass} revealed winner`;
      }
      return `tile ${colorClass} revealed loser`;
    }
    
    // Quita la clase disabled, pues el estilo se manejará con el cursor
    return `tile ${colorClass}`;
  };

  // Simplifica el manejo de clics
  const handleClick = () => {
    console.log(`Clic en ficha ${index}, disabled=${disabled}`);
    // Llama a onClick sin verificaciones adicionales
    onClick();
  };

  return (
    <div 
      className={tileClass()} 
      onClick={handleClick}
      // Sólo cambia el cursor, pero siempre permite el clic
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {displayValue()}
    </div>
  );
};

export default Tile;