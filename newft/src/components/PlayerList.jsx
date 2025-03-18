'use client';

import React from 'react';
import '@/styles/PlayerList.css';

const PlayerList = ({ players, currentPlayerId }) => {
  // Si players no está definido o no es un array, devolvemos un componente vacío
  if (!players || !Array.isArray(players)) {
    return <div className="player-list">No hay jugadores conectados</div>;
  }

  return (
    <div className="player-list">
      {players.length === 0 ? (
        <div className="no-players">No hay jugadores conectados</div>
      ) : (
        players.map((player) => (
          <div 
            key={player.id} 
            className={`player-item ${player.id === currentPlayerId ? 'active' : ''} ${player.isBlocked ? 'blocked' : ''}`}
          >
            <span>{player.username}</span>
            {player.isBlocked && <span className="blocked-badge">Bloqueado</span>}
          </div>
        ))
      )}
    </div>
  );
};

export default PlayerList;