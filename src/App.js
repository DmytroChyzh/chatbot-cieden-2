import React from 'react';
import Chat from './components/Chat';
import './styles/chat.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Оцінка проекту</h1>
      </header>
      <main>
        <Chat />
      </main>
    </div>
  );
}

export default App; 