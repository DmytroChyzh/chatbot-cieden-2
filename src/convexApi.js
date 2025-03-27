import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

export class ConvexApi {
    constructor() {
        this.client = new ConvexClient("https://cieden-chatbot.convex.cloud");
    }

    async saveChat(chatData) {
        try {
            const chatId = await this.client.mutation(api.chats.saveChat, chatData);
            return chatId;
        } catch (error) {
            console.error('Помилка при збереженні чату:', error);
            throw error;
        }
    }

    async getChatByUserId(userId) {
        try {
            const chat = await this.client.query(api.chats.getChatByUserId, { userId });
            return chat;
        } catch (error) {
            console.error('Помилка при отриманні чату:', error);
            throw error;
        }
    }

    // Кешування даних при недоступності сервера
    async saveChatWithRetry(chatData, maxRetries = 3) {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                return await this.saveChat(chatData);
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    // Зберігаємо дані в localStorage як запасний варіант
                    const pendingChats = JSON.parse(localStorage.getItem('pendingChats') || '[]');
                    pendingChats.push({
                        ...chatData,
                        timestamp: Date.now(),
                        retryCount: 0
                    });
                    localStorage.setItem('pendingChats', JSON.stringify(pendingChats));
                    throw error;
                }
                // Чекаємо перед наступною спробою
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
    }

    // Спроба відправити кешовані чати
    async retryPendingChats() {
        const pendingChats = JSON.parse(localStorage.getItem('pendingChats') || '[]');
        const successfulChats = [];

        for (const chat of pendingChats) {
            try {
                await this.saveChat(chat);
                successfulChats.push(chat);
            } catch (error) {
                console.error('Помилка при повторній спробі збереження чату:', error);
            }
        }

        // Видаляємо успішно відправлені чати
        const remainingChats = pendingChats.filter(chat => 
            !successfulChats.some(successfulChat => 
                successfulChat.timestamp === chat.timestamp
            )
        );
        localStorage.setItem('pendingChats', JSON.stringify(remainingChats));
    }
} 