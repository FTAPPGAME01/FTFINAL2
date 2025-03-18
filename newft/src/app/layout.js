import './globals.css';

export const metadata = {
  title: 'Juego de Memoria Multijugador',
  description: 'Juego multijugador en tiempo real con Next.js y Socket.io',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div className="app-container">
          <h1 className="app-title">Juego de Memoria Multijugador</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
