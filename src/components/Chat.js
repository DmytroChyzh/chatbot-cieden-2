import React, { useState, useEffect, useRef } from 'react';
import ChatBot from '../chatbot';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatMessagesRef = useRef(null);
    const chatBot = useRef(new ChatBot());

    useEffect(() => {
        // Завантажуємо історію чату при монтуванні компонента
        const loadHistory = async () => {
            await chatBot.current.loadChatHistory();
            setMessages(chatBot.current.chatData.messages);
        };
        loadHistory();
    }, []);

    useEffect(() => {
        // Прокручуємо до останнього повідомлення
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);
        try {
            const response = await chatBot.current.handleMessage(inputValue);
            setMessages(chatBot.current.chatData.messages);
            setInputValue('');
        } catch (error) {
            console.error('Помилка при відправці повідомлення:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
                    >
                        {message.text}
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot-message loading">
                        Обробка запиту...
                    </div>
                )}
            </div>
            <div className="chat-input">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введіть ваше повідомлення..."
                    disabled={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                >
                    Надіслати
                </button>
            </div>
        </div>
    );
};

export default Chat; 