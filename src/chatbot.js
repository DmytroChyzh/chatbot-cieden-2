import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const CHAT_STEPS = {
    INITIAL: 'initial',
    PROJECT_TYPE: 'project_type',
    REQUIREMENTS: 'requirements',
    BUDGET: 'budget',
    CONTACT_INFO: 'contact_info',
    ESTIMATION: 'estimation'
};

const STEP_QUESTIONS = {
    [CHAT_STEPS.INITIAL]: "Привіт! Я допоможу вам оцінити ваш проект. Спочатку скажіть, який тип проекту вас цікавить (вебсайт, мобільний додаток, тощо)?",
    [CHAT_STEPS.PROJECT_TYPE]: "Чудово! Тепер опишіть, будь ласка, основні вимоги до проекту - які функції та можливості вам потрібні?",
    [CHAT_STEPS.REQUIREMENTS]: "Дякую за деталі. Чи маєте ви орієнтовний бюджет для проекту?",
    [CHAT_STEPS.BUDGET]: "Добре. Для продовження нам потрібні ваші контактні дані.",
    [CHAT_STEPS.CONTACT_INFO]: {
        name: "Як вас звати?",
        email: "Вкажіть, будь ласка, ваш email:",
        phone: "І останнє - ваш номер телефону:"
    }
};

export class ChatBot {
    constructor() {
        this.currentStep = CHAT_STEPS.INITIAL;
        this.chatData = {
            userId: this.generateUserId(),
            project_type: null,
            requirements: null,
            budget: null,
            name: null,
            email: null,
            phone: null,
            messages: []
        };
        
        this.saveChat = useMutation(api.chats.saveChat);
        this.getChat = useQuery(api.chats.getChatByUserId);
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    async loadChatHistory() {
        try {
            const chat = await this.getChat({ userId: this.chatData.userId });
            if (chat) {
                this.chatData = { ...chat };
                this.currentStep = chat.currentStep;
            }
        } catch (error) {
            console.error('Помилка при завантаженні історії чату:', error);
        }
    }

    async handleMessage(message) {
        try {
            // Додаємо повідомлення користувача до історії
            this.chatData.messages.push({
                text: message,
                isUser: true,
                timestamp: new Date().toISOString()
            });

            let response;
            switch (this.currentStep) {
                case CHAT_STEPS.INITIAL:
                    this.chatData.project_type = message;
                    this.currentStep = CHAT_STEPS.PROJECT_TYPE;
                    response = STEP_QUESTIONS[CHAT_STEPS.PROJECT_TYPE];
                    break;

                case CHAT_STEPS.PROJECT_TYPE:
                    this.chatData.requirements = message;
                    this.currentStep = CHAT_STEPS.BUDGET;
                    response = STEP_QUESTIONS[CHAT_STEPS.BUDGET];
                    break;

                case CHAT_STEPS.BUDGET:
                    this.chatData.budget = message;
                    this.currentStep = CHAT_STEPS.CONTACT_INFO;
                    response = STEP_QUESTIONS[CHAT_STEPS.CONTACT_INFO].name;
                    break;

                case CHAT_STEPS.CONTACT_INFO:
                    if (!this.chatData.name) {
                        this.chatData.name = message;
                        response = STEP_QUESTIONS[CHAT_STEPS.CONTACT_INFO].email;
                    } else if (!this.chatData.email) {
                        this.chatData.email = message;
                        response = STEP_QUESTIONS[CHAT_STEPS.CONTACT_INFO].phone;
                    } else if (!this.chatData.phone) {
                        this.chatData.phone = message;
                        this.currentStep = CHAT_STEPS.ESTIMATION;
                        response = await this.generateEstimation();
                    }
                    break;

                case CHAT_STEPS.ESTIMATION:
                    response = "Дякуємо за інформацію! Ми зв'яжемося з вами найближчим часом.";
                    break;
            }

            // Додаємо відповідь бота до історії
            this.chatData.messages.push({
                text: response,
                isUser: false,
                timestamp: new Date().toISOString()
            });

            // Зберігаємо оновлений стан чату
            await this.saveChat({
                ...this.chatData,
                currentStep: this.currentStep
            });

            return response;

        } catch (error) {
            console.error('Помилка при обробці повідомлення:', error);
            return 'Вибачте, сталася помилка. Спробуйте ще раз.';
        }
    }

    async generateEstimation() {
        try {
            const estimationData = await loadEstimationData();
            return await generateEstimationResponse(this.chatData.requirements, estimationData);
        } catch (error) {
            console.error('Помилка при генерації оцінки:', error);
            return 'Вибачте, не вдалося згенерувати оцінку. Наш менеджер зв\'яжеться з вами найближчим часом.';
        }
    }
}

export default ChatBot; 