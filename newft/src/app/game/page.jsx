'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import PlayerList from '@/components/PlayerList';
import Tile from '@/components/Tile';
import '@/styles/GameBoard.css';

// URL del servidor basada en el entorno
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://juego-memoria-servidor.onrender.com' // Reemplaza con la URL real de tu servidor en Render
  : 'http://localhost:5000';

let socket;

export default function Game() {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(4);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Recuperar datos de usuario de sessionStorage
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      console.log('No hay datos de usuario en sessionStorage');
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Usuario recuperado de sessionStorage:', parsedUser);
      setUser(parsedUser);
      setScore(parsedUser.score);

      if (parsedUser.isBlocked) {
        setMessage('Tu cuenta está bloqueada. Contacta al administrador.');
        return;
      }

      // Generar un tablero temporal mientras se conecta
      const generateTemporaryBoard = () => {
        const tempBoard = [];
        for (let i = 0; i < 16; i++) {
          tempBoard.push({ value: i < 8 ? 15000 : -15000, revealed: false });
        }
        return tempBoard;
      };
      
      // Establecer un tablero temporal
      setBoard(generateTemporaryBoard());

      // Inicializar socket con opciones más permisivas
      console.log('Iniciando conexión con Socket.io...');
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      // Añadir manejo específico de errores
      socket.on('error', (error) => {
        console.error('Error de socket:', error);
      });

      socket.io.on('error', (error) => {
        console.error('Error de conexión:', error);
      });

      socket.on('connect', () => {
        console.log('Conectado al servidor Socket.io con ID:', socket.id);
        
        // Enviar un evento de prueba para verificar la conexión
        socket.emit('test', { message: 'Prueba de conexión desde juego' });
        
        // Una vez conectado, unirse al juego
        socket.emit('joinGame');
        console.log('Evento joinGame enviado');
      });

      socket.on('testResponse', (data) => {
        console.log('Respuesta de prueba recibida:', data);
      });

      // Evento específico para debuggear selección de fichas
      socket.on('tileSelectResponse', (data) => {
        console.log('Respuesta a selección de ficha:', data);
      });

      socket.on('connect_error', (err) => {
        console.error('Error de conexión Socket.io:', err);
        setMessage('Error de conexión con el servidor: ' + err.message);
      });

      socket.on('gameState', (gameState) => {
        console.log('Recibido gameState:', gameState);
        
        if (gameState.board && gameState.board.length > 0) {
          console.log('Tablero recibido con', gameState.board.length, 'fichas');
          setBoard(gameState.board);
        } else {
          console.log('El tablero está vacío o es null');
        }
        
        setCurrentPlayer(gameState.currentPlayer);
        setPlayers(gameState.players || []);
        setGameStatus(gameState.status);
        
        // Check if it's the current user's turn
        const isCurrentUserTurn = gameState.currentPlayer && gameState.currentPlayer.id === parsedUser.id;
        setIsYourTurn(isCurrentUserTurn);
        
        // Reset timer when it becomes user's turn
        if (isCurrentUserTurn) {
          console.log('Es mi turno ahora');
          setTimeLeft(4);
        }
      });

      socket.on('tileSelected', ({ tileIndex, tileValue, playerId, newScore }) => {
        console.log(`Recibido evento tileSelected para ficha ${tileIndex} por jugador ${playerId}`);
        console.log(`Valor de la ficha: ${tileValue}, nuevo puntaje: ${newScore}`);
        
        // Actualizar el tablero inmediatamente para todos los jugadores
        setBoard(prevBoard => {
          console.log("Actualizando tablero con ficha revelada");
          const newBoard = [...prevBoard];
          if (newBoard[tileIndex]) {
            newBoard[tileIndex] = { 
              ...newBoard[tileIndex], 
              revealed: true, 
              value: tileValue 
            };
          }
          return newBoard;
        });
        
        // Actualizar puntuación solo para el jugador que seleccionó la ficha
        if (playerId === parsedUser.id) {
          console.log(`Actualizando mi puntaje a ${newScore}`);
          setScore(newScore);
          const message = tileValue > 0 
            ? `¡Ganaste ${tileValue} puntos!` 
            : `Perdiste ${Math.abs(tileValue)} puntos`;
          setMessage(message);
          setTimeout(() => setMessage(''), 2000);
        }
      });

      socket.on('turnTimeout', ({ playerId }) => {
        console.log(`Tiempo agotado para jugador ${playerId}`);
        
        // Si era mi turno, mostrar mensaje
        if (playerId === parsedUser.id) {
          console.log('Mi tiempo se agotó');
          setTimeLeft(0);
          setIsYourTurn(false);
          setMessage('¡Tu tiempo se agotó!');
          setTimeout(() => setMessage(''), 2000);
        }
      });

      socket.on('scoreUpdate', (newScore) => {
        console.log('Actualización de puntaje:', newScore);
        setScore(newScore);
      });

      socket.on('blocked', () => {
        setMessage('Tu cuenta ha sido bloqueada por el administrador.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      });

      socket.on('message', (newMessage) => {
        setMessage(newMessage);
      });

      // Cleanup on unmount
      return () => {
        console.log('Desconectando Socket.io...');
        if (socket) {
          socket.off('connect');
          socket.off('connect_error');
          socket.off('gameState');
          socket.off('tileSelected');
          socket.off('turnTimeout');
          socket.off('scoreUpdate');
          socket.off('blocked');
          socket.off('message');
          socket.off('tileSelectResponse');
          socket.emit('leaveGame');
          socket.disconnect();
          console.log('Socket desconectado');
        }
      };
    } catch (error) {
      console.error('Error al procesar datos de usuario:', error);
      router.push('/');
    }
  }, [router]);

// Efecto para el temporizador
useEffect(() => {
  let timer;
  
  if (isYourTurn && gameStatus === 'playing') {
    console.log('Iniciando temporizador de 4 segundos para mi turno');
    // Iniciar con 4 segundos
    setTimeLeft(4);
    
    // Actualizar cada segundo
    timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        console.log(`Temporizador: ${prevTime} segundos`);
        if (prevTime <= 1) {
          console.log('Mi tiempo se agotó');
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  } else {
    // Si no es mi turno, asegurar que el contador esté limpio
    clearInterval(timer);
  }
  
  return () => {
    if (timer) {
      clearInterval(timer);
    }
  };
}, [isYourTurn, gameStatus]);

// Función simplificada para manejar clics en fichas
const handleTileClick = (index) => {
  console.log(`Intentando seleccionar ficha ${index}`);
  
  // Verificar si ya está revelada
  if (board[index]?.revealed) {
    console.log("Esta ficha ya está revelada");
    return;
  }
  
  // Verificar si es mi turno
  if (!isYourTurn) {
    console.log("No es tu turno para seleccionar una ficha");
    setMessage("¡Espera tu turno!");
    setTimeout(() => setMessage(''), 2000);
    return;
  }
  
  // Verificar si el juego está en progreso
  if (gameStatus !== 'playing') {
    console.log("El juego no está en progreso");
    return;
  }
  
  // Enviar el evento al servidor
  console.log("Enviando selección de ficha al servidor");
  socket.emit('selectTile', { tileIndex: index });
};

if (!user) {
  return <div className="loading">Cargando...</div>;
}

return (
  <div className="game-container">
    <div className="game-info">
      <h2>Jugador: {user?.username}</h2>
      
      <div className="game-score">
        Puntaje: {score ? score : '*****'}
      </div>
      
      {currentPlayer && (
        <div className="current-player">
          Jugador actual: {currentPlayer.username}
          {isYourTurn && <span className="your-turn"> (¡Tu turno!)</span>}
        </div>
      )}
      
      <div className="time-display">
        {isYourTurn ? (
          <>Tiempo restante: <span className="timer-value">{timeLeft}</span> segundos</>
        ) : (
          currentPlayer ? `Turno de ${currentPlayer.username}` : "Esperando jugadores..."
        )}
      </div>
      
      {message && <div className="message">{message}</div>}
    </div>

    <div className="game-board">
      {Array.isArray(board) && board.length > 0 ? (
        board.map((tile, index) => (
          <Tile
            key={index}
            index={index}
            revealed={tile?.revealed || false}
            value={tile?.value || 0}
            onClick={() => handleTileClick(index)}
            // Cambiar esto: sólo deshabilitar si la ficha está revelada
            disabled={tile?.revealed || false}
          />
        ))
      ) : (
        <div className="loading-message">
          Cargando tablero... 
          <button 
            onClick={() => {
              if (socket) {
                socket.emit('joinGame');
              }
            }}
            className="retry-button"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>

    <div className="players-section">
      <h3>Jugadores conectados</h3>
      <PlayerList players={players} currentPlayerId={currentPlayer?.id} />
    </div>
  </div>
);
}
