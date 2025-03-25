// Функції для обробки запитів на створення проектів

// Визначення типу проекту на основі опису
function determineProjectType(description) {
    if (/лендінг|landing page|односторінковий/i.test(description)) {
        return 'landing';
    } else if (/магазин|e-commerce|інтернет-магазин|shop/i.test(description)) {
        return 'ecommerce';
    } else if (/портал|новинний|інформаційний/i.test(description)) {
        return 'portal';
    } else if (/корпоративн|business|company/i.test(description)) {
        return 'corporate';
    } else {
        return 'website'; // загальний тип за замовчуванням
    }
}

// Створення структури сторінок на основі типу проекту
function createPagesFromProjectType(projectType, complexity) {
    let pages = [];
    
    switch (projectType) {
        case 'landing':
            pages = [
                { name: 'Лендінг-сторінка', type: 'landing', complexity: complexity, count: 1 }
            ];
            break;
            
        case 'ecommerce':
            pages = [
                { name: 'Головна сторінка', type: 'main', complexity: complexity, count: 1 },
                { name: 'Каталог товарів', type: 'catalog', complexity: complexity, count: 1 },
                { name: 'Сторінка товару', type: 'product', complexity: complexity, count: 1 },
                { name: 'Корзина і оформлення', type: 'cart', complexity: complexity, count: 1 },
                { name: 'Особистий кабінет', type: 'profile', complexity: complexity, count: 1 }
            ];
            break;
            
        case 'portal':
            pages = [
                { name: 'Головна сторінка', type: 'main', complexity: complexity, count: 1 },
                { name: 'Сторінка статті', type: 'article', complexity: complexity, count: 5 },
                { name: 'Сторінка категорії', type: 'category', complexity: complexity, count: 3 },
                { name: 'Контакти', type: 'contacts', complexity: 'simple', count: 1 }
            ];
            break;
            
        case 'corporate':
            pages = [
                { name: 'Головна сторінка', type: 'main', complexity: complexity, count: 1 },
                { name: 'Про компанію', type: 'about', complexity: complexity, count: 1 },
                { name: 'Послуги', type: 'services', complexity: complexity, count: 1 },
                { name: 'Портфоліо', type: 'portfolio', complexity: complexity, count: 1 },
                { name: 'Контакти', type: 'contacts', complexity: 'simple', count: 1 }
            ];
            break;
            
        default:
            pages = [
                { name: 'Головна сторінка', type: 'main', complexity: complexity, count: 1 },
                { name: 'Типова внутрішня', type: 'content', complexity: complexity, count: 3 },
                { name: 'Контакти', type: 'contacts', complexity: 'simple', count: 1 }
            ];
    }
    
    return pages;
}

// Отримання детального опису проекту від GPT
async function getProjectDescriptionFromGPT(userMessage) {
    const systemPrompt = "Ви - експерт з веб-розробки. Користувач просить створити веб-сайт. " +
                        "Опишіть детальний план розробки з переліком всіх сторінок, їх функціональності та складності. " +
                        "Структуруйте опис так, щоб він включав: 1) Тип проекту (лендінг, e-commerce, портал тощо), " +
                        "2) Основні сторінки (головна, каталог, корзина, тощо), 3) Складність кожної сторінки (проста, середня, складна), " +
                        "4) Додаткові функції (анімації, інтеграції з API, тощо).";
    
    try {
        // Викликаємо функцію callOpenAI з спеціальним системним промптом
        return await callOpenAI(userMessage, true, systemPrompt);
    } catch (error) {
        console.error("Помилка при отриманні опису проекту від GPT:", error);
        return "Не вдалося згенерувати опис проекту. Спробуйте описати ваш проект детальніше.";
    }
}

// Розрахунок вартості проекту на основі сторінок та додаткових фаз
function calculateEstimate(pages, additionalPhases) {
    let totalTime = 0;
    
    // Рахуємо час на основі сторінок
    pages.forEach(page => {
        let pageTime = 0;
        
        // Базовий час залежно від типу та складності
        switch (page.complexity) {
            case 'simple':
                pageTime = (page.type === 'landing') ? 8 : 4;
                break;
            case 'medium':
                pageTime = (page.type === 'landing') ? 16 : 8;
                break;
            case 'complex':
                pageTime = (page.type === 'landing') ? 32 : 16;
                break;
            default:
                pageTime = 8;
        }
        
        // Множимо на кількість сторінок цього типу
        totalTime += pageTime * page.count;
    });
    
    // Додаємо час для додаткових фаз
    let additionalTime = 0;
    additionalPhases.forEach(phase => {
        switch (phase) {
            case 'research':
                additionalTime += totalTime * 0.2; // +20% на дослідження
                break;
            case 'prototyping':
                additionalTime += totalTime * 0.15; // +15% на прототипування
                break;
            case 'testing':
                additionalTime += totalTime * 0.1; // +10% на тестування
                break;
            case 'animations':
                additionalTime += totalTime * 0.15; // +15% на анімації
                break;
            case 'interactions':
                additionalTime += totalTime * 0.15; // +15% на інтерактивність
                break;
        }
    });
    
    totalTime += additionalTime;
    
    // Розраховуємо вартість (середня ставка $40/год)
    const hourlyRate = 40;
    const totalCost = totalTime * hourlyRate;
    
    return { totalTime, totalCost };
}

// Модифікація функції визначення типу запиту
function extendedDetermineQueryType(message, originalFunction) {
    // Спочатку перевіряємо, чи це запит на створення проекту
    const currentLanguage = detectLanguage(message);
    
    // Ключові слова для розпізнавання запитів на створення проектів
    const projectIdeaKeywords_ua = [
        'придумай', 'створи', 'розроби', 'зроби', 'створення', 'розробка', 
        'придумай мені', 'розроби мені', 'створи мені'
    ];
    
    const projectIdeaKeywords_en = [
        'create', 'develop', 'make', 'design', 'creation', 'development',
        'create for me', 'develop for me', 'make for me'
    ];
    
    const projectIdeaKeywords = currentLanguage === 'ua' ? projectIdeaKeywords_ua : projectIdeaKeywords_en;
    
    const isProjectIdeaRequest = projectIdeaKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
    ) && (
        message.toLowerCase().includes('сайт') || 
        message.toLowerCase().includes('веб') || 
        message.toLowerCase().includes('лендінг') || 
        message.toLowerCase().includes('магазин') || 
        message.toLowerCase().includes('портал') || 
        message.toLowerCase().includes('web') || 
        message.toLowerCase().includes('site')
    );
    
    if (isProjectIdeaRequest) {
        return 'project_idea';
    }
    
    // Якщо це не запит на створення проекту, використовуємо оригінальну функцію
    return originalFunction(message);
}

// Модифікація функції аналізу запиту
async function extendedAnalyzeRequest(userMessage, files, originalFunction) {
    // Визначаємо тип запиту використовуючи розширену функцію
    const queryType = extendedDetermineQueryType(userMessage, determineQueryType);
    
    // Якщо це запит на створення проекту
    if (queryType === 'project_idea') {
        try {
            // Отримуємо детальний опис проекту від GPT
            const projectDescription = await getProjectDescriptionFromGPT(userMessage);
            
            // Додаємо опис проекту як повідомлення бота
            addMessage(projectDescription, false);
            
            // Визначаємо тип проекту та його складність
            const projectType = determineProjectType(projectDescription);
            const complexity = determineComplexity(projectDescription);
            
            // Визначаємо додаткові фази
            const additionalPhases = determineAdditionalPhases(projectDescription);
            
            // Створюємо структуру сторінок
            const pages = createPagesFromProjectType(projectType, complexity);
            
            // Розраховуємо вартість
            const { totalTime, totalCost } = calculateEstimate(pages, additionalPhases);
            
            // Генеруємо повідомлення з оцінкою
            const estimateMessage = generateEstimateMessage(pages, additionalPhases, totalTime, totalCost);
            
            // Додаємо повідомлення з оцінкою
            addMessage(estimateMessage, false);
            
            // Оновлюємо графіки
            updateCharts(pages, additionalPhases, totalTime, totalCost);
            
            // Повертаємо результат
            return {
                type: 'complex_response',
                message: estimateMessage,
                data: { pages, additionalPhases, totalTime, totalCost }
            };
        } catch (error) {
            console.error("Помилка при обробці запиту на створення проекту:", error);
            addMessage("Вибачте, виникла помилка при обробці вашого запиту. Спробуйте описати ваш проект детальніше або зв'яжіться з нами напряму.", false);
            return {
                type: 'error',
                message: "Виникла помилка при обробці запиту."
            };
        }
    }
    
    // Якщо це не запит на створення проекту, використовуємо оригінальну функцію
    return await originalFunction(userMessage, files);
}

// Патч для функції callOpenAI, щоб підтримувати додатковий системний промпт
async function patchedCallOpenAI(userMessage, isEstimationRequest, customSystemPrompt) {
    try {
        // Базовий контекст для моделі
        let systemPrompt = customSystemPrompt || "Ви асистент компанії Cieden, яка спеціалізується на розробці UI/UX дизайну. ";
        
        if (!customSystemPrompt) {
            // Підготовка системного промпту залежно від типу запиту
            if (isEstimationRequest) {
                systemPrompt += "Ви допомагаєте клієнтам оцінити вартість проектів UI дизайну. Використовуйте метод PERT для оцінки. " +
                               "Інформація про компанію: Cieden - компанія з досвідом 8+ років, що пропонує послуги UI/UX дизайну для різних галузей.";
            } else {
                systemPrompt += "Надавайте інформацію про компанію Cieden, її послуги, процеси, команду, та іншу релевантну інформацію. " +
                               "Ви маєте бути ввічливим, професійним та інформативним. Відповідайте українською мовою, якщо запитання українською.";
            }
        }
        
        // Додаємо контекст знань про компанію (якщо використовуємо звичайний промпт)
        if (!customSystemPrompt) {
            systemPrompt += `
                Cieden - це компанія, що спеціалізується на UI/UX дизайні, заснована у 2015 році.
                Головний офіс знаходиться у Києві, Україна, з додатковими офісами у США та ЄС.
                У команді працює більше 50 дизайнерів з досвідом у різних галузях.
                Компанія пропонує послуги UI/UX дизайну, дослідження користувачів, прототипування та брендингу.
                Основні технології: Figma, Adobe XD, Sketch, InVision, Axure, Zeplin.
                Основні методології: Design Thinking, Lean UX, Agile.
                Cieden працює з клієнтами з фінансової, медичної, освітньої, e-commerce та інших сфер.
                Типова вартість дизайну лендінгу: 800-2000 USD.
                Типова вартість дизайну корпоративного сайту: 3000-7000 USD.
                Типова вартість дизайну e-commerce: 5000-15000 USD.
                Типова вартість дизайну мобільного додатку: 4000-12000 USD.
            `;
        }
        
        console.log("Надсилаю запит через проксі-сервер");
        
        // Решта коду залишається незмінною...
        // Використовуємо ту ж саму логіку, що і в оригінальній функції callOpenAI
        
        // Цей код має бути адаптований під вашу реалізацію callOpenAI
    } catch (error) {
        console.error("Помилка при виклику OpenAI API:", error);
        return "Вибачте, я не зміг отримати відповідь на ваш запит. Спробуйте ще раз пізніше або зв'яжіться з нами напряму.";
    }
} 