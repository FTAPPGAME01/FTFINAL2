'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import '@/styles/AdminPanel.css';

let socket;

export default function Admin() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Recuperar datos de usuario de sessionStorage
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Verificar si es admin
    if (!parsedUser.isAdmin) {
      router.push('/');
      return;
    }

    // Inicializar socket
    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Conectado al servidor');
      socket.emit('getPlayers', (response) => {
        if (response.success) {
          setPlayers(response.players);
        }
      });
    });

    socket.on('playersUpdate', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router]);

  const handleAddPoints = () => {
    if (!selectedPlayer || points <= 0) return;
    
    socket.emit('updatePoints', {
      userId: selectedPlayer.id,
      points: parseInt(points)
    }, (response) => {
      if (response.success) {
        setMessage(`Se agregaron ${points} puntos a ${selectedPlayer.username}`);
      } else {
        setMessage(response.message);
      }
    });
  };

  const handleSubtractPoints = () => {
    if (!selectedPlayer || points <= 0) return;
    
    socket.emit('updatePoints', {
      userId: selectedPlayer.id,
      points: -parseInt(points)
    }, (response) => {
      if (response.success) {
        setMessage(`Se restaron ${points} puntos a ${selectedPlayer.username}`);
      } else {
        setMessage(response.message);
      }
    });
  };

  const handleToggleBlock = () => {
    if (!selectedPlayer) return;
    
    socket.emit('toggleBlockUser', {
      userId: selectedPlayer.id
    }, (response) => {
      if (response.success) {
        const action = selectedPlayer.isBlocked ? 'desbloqueado' : 'bloqueado';
        setMessage(`Se ha ${action} a ${selectedPlayer.username}`);
      } else {
        setMessage(response.message);
      }
    });
  };

  const handleResetGame = () => {
    socket.emit('resetGame', (response) => {
      if (response.success) {
        setMessage('Juego reiniciado correctamente');
      } else {
        setMessage(response.message);
      }
    });
  };

  if (!user) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Panel de Administrador</h2>
      
      {message && <div className="admin-message">{message}</div>}
      
      <div className="admin-section">
        <h3>Jugadores</h3>
        <div className="player-selection">
          <select 
            value={selectedPlayer ? selectedPlayer.id : ''} 
            onChange={(e) => {
              const player = players.find(p => p.id === e.target.value);
              setSelectedPlayer(player || null);
            }}
          >
            <option value="">Seleccionar jugador</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.username} - Puntos: {player.score} {player.isBlocked ? '(Bloqueado)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedPlayer && (
        <div className="admin-section">
          <h3>Gestionar jugador: {selectedPlayer.username}</h3>
          <div className="points-control">
            <input 
              type="number" 
              min="0" 
              value={points} 
              onChange={(e) => setPoints(e.target.value)} 
              placeholder="Cantidad de puntos"
            />
            <div className="admin-buttons">
              <button onClick={handleAddPoints}>Agregar Puntos</button>
              <button onClick={handleSubtractPoints}>Restar Puntos</button>
              <button onClick={handleToggleBlock}>
                {selectedPlayer.isBlocked ? 'Desbloquear' : 'Bloquear'} Jugador
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="admin-section">
        <h3>Control del Juego</h3>
        <button onClick={handleResetGame} className="reset-button">Reiniciar Juego</button>
      </div>
    </div>
  );
}