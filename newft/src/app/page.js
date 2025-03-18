'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import '@/styles/Login.css';

// URL del servidor basada en el entorno
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://juego-memoria-servidor.onrender.com/' // Reemplaza con la URL real de tu servidor en Render
  : 'http://localhost:5000';

// Socket.io se iniciará al cargar el componente
let socket;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Inicializar socket
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al servidor con ID:', socket.id);
      
      // Enviar un evento de prueba para verificar la conexión
      socket.emit('test', { message: 'Prueba de conexión desde login' });
    });

    socket.on('testResponse', (data) => {
      console.log('Respuesta de prueba recibida:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión con el servidor:', error.message);
      setIsConnected(false);
      setError('Error de conexión con el servidor: ' + error.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado del servidor');
    });

    // Limpiar al desmontar
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa un nombre de usuario y contraseña');
      return;
    }

    console.log(`Intentando iniciar sesión con: ${username}`);
    socket.emit('login', { username, password }, (response) => {
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        // Almacenar información de usuario y socket en sessionStorage
        const user = {
          id: response.userId,
          username: response.username,
          score: response.score,
          isBlocked: response.isBlocked
        };
        
        // Guardar datos completos
        try {
          sessionStorage.setItem('user', JSON.stringify(user));
          console.log('Usuario guardado en sessionStorage:', user);
        } catch (error) {
          console.error('Error al guardar usuario en sessionStorage:', error);
        }
        
        // Redirigir según el rol
        if (response.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/game');
        }
      } else {
        setError(response.message);
      }
    });
  };

  return (
    <main>
      {isConnected ? (
        <div className="connection-status connected">Conectado al servidor</div>
      ) : (
        <div className="connection-status disconnected">Desconectado del servidor</div>
      )}

      <div className="login-container">
        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-button">Entrar</button>
        </form>
        
        <div className="credentials-info">
          <p>Usuarios: jugador1 al jugador10</p>
          <p>Contraseñas: clave1 al clave10</p>
          <p>Admin: admin / admin123</p>
        </div>
      </div>
    </main>
  );
}
