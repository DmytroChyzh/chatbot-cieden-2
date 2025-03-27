import { ChatState } from './src/chatState.js';
import { ConvexApi } from './src/convexApi.js';

// Чат-бот для оцінки проектів за методом PERT
document.addEventListener('DOMContentLoaded', function() {
    // DOM елементи
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const clearButton = document.getElementById('clearChat');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // Додаткові елементи для нових функцій
    const exportPDFButton = document.getElementById('exportPDF');
    const exportExcelButton = document.getElementById('exportExcel');
    const saveEstimateButton = document.getElementById('saveEstimate');
    const showHistoryButton = document.getElementById('showHistory');
    const showRiskAnalysisButton = document.getElementById('showRiskAnalysis');
    const historyContainer = document.getElementById('historyContainer');
    const estimateHistory = document.getElementById('estimateHistory');
    const riskAnalysisContainer = document.getElementById('riskAnalysisContainer');
    const chartContainer = document.querySelector('.chart-container');
    
    // Елементи для модального вікна з графіками
    const chartsModal = document.getElementById('chartsModal');
    const closeModalButton = document.getElementById('closeModal');
    const exportPDFModalButton = document.getElementById('exportPDFModal');
    const exportExcelModalButton = document.getElementById('exportExcelModal');
    const sendToEmailModalButton = document.getElementById('sendToEmailModal');
    
    // Графіки для модального вікна
    let modalTimeDistributionChart = null;
    let modalPhaseDistributionChart = null;
    let modalRiskDistributionChart = null;
    
    // Елементи для форми відправки оцінки на email
    const sendToEmailButton = document.getElementById('sendToEmail');
    const emailFormContainer = document.getElementById('emailFormContainer');
    const emailInput = document.getElementById('emailInput');
    const includeDetailsCheckbox = document.getElementById('includeDetailsCheckbox');
    const includeChartCheckbox = document.getElementById('includeChartCheckbox');
    const cancelEmailButton = document.getElementById('cancelEmailButton');
    const confirmEmailButton = document.getElementById('confirmEmailButton');
    
    // Глобальні змінні
    let attachedFiles = [];
    let estimationsData = null;
    let lastEstimateResult = null; // Збереження останньої оцінки для експорту та аналізу
    let timeDistributionChart = null; // Chart.js графік
    let phaseDistributionChart = null; // Chart.js графік
    let riskDistributionChart = null; // Chart.js графік для аналізу ризиків
    
    // Ініціалізуємо дані для оцінок одразу
    const defaultEstimationData = {
        pageTypes: [
            {
                type: "Лендінг",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 18 },
                    "висока": { min: 12, likely: 18, max: 30 }
                }
            },
            {
                type: "Головна сторінка",
                complexities: {
                    "низька": { min: 6, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 15, max: 22 },
                    "висока": { min: 15, likely: 24, max: 40 }
                }
            },
            {
                type: "Каталог",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 8, likely: 12, max: 20 },
                    "висока": { min: 12, likely: 18, max: 28 }
                }
            },
            {
                type: "Сторінка товару",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 18 },
                    "висока": { min: 12, likely: 18, max: 28 }
                }
            },
            {
                type: "Форма",
                complexities: {
                    "низька": { min: 3, likely: 5, max: 8 },
                    "середня": { min: 6, likely: 9, max: 14 },
                    "висока": { min: 10, likely: 15, max: 24 }
                }
            },
            {
                type: "Кошик",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 15, max: 22 },
                    "висока": { min: 15, likely: 22, max: 35 }
                }
            },
            {
                type: "Оформлення замовлення",
                complexities: {
                    "низька": { min: 6, likely: 10, max: 16 },
                    "середня": { min: 12, likely: 18, max: 28 },
                    "висока": { min: 18, likely: 28, max: 45 }
                }
            },
            {
                type: "Особистий кабінет",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 16, max: 24 },
                    "висока": { min: 16, likely: 24, max: 40 }
                }
            },
            {
                type: "Блог",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 20 },
                    "висока": { min: 12, likely: 20, max: 32 }
                }
            }
        ],
        additionalPhases: {
            designSystem: {
                min: 15,
                likely: 24,
                max: 40,
                description: "Розробка дизайн-системи: кольори, типографіка, компоненти, стилі, тощо"
            },
            discovery: {
                min: 5,
                likely: 10,
                max: 40,
                description: "Discovery фаза: аналіз вимог, дослідження користувачів, конкурентний аналіз"
            },
            communication: {
                percentage: 0.15,
                description: "Комунікація з клієнтом, презентації, уточнення вимог"
            },
            wireframes: {
                percentage: 0.4,
                description: "Створення прототипів та wireframes"
            }
        },
        projectTypes: {
            landing: {
                name: "Лендінг",
                defaultPages: [
                    { type: "Лендінг", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: false
            },
            portal: {
                name: "Інформаційний портал",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "середня", quantity: 1 },
                    { type: "Каталог", complexity: "середня", quantity: 2 },
                    { type: "Блог", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            },
            ecommerce: {
                name: "E-commerce",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "висока", quantity: 1 },
                    { type: "Каталог", complexity: "середня", quantity: 1 },
                    { type: "Сторінка товару", complexity: "середня", quantity: 1 },
                    { type: "Кошик", complexity: "середня", quantity: 1 },
                    { type: "Оформлення замовлення", complexity: "середня", quantity: 1 },
                    { type: "Особистий кабінет", complexity: "низька", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            },
            mobileApp: {
                name: "Мобільний додаток",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "середня", quantity: 1 },
                    { type: "Каталог", complexity: "середня", quantity: 1 },
                    { type: "Сторінка товару", complexity: "середня", quantity: 1 },
                    { type: "Форма", complexity: "низька", quantity: 3 },
                    { type: "Особистий кабінет", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            }
        }
    };

    // Ініціалізуємо дані одразу
    estimationsData = defaultEstimationData;
    
    // Створення елементів для завантаження файлів
    let fileInput, uploadButton;
    
    try {
        fileInput = document.createElement('input');
        if (fileInput) {
            fileInput.type = 'file';
            fileInput.accept = '.xlsx,.xls,.pdf,.doc,.docx,.txt,.json';
            fileInput.style.display = 'none';
            fileInput.multiple = true;
            document.body.appendChild(fileInput);
        }
        
        uploadButton = document.createElement('button');
        if (uploadButton) {
            uploadButton.textContent = 'Завантажити файли';
            uploadButton.classList.add('upload-button');
            const chatInputContainer = document.querySelector('.chat-input');
            if (chatInputContainer) {
                chatInputContainer.appendChild(uploadButton);
            }
        }
    } catch (error) {
        console.log("Помилка створення елементів для завантаження: ", error);
    }
    
    // Константи для розрахунку оцінок
    const HOURLY_RATE = 50; // дол/год
    const COMMUNICATION_PERCENTAGE = 0.15; // 15% від загального часу на комунікацію
    
    // Константа для зберігання поточної мови спілкування
    let currentLanguage = 'ua'; // За замовчуванням українська мова ('ua' або 'en')
    
    // Функція для визначення мови введеного тексту
    function detectLanguage(text) {
        if (!text || text.trim() === '') return 'ua';
        
        // Спрощена функція визначення мови на основі найчастіших літер
        // Кирилиця - українська, латиниця - англійська
        const cyrillicPattern = /[а-яА-ЯіІїЇєЄґҐ]/;
        const latinPattern = /[a-zA-Z]/;
        
        const cyrillicCount = (text.match(new RegExp(cyrillicPattern, 'g')) || []).length;
        const latinCount = (text.match(new RegExp(latinPattern, 'g')) || []).length;
        
        // Якщо кількість кириличних літер більше ніж латинських, то мова українська
        return cyrillicCount > latinCount ? 'ua' : 'en';
    }
    
    // База знань про компанію Cieden
    const companyKnowledge = {
        company: {
            name: "Cieden",
            founded: "2016 рік",
            type: "Digital product design agency",
            offices: ["США", "Канада", "Україна"],
            specialization: "Створення складних B2B та enterprise рішень",
            team: "45+ експертів"
        },
        mission: {
            mission: "Допомагати компаніям створювати продукти, які користувачі люблять використовувати",
            vision: "Стати провідною глобальною дизайн-агенцією з найвищим рівнем задоволеності клієнтів",
            values: [
                "Фокус на результат",
                "Прозорість у комунікації",
                "Постійне вдосконалення",
                "Людиноцентричний підхід",
                "Відповідальність за якість"
            ]
        },
        achievements: {
            years: "7+ років на ринку",
            projects: "200+ успішних B2B проектів",
            satisfaction: "98% задоволених клієнтів",
            rating: "ТОП-3 дизайн-агенція за версією Clutch у категоріях UX/UI та Product Design",
            clutchScore: "4.9/5 рейтинг на Clutch",
            reviews: "44+ п'ятизіркових відгуків",
            upwork: "99% успішність на Upwork",
            retention: "80% клієнтів повертаються",
            clients: "Проекти для Fortune 500 компаній",
            countries: "Клієнти з 12+ країн"
        },
        services: [
            {
                name: "Product design",
                details: ["UX/UI консультації", "2-тижневий Design sprint", "UX аудит"]
            },
            {
                name: "Dedicated design team",
                details: ["Product designers", "Design leads", "Design strategists"]
            },
            {
                name: "Design management and leadership",
                details: []
            },
            {
                name: "Development",
                details: []
            },
            {
                name: "Video production",
                details: []
            }
        ],
        pricing: [
            {
                model: "Project-based",
                rate: "Від $50/година",
                foreignRate: "Дизайнери з США/Канади: від $80/година",
                benefits: [
                    "Повний контроль над проектом від початку до кінця",
                    "Дизайн, заснований на дослідженнях",
                    "Прозора звітність",
                    "Повна власність над результатами"
                ]
            },
            {
                model: "Team extension",
                rate: "Від $7,200/місяць за спеціаліста",
                foreignRate: "Дизайнери з США/Канади: від $11,520/місяць",
                benefits: [
                    "Дизайнери як частина вашої внутрішньої команди",
                    "Гнучке масштабування за потребою",
                    "Регулярні стратегічні зустрічі",
                    "Постійний доступ до нашої експертизи"
                ]
            },
            {
                model: "Build-operate-transfer",
                rate: "Від $25,000 за спеціаліста",
                benefits: [
                    "Підібрана та навчена команда спеціально для вас",
                    "Повний менеджмент з нашого боку",
                    "Регулярна звітність",
                    "Плавна передача команди у ваше розпорядження"
                ]
            }
        ],
        industries: [
            "Healthcare & MedTech — Системи EMR/EHR, телемедицина",
            "FinTech — Платіжні системи, криптовалюта",
            "Enterprise Software — CRM, ERP, BPM рішення",
            "AI/ML — Платформи для машинного навчання",
            "EdTech — Системи управління навчанням"
        ],
        technologies: [
            "AI/ML інтерфейси",
            "Blockchain applications",
            "Enterprise-level systems",
            "SaaS platforms",
            "Mobile applications"
        ],
        methodologies: [
            "Design Thinking",
            "Agile/Scrum",
            "Design Sprint 2.0",
            "Jobs-to-be-Done"
        ],
        process: [
            {
                phase: "Discovery Phase",
                duration: "1-2 тижні",
                activities: [
                    "Безкоштовна консультація",
                    "Аналіз вимог та цілей",
                    "Дослідження користувачів",
                    "Створення roadmap"
                ]
            },
            {
                phase: "Design Sprint",
                duration: "2 тижні",
                activities: [
                    "Визначення проблем",
                    "Генерація ідей",
                    "Прототипування",
                    "Тестування з користувачами"
                ]
            },
            {
                phase: "Design & Development",
                activities: [
                    "Ітеративний дизайн",
                    "Регулярні презентації",
                    "User testing",
                    "Впровадження фідбеку"
                ]
            },
            {
                phase: "Delivery & Support",
                activities: [
                    "Передача файлів",
                    "Документація",
                    "Технічна підтримка",
                    "Подальші покращення"
                ]
            }
        ],
        contacts: {
            email: "hello@cieden.com",
            phone: "1 (888) 816-6350",
            offices: [
                "Торонто, Канада",
                "Вілмінгтон, США",
                "Львів, Україна"
            ]
        },
        clients: [
            "Activision Blizzard (третя найбільша геймінг-компанія, придбана Microsoft за $69B)",
            "Перший sales-tech єдиноріг 2023 року (NDA)",
            "Провідний постачальник програмного забезпечення для уряду Великобританії",
            "Найбільша платформа для пошуку IT талантів у Європі",
            "Fortune 500 компанії в сфері охорони здоров'я та фінансів"
        ],
        tools: {
            design: ["Figma", "Adobe Creative Suite"],
            prototyping: ["Principle", "Framer"],
            development: ["React", "Node.js"],
            projectManagement: ["Jira", "Notion"],
            communication: ["Slack", "Zoom"]
        },
        cases: [
            {
                name: "AI-Powered Sales Platform",
                description: [
                    "Інноваційна платформа для автоматизації продажів",
                    "Стала першим sales-tech єдинорогом 2023 року",
                    "Інтеграція з CRM-системами",
                    "Аналітичні дашборди для прийняття рішень",
                    "Підвищення ефективності продажів на 58%"
                ]
            },
            {
                name: "Healthcare Management System",
                description: [
                    "Комплексна система управління медичними даними",
                    "Використовується у 500+ клініках",
                    "Інтеграція зі стандартами HIPAA та GDPR",
                    "Зменшення адміністративних завдань на 45%",
                    "Мобільний та веб-інтерфейс для лікарів"
                ]
            },
            {
                name: "Enterprise Resource Planning",
                description: [
                    "Редизайн складної ERP системи",
                    "Підвищив ефективність роботи на 40%",
                    "Інтеграція з існуючими рішеннями SAP",
                    "Скорочення часу на адаптацію нових співробітників",
                    "Впроваджено у 3 міжнародних компаніях"
                ]
            },
            {
                name: "FinTech Mobile App",
                description: [
                    "Мобільний додаток для фінансового менеджменту",
                    "Інтегрована AI-аналітика",
                    "Підтримка криптовалютних транзакцій",
                    "Персоналізовані інвестиційні рекомендації",
                    "100,000+ користувачів за перші 6 місяців"
                ]
            },
            {
                name: "EdTech Learning Platform",
                description: [
                    "Адаптивна платформа для онлайн-навчання",
                    "Персоналізовані навчальні програми",
                    "Інтеграція з VR-технологіями",
                    "Підвищення ефективності навчання на 32%",
                    "Впроваджено у 50+ навчальних закладах"
                ]
            }
        ],
        team: [
            "Product Designers",
            "UX Researchers",
            "UI Designers",
            "Design Leaders",
            "Front-end Developers",
            "Project Managers",
            "QA Engineers"
        ],
        teamExperience: "Всі спеціалісти мають 5+ років досвіду в B2B та enterprise проектах",
        awards: [
            "Clutch Global 1000 (2022, 2023)",
            "DesignRush Top UX/UI Design Company (2021, 2022, 2023)",
            "MUSE Design Awards — Gold Winner (2022)",
            "GoodFirms Top UX Design Companies (2023)",
            "Red Dot Design Award (2021)",
            "Web Excellence Awards (2022)"
        ],
        blog: [
            "UX/UI Design Trends 2023",
            "Enterprise UX: Balancing Complexity and Usability",
            "AI in Product Design: The New Frontier",
            "Designing for Healthcare: HIPAA Compliance and UX",
            "How Design Systems Scale Enterprise Products",
            "Mobile-First vs. Responsive Design in 2023"
        ],
        social: {
            linkedin: "/company/cieden",
            twitter: "@CiedenDesign",
            instagram: "@cieden_design",
            dribbble: "/cieden",
            behance: "/cieden",
            medium: "@cieden"
        },
        international: [
            "Участь у міжнародних конференціях (Web Summit, SXSW, UX London)",
            "Доповідачі на галузевих заходах",
            "Організація дизайн-воркшопів",
            "Менторство в стартап-акселераторах",
            "Партнерство з університетами для стажування студентів"
        ],
        csr: [
            "Програма стажування для молодих дизайнерів",
            "Освітні ініціативи для шкіл та університетів",
            "Підтримка технологічних спільнот",
            "Екологічні ініціативи",
            "Про-боно проекти для неприбуткових організацій"
        ]
    };

    // Категорії запитань для шаблонних відповідей українською
    const queryCategories = {
        greetings: [
            /^прив(іт|ет)/i, /^доброго дня/i, /^добрий день/i, /^здрастуйте/i, /^вітаю/i, /^hi/i, /^hello/i
        ],
        companyInfo: [
            /компан[іиі]/, /про cieden/i, /про компан/i, /розкаж[іи]ть про (себе|вас)/i,
            /чим займа[єе]т(еся|ься)/i, /хто ви/i, /хто так(ий|і) cieden/i
        ],
        mission: [
            /місі[яю]/i, /цінності/i, /бачення/i, /vision/i, /mission/i, /values/i
        ],
        services: [
            /послуги/i, /що ви роб(і|ите|ить)/i, /як(і|ие) сервіси/i, /як(і|ие) послуги/i, /що пропону[єе]те/i,
            /services/i, /пор(т|тфоліо)/i, /projects/i
        ],
        pricing: [
            /варт(і|о)сть/i, /ц(і|е)н[аи]/i, /прайс/i, /скільки кошту[єе]/i, /скільки варту[єе]/i,
            /pricing/i, /rates/i, /costs/i, /оплат/i
        ],
        contacts: [
            /контакти/i, /зв'?яз(ок|атись)/i, /як з вами/i, /де (ви|вас) знайти/i, /адрес/i, /телефон/i,
            /пошт/i, /email/i, /contacts/i, /contact us/i, /where are you/i, /office/i
        ],
        team: [
            /команд/i, /спеціаліст/i, /працівник/i, /хто працю[єе]/i, /скільки людей/i, /team/i, /staff/i,
            /people/i, /how many/i
        ],
        cases: [
            /кейс/i, /приклад/i, /проект/i, /case stud/i, /пор(т|тфоліо)/i, /examples/i, /projects/i
        ],
        process: [
            /процес/i, /як ви прац/i, /етапи робот/i, /як відбува/i, /workflow/i, /process/i, /how do you work/i
        ],
        technologies: [
            /технолог/i, /інструмент/i, /засоб/i, /tool/i, /tech/i, /stack/i
        ],
        feedback: [
            /відгук/i, /що кажуть/i, /клієнт/i, /feedback/i, /reviews/i, /testimonials/i, /clients say/i
        ],
        awards: [
            /нагород/i, /відзнак/i, /award/i, /призи/i, /recognition/i, /досягнення/i, /премі[їя]/i
        ],
        blog: [
            /блог/i, /стат[тя|ті]/i, /публікаці[їя]/i, /blog/i, /articles/i, /posts/i, /ресурси/i, /resources/i
        ],
        social: [
            /соціальн[аі]/i, /мереж[аі]/i, /social/i, /linkedin/i, /twitter/i, /facebook/i, /instagram/i
        ],
        international: [
            /міжнародн/i, /глобальн/i, /конференц/i, /international/i, /global/i, /conference/i
        ],
        csr: [
            /соціальн[аі] відповідальн/i, /csr/i, /charity/i, /благодійн/i, /pro bono/i, /стажування/i, /internship/i
        ]
    };
    
    // Категорії запитань для шаблонних відповідей англійською
    const queryCategories_en = {
        greetings: [
            /^hi/i, /^hello/i, /^hey/i, /^good (morning|afternoon|evening|day)/i, /^greetings/i
        ],
        companyInfo: [
            /company/i, /about cieden/i, /who (are|is) (you|cieden)/i, /tell me about/i,
            /what (do|does) (you|cieden) do/i, /what is cieden/i
        ],
        mission: [
            /mission/i, /values/i, /vision/i, /what (do|does) (you|cieden) (believe|stand for)/i
        ],
        services: [
            /services/i, /what (do|can) you (do|offer)/i, /portfolio/i, /projects/i, /offerings/i
        ],
        pricing: [
            /pricing/i, /cost/i, /how much/i, /rates/i, /price/i, /fee/i, /payment/i
        ],
        contacts: [
            /contact/i, /reach/i, /get in touch/i, /where are you/i, /address/i, /phone/i,
            /email/i, /office/i, /location/i
        ],
        team: [
            /team/i, /specialists/i, /employees/i, /who works/i, /how many people/i, /staff/i
        ],
        cases: [
            /case stud/i, /example/i, /project/i, /portfolio/i, /previous work/i, /showcase/i
        ],
        process: [
            /process/i, /how (do|does) (you|it) work/i, /stages/i, /steps/i, /workflow/i
        ],
        technologies: [
            /technolog/i, /tools/i, /tech stack/i, /platform/i, /framework/i
        ],
        feedback: [
            /feedback/i, /reviews/i, /testimonials/i, /clients say/i, /rating/i, /satisfaction/i
        ],
        awards: [
            /award/i, /recognition/i, /achievement/i, /prize/i, /won/i, /accolade/i
        ],
        blog: [
            /blog/i, /article/i, /post/i, /publication/i, /resource/i, /content/i, /read/i
        ],
        social: [
            /social/i, /media/i, /linkedin/i, /twitter/i, /facebook/i, /instagram/i, /follow/i
        ],
        international: [
            /international/i, /global/i, /conference/i, /event/i, /worldwide/i, /abroad/i
        ],
        csr: [
            /social responsibility/i, /csr/i, /charity/i, /giving back/i, /pro bono/i, /internship/i, /initiative/i
        ]
    };

    // Шаблонні відповіді на запитання українською
    const responseTemplates = {
        greetings: [
            `Вітаю! Я чат-бот Cieden. Чим я можу вам допомогти? Я можу розповісти про нашу компанію, послуги, ціни, або допомогти з оцінкою проекту.`,
            `Добрий день! Радий вас бачити. Я асистент компанії Cieden, готовий відповісти на ваші запитання та допомогти з оцінкою дизайн-проектів.`,
            `Привіт! Я чат-бот Cieden. Запитайте мене про наші послуги, ціни, кейси або команду. Також я можу розрахувати вартість вашого дизайн-проекту.`
        ],
        companyInfo: [
            `Cieden - це digital product design agency, заснована у 2016 році. Ми спеціалізуємося на створенні складних B2B та enterprise рішень. Наша команда налічує понад 45 експертів, які працюють з офісів у США, Канаді та Україні. За 7+ років ми успішно завершили більше 200 B2B проектів з 98% задоволених клієнтів.`,
            `Cieden - це агенція цифрового дизайну продуктів з офісами в США, Канаді та Україні. Ми маємо ТОП-3 рейтинг на Clutch у категоріях UX/UI та Product Design з оцінкою 4.9/5 на основі 44+ п'ятизіркових відгуків. Наша команда працює з клієнтами з 12+ країн, включаючи Fortune 500 компанії.`
        ],
        mission: () => {
            return `**Місія та цінності Cieden:**\n\n**Місія:** ${companyKnowledge.mission.mission}\n\n**Бачення:** ${companyKnowledge.mission.vision}\n\n**Наші ключові цінності:**\n${companyKnowledge.mission.values.map(value => `- ${value}`).join('\n')}`;
        },
        services: () => {
            let services = "Cieden пропонує наступні послуги:\n\n";
            companyKnowledge.services.forEach(service => {
                services += `- **${service.name}**`;
                if (service.details && service.details.length > 0) {
                    services += ": " + service.details.join(", ");
                }
                services += "\n";
            });
            services += "\nМи спеціалізуємось на таких галузях: " + companyKnowledge.industries.join(", ");
            return services;
        },
        pricing: () => {
            let pricing = "Ми пропонуємо три моделі співпраці:\n\n";
            companyKnowledge.pricing.forEach(model => {
                pricing += `**${model.model}**\n- ${model.rate}\n`;
                if (model.foreignRate) {
                    pricing += `- ${model.foreignRate}\n`;
                }
                pricing += "- Переваги: " + model.benefits.join(", ") + "\n\n";
            });
            return pricing;
        },
        contacts: () => {
            return `Ви можете зв'язатися з нами:\n\n- Email: ${companyKnowledge.contacts.email}\n- Телефон: ${companyKnowledge.contacts.phone}\n\nНаші офіси розташовані в:\n${companyKnowledge.contacts.offices.map(office => `- ${office}`).join("\n")}`;
        },
        team: () => {
            return `Команда Cieden складається з 45+ експертів:\n\n${companyKnowledge.team.map(role => `- ${role}`).join("\n")}\n\n${companyKnowledge.teamExperience}`;
        },
        cases: () => {
            let cases = "Ось деякі з наших найцікавіших кейсів:\n\n";
            companyKnowledge.cases.forEach(caseStudy => {
                cases += `**${caseStudy.name}**\n${caseStudy.description.map(desc => `- ${desc}`).join("\n")}\n\n`;
            });
            return cases;
        },
        process: () => {
            let process = "Наш робочий процес складається з наступних етапів:\n\n";
            companyKnowledge.process.forEach(phase => {
                process += `**${phase.phase}**`;
                if (phase.duration) {
                    process += ` (${phase.duration})`;
                }
                process += ":\n";
                process += phase.activities.map(activity => `- ${activity}`).join("\n");
                process += "\n\n";
            });
            return process;
        },
        technologies: () => {
            const tools = companyKnowledge.tools;
            return `Ми використовуємо сучасні технології та інструменти:\n\n- Дизайн: ${tools.design.join(", ")}\n- Прототипування: ${tools.prototyping.join(", ")}\n- Розробка: ${tools.development.join(", ")}\n- Управління проектами: ${tools.projectManagement.join(", ")}\n- Комунікація: ${tools.communication.join(", ")}`;
        },
        feedback: () => {
            return `Cieden має чудові відгуки від клієнтів:\n\n- 98% задоволених клієнтів\n- 4.9/5 рейтинг на Clutch\n- 44+ п'ятизіркових відгуків\n- 99% успішність на Upwork\n- 80% клієнтів повертаються для нових проектів\n\nНаші клієнти включають:\n${companyKnowledge.clients.map(client => `- ${client}`).join("\n")}`;
        },
        awards: () => {
            return `Нагороди та визнання Cieden:\n\n${companyKnowledge.awards.map(award => `- ${award}`).join('\n')}`;
        },
        blog: () => {
            return `Останні публікації з блогу Cieden:\n\n${companyKnowledge.blog.map(article => `- ${article}`).join('\n')}\n\nЦі та інші статті доступні на нашому сайті.`;
        },
        social: () => {
            const social = companyKnowledge.social;
            return `Слідкуйте за нами в соціальних мережах:\n\n- LinkedIn: ${social.linkedin}\n- Twitter: ${social.twitter}\n- Instagram: ${social.instagram}\n- Dribbble: ${social.dribbble}\n- Behance: ${social.behance}\n- Medium: ${social.medium}`;
        },
        international: () => {
            return `Міжнародна діяльність Cieden:\n\n${companyKnowledge.international.map(activity => `- ${activity}`).join('\n')}`;
        },
        csr: () => {
            return `Корпоративна соціальна відповідальність Cieden:\n\n${companyKnowledge.csr.map(initiative => `- ${initiative}`).join('\n')}`;
        },
        unknown: [
            `Вибачте, я не зрозумів ваше запитання. Можете уточнити або спитати про наші послуги, ціни, команду або проекти?`,
            `На жаль, я не можу відповісти на це питання. Спробуйте запитати про послуги Cieden, нашу команду, кейси або процес роботи.`,
            `Здається, я не маю інформації для відповіді на це запитання. Я можу розповісти про Cieden, наші послуги, ціни, команду або допомогти з оцінкою проекту.`
        ]
    };
    
    // Шаблонні відповіді на запитання англійською
    const responseTemplates_en = {
        greetings: [
            `Hello! I'm Cieden's chatbot. How can I help you today? I can tell you about our company, services, pricing, or help you with project estimation.`,
            `Hi there! I'm the assistant of Cieden company, ready to answer your questions and help with design project estimations.`,
            `Welcome! I'm Cieden's AI assistant. Ask me about our services, pricing, case studies, or team. I can also calculate the cost of your design project.`
        ],
        companyInfo: [
            `Cieden is a digital product design agency founded in 2016. We specialize in creating complex B2B and enterprise solutions. Our team consists of over 45 experts working from offices in the USA, Canada, and Ukraine. Over 7+ years, we've successfully completed more than 200 B2B projects with 98% customer satisfaction.`,
            `Cieden is a digital product design agency with offices in the USA, Canada, and Ukraine. We are ranked TOP-3 on Clutch in the UX/UI and Product Design categories with a 4.9/5 rating based on 44+ five-star reviews. Our team works with clients from 12+ countries, including Fortune 500 companies.`
        ],
        mission: () => {
            return `**Cieden's Mission and Values:**\n\n**Mission:** ${companyKnowledge.mission.mission}\n\n**Vision:** ${companyKnowledge.mission.vision}\n\n**Our Core Values:**\n${companyKnowledge.mission.values.map(value => `- ${value}`).join('\n')}`;
        },
        services: () => {
            let services = "Cieden offers the following services:\n\n";
            companyKnowledge.services.forEach(service => {
                services += `- **${service.name}**`;
                if (service.details && service.details.length > 0) {
                    services += ": " + service.details.join(", ");
                }
                services += "\n";
            });
            services += "\nWe specialize in the following industries: " + companyKnowledge.industries.join(", ");
            return services;
        },
        pricing: () => {
            let pricing = "We offer three collaboration models:\n\n";
            companyKnowledge.pricing.forEach(model => {
                pricing += `**${model.model}**\n- ${model.rate}\n`;
                if (model.foreignRate) {
                    pricing += `- ${model.foreignRate}\n`;
                }
                pricing += "- Benefits: " + model.benefits.join(", ") + "\n\n";
            });
            return pricing;
        },
        contacts: () => {
            return `You can contact us:\n\n- Email: ${companyKnowledge.contacts.email}\n- Phone: ${companyKnowledge.contacts.phone}\n\nOur offices are located in:\n${companyKnowledge.contacts.offices.map(office => `- ${office}`).join("\n")}`;
        },
        team: () => {
            return `Cieden's team consists of 45+ experts:\n\n${companyKnowledge.team.map(role => `- ${role}`).join("\n")}\n\n${companyKnowledge.teamExperience}`;
        },
        cases: () => {
            let cases = "Here are some of our most interesting case studies:\n\n";
            companyKnowledge.cases.forEach(caseStudy => {
                cases += `**${caseStudy.name}**\n${caseStudy.description.map(desc => `- ${desc}`).join("\n")}\n\n`;
            });
            return cases;
        },
        process: () => {
            let process = "Our work process consists of the following stages:\n\n";
            companyKnowledge.process.forEach(phase => {
                process += `**${phase.phase}**`;
                if (phase.duration) {
                    process += ` (${phase.duration})`;
                }
                process += ":\n";
                process += phase.activities.map(activity => `- ${activity}`).join("\n");
                process += "\n\n";
            });
            return process;
        },
        technologies: () => {
            const tools = companyKnowledge.tools;
            return `We use modern technologies and tools:\n\n- Design: ${tools.design.join(", ")}\n- Prototyping: ${tools.prototyping.join(", ")}\n- Development: ${tools.development.join(", ")}\n- Project Management: ${tools.projectManagement.join(", ")}\n- Communication: ${tools.communication.join(", ")}`;
        },
        feedback: () => {
            return `Cieden has excellent client reviews:\n\n- 98% satisfied clients\n- 4.9/5 rating on Clutch\n- 44+ five-star reviews\n- 99% success rate on Upwork\n- 80% clients return for new projects\n\nOur clients include:\n${companyKnowledge.clients.map(client => `- ${client}`).join("\n")}`;
        },
        awards: () => {
            return `Cieden's awards and recognition:\n\n${companyKnowledge.awards.map(award => `- ${award}`).join('\n')}`;
        },
        blog: () => {
            return `Recent articles from Cieden's blog:\n\n${companyKnowledge.blog.map(article => `- ${article}`).join('\n')}\n\nThese and other articles are available on our website.`;
        },
        social: () => {
            const social = companyKnowledge.social;
            return `Follow us on social media:\n\n- LinkedIn: ${social.linkedin}\n- Twitter: ${social.twitter}\n- Instagram: ${social.instagram}\n- Dribbble: ${social.dribbble}\n- Behance: ${social.behance}\n- Medium: ${social.medium}`;
        },
        international: () => {
            return `Cieden's international activities:\n\n${companyKnowledge.international.map(activity => `- ${activity}`).join('\n')}`;
        },
        csr: () => {
            return `Cieden's corporate social responsibility initiatives:\n\n${companyKnowledge.csr.map(initiative => `- ${initiative}`).join('\n')}`;
        },
        unknown: [
            `I'm sorry, I didn't understand your question. Could you clarify or ask about our services, pricing, team, or projects?`,
            `Unfortunately, I can't answer this question. Try asking about Cieden's services, our team, case studies, or work process.`,
            `It seems I don't have information to answer this question. I can tell you about Cieden, our services, pricing, team, or help with project estimation.`
        ]
    };

    // Резервні дані на випадок, якщо неможливо завантажити JSON
    const fallbackEstimationData = {
        pageTypes: [
            {
                type: "Лендінг",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 18 },
                    "висока": { min: 12, likely: 18, max: 30 }
                }
            },
            {
                type: "Головна сторінка",
                complexities: {
                    "низька": { min: 6, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 15, max: 22 },
                    "висока": { min: 15, likely: 24, max: 40 }
                }
            },
            {
                type: "Каталог",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 8, likely: 12, max: 20 },
                    "висока": { min: 12, likely: 18, max: 28 }
                }
            },
            {
                type: "Сторінка товару",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 18 },
                    "висока": { min: 12, likely: 18, max: 28 }
                }
            },
            {
                type: "Форма",
                complexities: {
                    "низька": { min: 3, likely: 5, max: 8 },
                    "середня": { min: 6, likely: 9, max: 14 },
                    "висока": { min: 10, likely: 15, max: 24 }
                }
            },
            {
                type: "Кошик",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 15, max: 22 },
                    "висока": { min: 15, likely: 22, max: 35 }
                }
            },
            {
                type: "Оформлення замовлення",
                complexities: {
                    "низька": { min: 6, likely: 10, max: 16 },
                    "середня": { min: 12, likely: 18, max: 28 },
                    "висока": { min: 18, likely: 28, max: 45 }
                }
            },
            {
                type: "Особистий кабінет",
                complexities: {
                    "низька": { min: 5, likely: 8, max: 12 },
                    "середня": { min: 10, likely: 16, max: 24 },
                    "висока": { min: 16, likely: 24, max: 40 }
                }
            },
            {
                type: "Блог",
                complexities: {
                    "низька": { min: 4, likely: 6, max: 10 },
                    "середня": { min: 8, likely: 12, max: 20 },
                    "висока": { min: 12, likely: 20, max: 32 }
                }
            }
        ],
        additionalPhases: {
            designSystem: {
                min: 15,
                likely: 24,
                max: 40,
                description: "Розробка дизайн-системи: кольори, типографіка, компоненти, стилі, тощо"
            },
            discovery: {
                min: 5,
                likely: 10,
                max: 40,
                description: "Discovery фаза: аналіз вимог, дослідження користувачів, конкурентний аналіз"
            },
            communication: {
                percentage: 0.15,
                description: "Комунікація з клієнтом, презентації, уточнення вимог"
            },
            wireframes: {
                percentage: 0.4,
                description: "Створення прототипів та wireframes"
            }
        },
        projectTypes: {
            landing: {
                name: "Лендінг",
                defaultPages: [
                    { type: "Лендінг", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: false,
                needsDiscovery: false
            },
            ecommerce: {
                name: "E-commerce",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "висока", quantity: 1 },
                    { type: "Каталог", complexity: "середня", quantity: 1 },
                    { type: "Сторінка товару", complexity: "середня", quantity: 1 },
                    { type: "Кошик", complexity: "середня", quantity: 1 },
                    { type: "Оформлення замовлення", complexity: "висока", quantity: 1 },
                    { type: "Особистий кабінет", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            },
            mobileApp: {
                name: "Мобільний додаток",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "висока", quantity: 1 },
                    { type: "Форма", complexity: "середня", quantity: 2 },
                    { type: "Особистий кабінет", complexity: "середня", quantity: 1 },
                    { type: "Каталог", complexity: "середня", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            },
            portal: {
                name: "Інформаційний портал",
                defaultPages: [
                    { type: "Головна сторінка", complexity: "висока", quantity: 1 },
                    { type: "Блог", complexity: "середня", quantity: 1 },
                    { type: "Форма", complexity: "середня", quantity: 1 },
                    { type: "Особистий кабінет", complexity: "низька", quantity: 1 }
                ],
                needsDesignSystem: true,
                needsDiscovery: true
            }
        },
        hourlyRate: 50
    };
    
    // Функція для завантаження даних для оцінки
    async function loadEstimationData() {
        try {
            // Спробуємо завантажити об'єднані дані
            const response = await fetch('/data/all_estimations.json');
            if (!response.ok) {
                throw new Error('Не вдалося завантажити дані естімейтів');
            }
            const allEstimations = await response.json();
            console.log("Завантажено дані з all_estimations.json");
            
            // Використовуємо базові налаштування з estimations.json
            const baseResponse = await fetch('/data/estimations.json');
            if (!baseResponse.ok) {
                throw new Error('Не вдалося завантажити базові налаштування');
            }
            const baseEstimations = await baseResponse.json();
            
            // Об'єднуємо дані
            const combinedData = {
                ...baseEstimations,
                allEstimations: allEstimations.estimations,
                statistics: allEstimations.statistics
            };
            
            console.log("Дані успішно об'єднано");
            return combinedData;
        } catch (error) {
            console.error("Помилка завантаження даних:", error);
            console.log("Використовуємо локальні дані для оцінок");
            return defaultEstimationData;
        }
    }
    
    // Завантажуємо дані при старті
    loadEstimationData();
    
    // Функції відображення повідомлень у чаті
    function addMessage(text, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
        
        // Підтримка форматування тексту (Markdown, таблиці, стилі)
        if (text.includes('###') || text.includes('|') || text.includes('<table')) {
            // Текст містить Markdown або HTML-розмітку
            let formattedText;
            
            // Перевіряємо, чи текст вже є HTML
            if (text.includes('<table') || text.includes('<h3') || text.includes('<button')) {
                formattedText = text;
            } else {
                // Перетворюємо Markdown на HTML
                formattedText = formatTextWithTables(text);
            }
            
            messageElement.innerHTML = formattedText;
        } else {
            // Звичайний текст з базовим форматуванням
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
            messageElement.innerHTML = formattedText;
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Форматування тексту з таблицями в HTML
    function formatTextWithTables(text) {
        const lines = text.split('\n');
        let inTable = false;
        let formattedText = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Обробка Markdown-заголовків
            if (line.startsWith('###')) {
                if (inTable) {
                    formattedText += '</table>';
                    inTable = false;
                }
                const headingLevel = line.match(/^#{1,6}/)[0].length;
                const headingText = line.replace(/^#{1,6}\s+/, '');
                formattedText += `<h${headingLevel}>${headingText}</h${headingLevel}>`;
                continue;
            }
            
            // Обробка таблиць
            if (line.includes('|') && line.includes('-|')) {
                // Це роздільник таблиці, пропускаємо
                continue;
            } else if (line.includes('|')) {
                // Це рядок таблиці
                if (!inTable) {
                    formattedText += '<table class="estimation-table">';
                    inTable = true;
                }
                
                const cells = line.split('|').filter(cell => cell.trim() !== '');
                formattedText += '<tr>';
                
                for (let j = 0; j < cells.length; j++) {
                    const isHeader = i === 0 || cells[j].includes('**');
                    const cellContent = cells[j].replace(/\*\*/g, '').trim();
                    
                    if (isHeader) {
                        formattedText += `<th>${cellContent}</th>`;
                    } else {
                        formattedText += `<td>${cellContent}</td>`;
                    }
                }
                
                formattedText += '</tr>';
            } else {
                // Звичайний текст
                if (inTable) {
                    formattedText += '</table>';
                    inTable = false;
                }
                
                if (line.trim() === '') {
                    formattedText += '<br>';
                } else if (line.startsWith('**') && line.endsWith('**')) {
                    // Жирний текст
                    const boldText = line.replace(/\*\*/g, '').trim();
                    formattedText += `<strong>${boldText}</strong>`;
                } else {
                    const formattedLine = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>');
                    formattedText += formattedLine + '<br>';
                }
            }
        }
        
        if (inTable) {
            formattedText += '</table>';
        }
        
        return formattedText;
    }
    
    // Розрахунок часу за PERT методом
    function calculatePertEstimate(min, likely, max) {
        return (min + 4 * likely + max) / 6;
    }
    
    // Функція для аналізу Excel файлів
    async function analyzeExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Отримуємо першу сторінку Excel файлу
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Конвертуємо у JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Аналізуємо дані для виявлення структури проекту
                    const pagesInfo = extractPagesFromExcel(jsonData);
                    resolve(pagesInfo);
                } catch (error) {
                    console.error('Помилка аналізу Excel файлу:', error);
                    reject(error);
                }
            };
            
            reader.onerror = function(error) {
                console.error('Помилка читання файлу:', error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Функція для вилучення інформації про сторінки з Excel
    function extractPagesFromExcel(jsonData) {
        const pages = [];
        let totalPages = 0;
        
        // Пошук рядків, які можуть містити інформацію про сторінки або екрани
        for (const row of jsonData) {
            // Перебираємо всі ключі в об'єкті рядка
            for (const key in row) {
                const value = String(row[key]).toLowerCase();
                
                // Шукаємо згадки про сторінки, екрани або інші компоненти UI
                if (value.includes('page') || value.includes('screen') || 
                    value.includes('сторінка') || value.includes('екран') || 
                    value.includes('form') || value.includes('форма')) {
                    
                    // Визначаємо складність на основі інших стовпців або значень
                    let complexity = 'середня'; // За замовчуванням
                    let quantity = 1;
                    
                    // Шукаємо інформацію про кількість
                    for (const k in row) {
                        const v = String(row[k]).toLowerCase();
                        if (v.includes('complex') || v.includes('складність')) {
                            if (v.includes('high') || v.includes('високий') || v.includes('висока')) {
                                complexity = 'висока';
                            } else if (v.includes('low') || v.includes('низький') || v.includes('низька')) {
                                complexity = 'низька';
                            }
                        }
                        
                        // Перевіряємо, чи є це число (кількість)
                        if (!isNaN(Number(row[k])) && Number(row[k]) > 0 && Number(row[k]) < 100) {
                            quantity = Number(row[k]);
                        }
                    }
                    
                    pages.push({
                        name: row[key],
                        complexity: complexity,
                        quantity: quantity
                    });
                    
                    totalPages += quantity;
                    break; // Переходимо до наступного рядка
                }
            }
        }
        
        // Якщо нічого не знайдено, повертаємо пусті результати
        return {
            pageCount: totalPages > 0 ? totalPages : 0,
            pages: pages
        };
    }
    
    // Функція для аналізу PDF файлів
    async function analyzePDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    
                    // Завантажуємо PDF.js, якщо ще не завантажено
                    if (!window.pdfjsLib) {
                        reject(new Error('PDF.js не завантажено'));
                        return;
                    }
                    
                    const loadingTask = pdfjsLib.getDocument(typedArray);
                    const pdf = await loadingTask.promise;
                    
                    // Аналізуємо перші 5 сторінок PDF для пошуку інформації
                    const numPages = Math.min(pdf.numPages, 5);
                    let text = '';
                    
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const textItems = content.items.map(item => item.str);
                        text += textItems.join(' ') + '\n';
                    }
                    
                    // Аналізуємо текст PDF для пошуку інформації про сторінки
                    const pagesInfo = extractPagesFromText(text);
                    resolve(pagesInfo);
                } catch (error) {
                    console.error('Помилка аналізу PDF файлу:', error);
                    reject(error);
                }
            };
            
            reader.onerror = function(error) {
                console.error('Помилка читання файлу:', error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Функція для вилучення інформації про сторінки з тексту
    function extractPagesFromText(text) {
        const pages = [];
        let totalPages = 0;
        
        // Регулярні вирази для пошуку згадок про сторінки
        const pageRegex = /(?:page|сторінка|екран|screen)[:\s]+([a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s\-_]+)/gi;
        let match;
        
        while ((match = pageRegex.exec(text)) !== null) {
            const pageName = match[1].trim();
            
            // Визначаємо складність (шукаємо згадки про складність поруч з назвою сторінки)
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
            const context = text.substring(contextStart, contextEnd).toLowerCase();
            
            let complexity = 'середня'; // За замовчуванням
            if (context.includes('складний') || context.includes('складна') || context.includes('high complexity') || context.includes('висок')) {
                complexity = 'висока';
            } else if (context.includes('простий') || context.includes('проста') || context.includes('low complexity') || context.includes('низьк')) {
                complexity = 'низька';
            }
            
            // Шукаємо кількість (якщо вказано)
            let quantity = 1;
            const quantityRegex = /(\d+)\s+(?:page|сторін|екран|screen)/i;
            const quantityMatch = context.match(quantityRegex);
            if (quantityMatch) {
                quantity = parseInt(quantityMatch[1], 10);
            }
            
            pages.push({
                name: pageName,
                complexity: complexity,
                quantity: quantity
            });
            
            totalPages += quantity;
        }
        
        return {
            pageCount: totalPages,
            pages: pages
        };
    }
    
    // Розширена функція аналізу файлів
    async function analyzeAttachedFiles(files) {
        if (files.length === 0) {
            return null;
        }
        
        try {
            // Аналізуємо кожен файл і об'єднуємо результати
            let totalPageCount = 0;
            const allPages = [];
            
            for (const file of files) {
                let fileResult = null;
                
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    fileResult = await analyzeExcelFile(file);
                } else if (file.name.endsWith('.pdf')) {
                    fileResult = await analyzePDFFile(file);
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.name.endsWith('.txt')) {
                    // Для інших типів файлів можна додати аналіз в майбутньому
                    // Наразі просто рахуємо як 1 сторінку
                    fileResult = {
                        pageCount: 1,
                        pages: [{ name: "Невідома сторінка", complexity: "середня", quantity: 1 }]
                    };
                }
                
                if (fileResult) {
                    totalPageCount += fileResult.pageCount;
                    allPages.push(...fileResult.pages);
                }
            }
            
            // Об'єднуємо дублікати сторінок, якщо такі є
            const uniquePages = [];
            const pageNameMap = {};
            
            for (const page of allPages) {
                if (pageNameMap[page.name]) {
                    pageNameMap[page.name].quantity += page.quantity;
                } else {
                    pageNameMap[page.name] = { ...page };
                    uniquePages.push(pageNameMap[page.name]);
                }
            }
            
            return {
                pageCount: totalPageCount,
                pages: uniquePages
            };
        } catch (error) {
            console.error('Помилка при аналізі файлів:', error);
            return null;
        }
    }
    
    // Функція для PERT аналізу ризиків
    function calculatePERTRiskAnalysis(pages, additionalPhases) {
        // Розрахунок стандартного відхилення для кожної сторінки
        const pageVariances = pages.map(page => {
            const range = page.max - page.min;
            const variance = Math.pow(range / 6, 2); // Стандартна формула для дисперсії PERT
            return variance * page.quantity;
        });
        
        // Розрахунок стандартного відхилення для додаткових фаз
        const phaseVariances = additionalPhases.map(phase => {
            if (phase.hasOwnProperty('min') && phase.hasOwnProperty('max')) {
                const range = phase.max - phase.min;
                return Math.pow(range / 6, 2);
            }
            return 0;
        });
        
        // Загальна дисперсія (сума дисперсій)
        const totalVariance = pageVariances.reduce((sum, variance) => sum + variance, 0) + 
                              phaseVariances.reduce((sum, variance) => sum + variance, 0);
        
        // Стандартне відхилення (корінь із дисперсії)
        const standardDeviation = Math.sqrt(totalVariance);
        
        // Загальний час
        const totalTime = pages.reduce((sum, page) => sum + page.estimatedTime * page.quantity, 0) + 
                          additionalPhases.reduce((sum, phase) => sum + phase.time, 0);
        
        // Розрахунок ймовірності завершення вчасно
        // Для спрощення використовуємо приблизний розрахунок (не нормальний розподіл)
        const completionProbability = Math.min(0.95, Math.max(0.5, 1 - (standardDeviation / totalTime) * 2));
        
        // Визначення рівня ризику
        let riskLevel = "низький";
        if (standardDeviation > totalTime * 0.3) {
            riskLevel = "високий";
        } else if (standardDeviation > totalTime * 0.15) {
            riskLevel = "середній";
        }
        
        // Генерація даних для графіка розподілу часу
        const optimisticTime = totalTime - 2 * standardDeviation;
        const pessimisticTime = totalTime + 2 * standardDeviation;
        
        const distributionData = {
            labels: ['Оптимістична', 'Найбільш ймовірна', 'Песимістична'],
            datasets: [{
                label: 'Часові оцінки (годин)',
                data: [
                    Math.max(0, Math.round(optimisticTime)),
                    Math.round(totalTime),
                    Math.round(pessimisticTime)
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };
        
        return {
            standardDeviation: Math.round(standardDeviation * 10) / 10,
            completionProbability: Math.round(completionProbability * 100),
            riskLevel: riskLevel,
            distributionData: distributionData,
            optimisticTime: Math.max(0, Math.round(optimisticTime)),
            expectedTime: Math.round(totalTime),
            pessimisticTime: Math.round(pessimisticTime)
        };
    }
    
    // Функція для створення/оновлення графіків
    function updateCharts(pages, additionalPhases, totalTime, totalCost) {
        // Створюємо графіки, але не відображаємо традиційний контейнер,
        // тому що тепер використовуємо модальне вікно для графіків
        
        // Очищаємо попередні графіки
        if (timeDistributionChart) {
            timeDistributionChart.destroy();
        }
        if (phaseDistributionChart) {
            phaseDistributionChart.destroy();
        }
        
        // Створюємо графік розподілу часу за сторінками
        const timeCtx = document.getElementById('timeDistributionChart').getContext('2d');
        timeDistributionChart = new Chart(timeCtx, {
            type: 'bar',
            data: {
                labels: pages.map(page => page.name),
                datasets: [{
                    label: 'Годин',
                    data: pages.map(page => page.totalTime),
                    backgroundColor: 'rgba(124, 58, 237, 0.6)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Розподіл часу за сторінками'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Години'
                        }
                    }
                }
            }
        });
        
        // Створюємо графік розподілу часу за фазами
        const phasesData = [
            { name: 'UI дизайн', time: pages.reduce((sum, page) => sum + page.totalTime, 0) }
        ];
        additionalPhases.forEach(phase => {
            phasesData.push(phase);
        });
        
        const phaseCtx = document.getElementById('phaseDistributionChart').getContext('2d');
        phaseDistributionChart = new Chart(phaseCtx, {
            type: 'pie',
            data: {
                labels: phasesData.map(phase => phase.name),
                datasets: [{
                    data: phasesData.map(phase => phase.time),
                    backgroundColor: [
                        'rgba(100, 196, 252, 0.7)',
                        'rgba(131, 243, 208, 0.7)',
                        'rgba(253, 164, 175, 0.7)',
                        'rgba(251, 219, 125, 0.7)',
                        'rgba(167, 139, 250, 0.7)'
                    ],
                    borderColor: [
                        'rgba(100, 196, 252, 1)',
                        'rgba(131, 243, 208, 1)',
                        'rgba(253, 164, 175, 1)',
                        'rgba(251, 219, 125, 1)',
                        'rgba(167, 139, 250, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Розподіл часу за фазами'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Не показуємо контейнер графіків автоматично,
        // користувач може відкрити їх через модальне вікно
        // chartContainer.style.display = 'block';
    }
    
    // Функція для створення/оновлення графіка аналізу ризиків
    function updateRiskAnalysisChart(riskAnalysis) {
        // Показуємо контейнер для аналізу ризиків
        riskAnalysisContainer.style.display = 'block';
        
        // Оновлюємо значення метрик
        document.getElementById('standardDeviation').textContent = `±${riskAnalysis.standardDeviation} годин`;
        document.getElementById('completionProbability').textContent = `${riskAnalysis.completionProbability}%`;
        
        const riskLevelElement = document.getElementById('riskLevel');
        riskLevelElement.textContent = riskAnalysis.riskLevel === 'низький' ? 'Низький' :
                                      riskAnalysis.riskLevel === 'середній' ? 'Середній' : 'Високий';
        
        riskLevelElement.className = 'metric-value';
        riskLevelElement.classList.add(
            riskAnalysis.riskLevel === 'низький' ? 'low-risk' :
            riskAnalysis.riskLevel === 'середній' ? 'medium-risk' : 'high-risk'
        );
        
        // Графік розподілу ризиків
        const riskDistributionCtx = document.getElementById('riskDistributionChart').getContext('2d');
        
        if (riskDistributionChart) {
            riskDistributionChart.destroy();
        }
        
        riskDistributionChart = new Chart(riskDistributionCtx, {
            type: 'bar',
            data: riskAnalysis.distributionData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Розподіл ймовірного часу виконання',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Години'
                        }
                    }
                }
            }
        });
    }
    
    // Функції для експорту та збереження оцінок
    function exportToPDF() {
        if (!lastEstimateResult) {
            addMessage('Спочатку отримайте оцінку проекту для експорту.');
            return;
        }
        
        // Перевіряємо чи завантажена бібліотека jsPDF
        if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            addMessage('Помилка: Бібліотеки для експорту в PDF не завантажені.');
            return;
        }
        
        const { jsPDF } = jspdf;
        
        // Створюємо новий PDF документ
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Отримуємо основні дані оцінки
        const { 
            pages, 
            additionalPhases, 
            totalTime, 
            totalCost, 
            projectName = 'Оцінка проекту',
            date = new Date().toLocaleString('uk-UA')
        } = lastEstimateResult;
        
        // Додаємо заголовок
        doc.setFontSize(20);
        doc.text('Оцінка проекту UI дизайну', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Проект: ${projectName}`, 20, 30);
        doc.text(`Дата: ${date}`, 20, 35);
        
        // Додаємо розділ зі сторінками
        doc.setFontSize(14);
        doc.text('Оцінка часу за сторінками:', 20, 45);
        
        // Таблиця сторінок
        const tableData = [];
        tableData.push(['Сторінка', 'Складність', 'Кількість', 'Час (год)', 'Всього (год)']);
        
        pages.forEach(page => {
            tableData.push([
                page.name, 
                page.complexity, 
                page.quantity.toString(), 
                page.estimatedTime.toString(), 
                page.totalTime.toString()
            ]);
        });
        
        doc.autoTable({
            startY: 50,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237] }
        });
        
        // Додаємо додаткові фази
        const currentY = doc.lastAutoTable.finalY + 10;
        
        if (additionalPhases.length > 0) {
            doc.setFontSize(14);
            doc.text('Додаткові фази:', 20, currentY);
            
            const phasesData = [];
            phasesData.push(['Фаза', 'Опис', 'Час (год)']);
            
            additionalPhases.forEach(phase => {
                phasesData.push([
                    phase.name,
                    phase.description || '',
                    phase.time.toString()
                ]);
            });
            
            doc.autoTable({
                startY: currentY + 5,
                head: [phasesData[0]],
                body: phasesData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [124, 58, 237] }
            });
        }
        
        // Додаємо підсумок
        const finalY = (additionalPhases.length > 0) ? doc.lastAutoTable.finalY + 10 : currentY;
        
        doc.setFontSize(14);
        doc.text('Підсумок:', 20, finalY);
        
        doc.setFontSize(12);
        doc.text(`Загальний час: ${Math.round(totalTime)} годин`, 20, finalY + 7);
        doc.text(`Загальна вартість: $${Math.round(totalCost).toLocaleString('uk-UA')}`, 20, finalY + 14);
        
        // Додаємо футер
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Оцінка створена з використанням методу PERT (Cieden Assistant)', 105, 290, { align: 'center' });
        }
        
        // Зберігаємо PDF
        const fileName = `UI_Design_Estimate_${Date.now()}.pdf`;
        doc.save(fileName);
        
        addMessage(`PDF-файл з оцінкою збережено як ${fileName}`);
    }
    
    function exportToExcel() {
        if (!lastEstimateResult) {
            addMessage('Спочатку отримайте оцінку проекту для експорту.');
            return;
        }
        
        // Перевіряємо чи завантажена бібліотека SheetJS
        if (typeof XLSX === 'undefined') {
            addMessage('Помилка: Бібліотека для експорту в Excel не завантажена.');
            return;
        }
        
        const { 
            pages, 
            additionalPhases, 
            totalTime, 
            totalCost, 
            projectName = 'Оцінка проекту',
            date = new Date().toLocaleString('uk-UA')
        } = lastEstimateResult;
        
        // Створюємо новий робочий зошит
        const wb = XLSX.utils.book_new();
        
        // Дані для сторінок
        const pagesData = [
            ['Сторінка', 'Складність', 'Кількість', 'Час (год)', 'Всього (год)']
        ];
        
        pages.forEach(page => {
            pagesData.push([
                page.name, 
                page.complexity, 
                page.quantity, 
                page.estimatedTime, 
                page.totalTime
            ]);
        });
        
        // Додаємо підсумковий рядок
        pagesData.push(['', '', '', 'Всього:', pages.reduce((sum, page) => sum + page.totalTime, 0)]);
        
        // Створюємо аркуш зі сторінками
        const pagesWs = XLSX.utils.aoa_to_sheet(pagesData);
        XLSX.utils.book_append_sheet(wb, pagesWs, 'Сторінки');
        
        // Дані для додаткових фаз
        if (additionalPhases.length > 0) {
            const phasesData = [
                ['Фаза', 'Опис', 'Час (год)']
            ];
            
            additionalPhases.forEach(phase => {
                phasesData.push([
                    phase.name,
                    phase.description || '',
                    phase.time
                ]);
            });
            
            // Додаємо підсумковий рядок
            phasesData.push(['', 'Всього:', additionalPhases.reduce((sum, phase) => sum + phase.time, 0)]);
            
            // Створюємо аркуш з фазами
            const phasesWs = XLSX.utils.aoa_to_sheet(phasesData);
            XLSX.utils.book_append_sheet(wb, phasesWs, 'Додаткові фази');
        }
        
        // Дані підсумку
        const summaryData = [
            ['Проект:', projectName],
            ['Дата:', date],
            ['Загальний час:', `${Math.round(totalTime)} годин`],
            ['Вартість години:', `$${HOURLY_RATE}`],
            ['Загальна вартість:', `$${Math.round(totalCost).toLocaleString('uk-UA')}`],
            ['', ''],
            ['Примітка:', 'Оцінка створена за методом PERT (Program Evaluation and Review Technique)']
        ];
        
        // Створюємо аркуш з підсумком
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Підсумок');
        
        // Зберігаємо Excel-файл
        const fileName = `UI_Design_Estimate_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        addMessage(`Excel-файл з оцінкою збережено як ${fileName}`);
    }
    
    // Функції для роботи з історією оцінок
    function saveEstimateToHistory() {
        if (!lastEstimateResult) {
            addMessage('Спочатку отримайте оцінку проекту для збереження.');
            return;
        }
        
        // Отримуємо поточну історію з localStorage
        let history = [];
        const savedHistory = localStorage.getItem('cieden_estimates_history');
        
        if (savedHistory) {
            try {
                history = JSON.parse(savedHistory);
            } catch (error) {
                console.error('Помилка парсингу історії оцінок:', error);
                history = [];
            }
        }
        
        // Формуємо запис для історії
        const historyEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            projectName: lastEstimateResult.projectName || 'Проект без назви',
            totalTime: Math.round(lastEstimateResult.totalTime),
            totalCost: Math.round(lastEstimateResult.totalCost),
            pageCount: lastEstimateResult.pages.length,
            data: lastEstimateResult
        };
        
        // Додаємо запис до історії (обмежуємо до 10 останніх записів)
        history.unshift(historyEntry);
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // Зберігаємо в localStorage
        try {
            localStorage.setItem('cieden_estimates_history', JSON.stringify(history));
            addMessage('Оцінку успішно збережено в історії.');
            
            // Оновлюємо відображення історії, якщо вона відкрита
            if (historyContainer.style.display !== 'none') {
                showEstimateHistory();
            }
        } catch (error) {
            console.error('Помилка збереження історії оцінок:', error);
            addMessage('Помилка: Не вдалося зберегти оцінку в історії.');
        }
    }
    
    function showEstimateHistory() {
        // Отримуємо історію з localStorage
        let history = [];
        const savedHistory = localStorage.getItem('cieden_estimates_history');
        
        if (savedHistory) {
            try {
                history = JSON.parse(savedHistory);
            } catch (error) {
                console.error('Помилка парсингу історії оцінок:', error);
                history = [];
            }
        }
        
        // Показуємо контейнер історії
        historyContainer.style.display = 'block';
        
        // Очищуємо список історії
        estimateHistory.innerHTML = '';
        
        if (history.length === 0) {
            estimateHistory.innerHTML = '<div class="history-empty">Історія оцінок порожня</div>';
            return;
        }
        
        // Додаємо елементи історії
        history.forEach(entry => {
            const date = new Date(entry.date).toLocaleString('uk-UA');
            
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.dataset.id = entry.id;
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <div class="history-item-title">${entry.projectName}</div>
                    <div class="history-item-date">${date}</div>
                </div>
                <div class="history-item-summary">
                    <div>Кількість сторінок: ${entry.pageCount}</div>
                    <div>Час: ${entry.totalTime} год.</div>
                    <div>Вартість: $${entry.totalCost.toLocaleString('uk-UA')}</div>
                </div>
            `;
            
            // Додаємо обробник для завантаження збереженої оцінки
            historyItem.addEventListener('click', () => {
                loadEstimateFromHistory(entry);
            });
            
            estimateHistory.appendChild(historyItem);
        });
    }
    
    function loadEstimateFromHistory(historyEntry) {
        // Встановлюємо останню оцінку з історії
        lastEstimateResult = historyEntry.data;
        
        // Закриваємо контейнер історії
        historyContainer.style.display = 'none';
        
        // Оновлюємо графіки та аналіз ризиків
        updateCharts(lastEstimateResult.pages, lastEstimateResult.additionalPhases, 
                     lastEstimateResult.totalTime, lastEstimateResult.totalCost);
        
        // Якщо є дані для аналізу ризиків, оновлюємо їх
        if (lastEstimateResult.riskAnalysis) {
            updateRiskAnalysisChart(lastEstimateResult.riskAnalysis);
        } else {
            // Рахуємо аналіз ризиків на основі даних
            const riskAnalysis = calculatePERTRiskAnalysis(
                lastEstimateResult.pages, 
                lastEstimateResult.additionalPhases
            );
            updateRiskAnalysisChart(riskAnalysis);
        }
        
        // Додаємо повідомлення про завантаження
        addMessage(`Завантажено оцінку проекту "${historyEntry.projectName}" від ${new Date(historyEntry.date).toLocaleString('uk-UA')}`);
        
        // Показуємо оцінку в чаті
        const estimateMessage = generateEstimateMessage(
            lastEstimateResult.pages, 
            lastEstimateResult.additionalPhases,
            lastEstimateResult.totalTime,
            lastEstimateResult.totalCost
        );
        addMessage(estimateMessage);
    }
    
    // Функція для генерації повідомлення з оцінкою (для відображення в чаті)
    function generateEstimateMessage(pages, additionalPhases, totalTime, totalCost) {
        let message = `### Результат оцінки проекту\n\n`;
        
        // Таблиця сторінок
        message += `#### Оцінка сторінок/компонентів\n\n`;
        message += `<table class="estimation-table">
            <tr>
                <th>Сторінка/Компонент</th>
                <th>Складність</th>
                <th>Кількість</th>
                <th>Оцінка часу (год)</th>
                <th>Загальний час (год)</th>
            </tr>`;
        
        pages.forEach(page => {
            message += `
            <tr>
                <td>${page.name}</td>
                <td>${page.complexity || 'середня'}</td>
                <td>${page.quantity}</td>
                <td>${page.estimatedTime}</td>
                <td>${page.totalTime}</td>
            </tr>`;
        });
        
        message += `</table>\n\n`;
        
        // Додаткові фази
        if (additionalPhases.length > 0) {
            message += `#### Додаткові фази\n\n`;
            message += `<table class="estimation-table">
                <tr>
                    <th>Фаза</th>
                    <th>Опис</th>
                    <th>Час (год)</th>
                </tr>`;
            
            additionalPhases.forEach(phase => {
                message += `
                <tr>
                    <td>${phase.name}</td>
                    <td>${phase.description}</td>
                    <td>${phase.time}</td>
                </tr>`;
            });
            
            message += `</table>\n\n`;
        }
        
        // Загальний результат
        message += `#### Загальна оцінка\n\n`;
        message += `<table class="estimation-table">
            <tr>
                <th>Загальний час</th>
                <th>Вартість години</th>
                <th>Орієнтовна вартість</th>
            </tr>
            <tr>
                <td>${Math.round(totalTime * 10) / 10} годин</td>
                <td>$${HOURLY_RATE}/год</td>
                <td>$${Math.round(totalCost).toLocaleString()}</td>
            </tr>
        </table>\n\n`;
        
        // Додаємо кнопку для відображення графіків
        message += `<button onclick="openChartsModal()" class="show-charts-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            Переглянути графіки та аналіз
        </button>\n\n`;
        
        message += `Вам потрібні якісь уточнення щодо оцінки, чи хочете внести корективи в обсяг проекту?`;
        
        return message;
    }
    
    // Функція генерації повідомлення з оцінкою англійською
    function generateEstimateMessage_en(pages, additionalPhases, totalTime, totalCost) {
        let message = `### Project Estimation Result\n\n`;
        
        // Таблиця сторінок
        message += `#### Pages/Components Estimation\n\n`;
        message += `<table class="estimation-table">
            <tr>
                <th>Page/Component</th>
                <th>Complexity</th>
                <th>Quantity</th>
                <th>Est. Time (h)</th>
                <th>Total Time (h)</th>
            </tr>`;
        
        pages.forEach(page => {
            message += `
            <tr>
                <td>${page.name}</td>
                <td>${page.complexity || 'medium'}</td>
                <td>${page.quantity}</td>
                <td>${page.estimatedTime}</td>
                <td>${page.totalTime}</td>
            </tr>`;
        });
        
        message += `</table>\n\n`;
        
        // Додаткові фази
        if (additionalPhases.length > 0) {
            message += `#### Additional Phases\n\n`;
            message += `<table class="estimation-table">
                <tr>
                    <th>Phase</th>
                    <th>Description</th>
                    <th>Time (h)</th>
                </tr>`;
            
            additionalPhases.forEach(phase => {
                message += `
                <tr>
                    <td>${phase.name}</td>
                    <td>${phase.description}</td>
                    <td>${phase.time}</td>
                </tr>`;
            });
            
            message += `</table>\n\n`;
        }
        
        // Загальний результат
        message += `#### Total Estimate\n\n`;
        message += `<table class="estimation-table">
            <tr>
                <th>Total Time</th>
                <th>Hourly Rate</th>
                <th>Estimated Cost</th>
            </tr>
            <tr>
                <td>${Math.round(totalTime * 10) / 10} hours</td>
                <td>$${HOURLY_RATE}/hour</td>
                <td>$${Math.round(totalCost).toLocaleString()}</td>
            </tr>
        </table>\n\n`;
        
        // Додаємо кнопку для відображення графіків
        message += `<button onclick="openChartsModal()" class="show-charts-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            View Charts and Analysis
        </button>\n\n`;
        
        message += `Do you need any clarification about the estimate, or would you like to make adjustments to the project scope?`;
        
        return message;
    }
    
    // Оновлена функція аналізу запиту
    async function analyzeRequest(userMessage, files = []) {
        // Визначаємо тип запиту користувача
        const queryType = determineQueryType(userMessage);
        
        // Завантажуємо дані для оцінок, якщо вони ще не завантажені
        if ((queryType === 'estimation' || queryType === 'project_idea') && !estimationsData) {
            estimationsData = await loadEstimationData();
        }
        
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
                
                // Встановлюємо назву проекту
                const projectNameMatch = projectDescription.match(/(лендінг|сайт|інтернет-магазин|портал)[:\s]+([\wа-яА-ЯіІїЇєЄґҐ\s''`"]+)(?:\.|\,|\n|$)/i);
                let projectName = 'Проект UI дизайну';
                if (projectNameMatch) {
                    projectName = projectNameMatch[2].trim();
                }
                
                // Розраховуємо вартість
                // Розрахунок часу на основі сторінок та їх складності
                let totalTime = 0;
                pages.forEach(page => {
                    let baseTime = 0;
                    switch (page.complexity) {
                        case 'simple': baseTime = 8; break;
                        case 'medium': baseTime = 16; break;
                        case 'complex': baseTime = 32; break;
                        default: baseTime = 16;
                    }
                    totalTime += baseTime * page.count;
                });
                
                // Додаємо час для додаткових фаз
                additionalPhases.forEach(phase => {
                    if (phase === 'research') totalTime *= 1.2;
                    if (phase === 'prototyping') totalTime *= 1.15;
                    if (phase === 'testing') totalTime *= 1.1;
                });
                
                // Розраховуємо вартість (приблизна ставка $40/год)
                const hourlyRate = 40;
                const totalCost = totalTime * hourlyRate;
                
                // Зберігаємо результат для можливого експорту
                lastEstimateResult = {
                    projectName,
                    pages,
                    additionalPhases,
                    totalTime,
                    totalCost,
                    date: new Date().toISOString()
                };
                
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
                return {
                    type: 'error',
                    message: "Виникла помилка при обробці запиту."
                };
            }
        }
        
        // Якщо це запит на оцінку проекту
        else if (queryType === 'estimation') {
            try {
                // Визначаємо тип проекту на основі запиту
                let projectType = null;
                let pages = [];
                let projectName = 'Проект UI дизайну';
                
                // Спробуємо визначити назву проекту з запиту
                const projectNameMatch = userMessage.match(/проект[:\s]+([\wа-яА-ЯіІїЇєЄґҐ\s''`"]+)(?:\.|\,|\n|$)/i);
                if (projectNameMatch) {
                    projectName = projectNameMatch[1].trim();
                }
                
                // Визначаємо складність проекту
                const projectComplexity = determineComplexity(userMessage);
                
                // Визначаємо необхідність додаткових фаз
                const additionalPhases = determineAdditionalPhases(userMessage);
                
                // Аналіз прикріплених файлів для визначення кількості сторінок
                // const fileAnalysisResult = files.length > 0 ? await analyzeAttachedFiles(files) : null;
                const fileAnalysisResult = null; // Тимчасово відключено аналіз файлів
                
                // Код для оцінки проекту на основі ключових слів у запиті
                if (/лендінг|landing/i.test(userMessage)) {
                    projectType = 'landing';
                    pages = [
                        { name: 'Лендінг', type: 'landing', complexity: projectComplexity, count: 1 }
                    ];
                } else if (/e-commerce|інтернет-магазин|shop|магазин/i.test(userMessage)) {
                    projectType = 'ecommerce';
                    pages = [
                        { name: 'Головна сторінка', type: 'main', complexity: projectComplexity, count: 1 },
                        { name: 'Каталог товарів', type: 'catalog', complexity: projectComplexity, count: 1 },
                        { name: 'Сторінка товару', type: 'product', complexity: projectComplexity, count: 1 },
                        { name: 'Корзина', type: 'cart', complexity: projectComplexity, count: 1 },
                        { name: 'Оформлення замовлення', type: 'checkout', complexity: projectComplexity, count: 1 }
                    ];
                } else if (/портал|інформаційн|portal/i.test(userMessage)) {
                    projectType = 'portal';
                    pages = [
                        { name: 'Головна сторінка', type: 'main', complexity: projectComplexity, count: 1 },
                        { name: 'Сторінка категорії', type: 'category', complexity: projectComplexity, count: 3 },
                        { name: 'Сторінка публікації', type: 'article', complexity: projectComplexity, count: 1 },
                        { name: 'Сторінка "Про нас"', type: 'about', complexity: 'simple', count: 1 },
                        { name: 'Контакти', type: 'contacts', complexity: 'simple', count: 1 }
                    ];
                } else if (/мобільн[аий]|додаток|app/i.test(userMessage)) {
                    projectType = 'app';
                    pages = [
                        { name: 'Головний екран', type: 'main', complexity: projectComplexity, count: 1 },
                        { name: 'Навігаційне меню', type: 'navigation', complexity: projectComplexity, count: 1 },
                        { name: 'Екран деталей', type: 'details', complexity: projectComplexity, count: 3 },
                        { name: 'Профіль користувача', type: 'profile', complexity: projectComplexity, count: 1 },
                        { name: 'Налаштування', type: 'settings', complexity: 'simple', count: 1 }
                    ];
                } else {
                    projectType = 'website';
                    pages = [
                        { name: 'Головна сторінка', type: 'main', complexity: projectComplexity, count: 1 },
                        { name: 'Сторінка "Про нас"', type: 'about', complexity: 'simple', count: 1 },
                        { name: 'Сторінка послуг', type: 'services', complexity: projectComplexity, count: 1 },
                        { name: 'Контакти', type: 'contacts', complexity: 'simple', count: 1 }
                    ];
                }
                
                // Розрахунок часу на основі сторінок та їх складності
                let totalTime = 0;
                pages.forEach(page => {
                    let baseTime = 0;
                    switch (page.complexity) {
                        case 'simple': baseTime = 8; break;
                        case 'medium': baseTime = 16; break;
                        case 'complex': baseTime = 32; break;
                        default: baseTime = 16;
                    }
                    totalTime += baseTime * page.count;
                });
                
                // Додаємо час для додаткових фаз
                additionalPhases.forEach(phase => {
                    if (phase === 'research') totalTime *= 1.2;
                    if (phase === 'prototyping') totalTime *= 1.15;
                    if (phase === 'testing') totalTime *= 1.1;
                });
                
                // Розраховуємо вартість (приблизна ставка $40/год)
                const hourlyRate = 40;
                const totalCost = totalTime * hourlyRate;
                
                // Зберігаємо результат для можливого експорту
                lastEstimateResult = {
                    projectName,
                    pages,
                    additionalPhases,
                    totalTime,
                    totalCost,
                    date: new Date().toISOString()
                };
                
                // Оновлюємо графіки для візуалізації оцінки
                updateCharts(pages, additionalPhases, totalTime, totalCost);
                
                // Ризик-аналіз на основі PERT
                const riskAnalysis = calculatePERTRiskAnalysis(pages, additionalPhases);
                updateRiskAnalysisChart(riskAnalysis);
                
                // Генеруємо повідомлення з оцінкою
                const estimateMessage = generateEstimateMessage(pages, additionalPhases, totalTime, totalCost);
                
                return {
                    type: 'estimation',
                    message: estimateMessage,
                    data: { pages, additionalPhases, totalTime, totalCost, riskAnalysis }
                };
            } catch (error) {
                console.error("Помилка при аналізі запиту:", error);
                return currentLanguage === 'ua' 
                    ? "Вибачте, виникла помилка при аналізі вашого запиту. Будь ласка, спробуйте ще раз або сформулюйте запит інакше."
                    : "Sorry, there was an error analyzing your request. Please try again or rephrase your query.";
            }
        } else {
            // Для інших типів запитів використовуємо AI або шаблонні відповіді
            return await getGeneralResponse(queryType, userMessage);
        }
    }
    
    // Обробка надсилання повідомлення
    async function handleMessageSend() {
        const userMessage = messageInput.value.trim();
        if (userMessage === '') return;
        
        // Очищаємо поле введення одразу
        messageInput.value = '';
        
        // Додаємо повідомлення користувача до чату
        addMessage(userMessage, true);
        chatState.addMessage('user', userMessage);
        
        // Показуємо, що бот думає
        const thinkingElement = document.createElement('div');
        thinkingElement.classList.add('message', 'bot-message', 'thinking');
        thinkingElement.textContent = 'Обробляю відповідь...';
        chatMessages.appendChild(thinkingElement);
        
        try {
            // Обробляємо відповідь користувача
            chatState.processAnswer(userMessage);
            
            // Отримуємо наступне питання
            const nextQuestion = chatState.getCurrentQuestion();
            
            // Видаляємо повідомлення "думаю"
            chatMessages.removeChild(thinkingElement);
            
            if (nextQuestion) {
                // Додаємо питання бота
                addMessage(nextQuestion, false);
                chatState.addMessage('assistant', nextQuestion);
            } else if (chatState.isCompleted()) {
                // Якщо всі дані зібрані, зберігаємо чат
                const chatData = chatState.getData();
                await convexApi.saveChatWithRetry(chatData);
                
                // Відправляємо підтвердження
                const confirmationMessage = 'Дякуємо за надану інформацію! Наші менеджери зв\'яжуться з вами найближчим часом.';
                addMessage(confirmationMessage, false);
                chatState.addMessage('assistant', confirmationMessage);
            }
        } catch (error) {
            console.error('Помилка при обробці повідомлення:', error);
            
            // Видаляємо повідомлення "думаю"
            chatMessages.removeChild(thinkingElement);
            
            // Показуємо повідомлення про помилку
            addMessage("Вибачте, виникла помилка при обробці вашого повідомлення. Будь ласка, спробуйте ще раз.");
        }
    }
    
    // Обробка надсилання повідомлення
    sendButton.addEventListener('click', handleMessageSend);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleMessageSend();
        }
    });
    
    clearButton.addEventListener('click', function() {
        chatMessages.innerHTML = '';
        
        // Вибір мови для привітального повідомлення
        if (currentLanguage === 'ua') {
            addMessage('Вітаю! Я чат-бот Cieden для оцінки вартості UI дизайну. Опишіть ваш проект або завантажте специфікацію, і я розрахую детальну оцінку часу та вартості розробки за методом PERT.');
        } else {
            addMessage('Hello! I\'m Cieden\'s chatbot for UI design cost estimation. Describe your project or upload a specification, and I\'ll calculate a detailed time and cost estimate using the PERT method.');
        }
    });
    
    // Безпечне додавання обробників для елементів завантаження файлів
    if (typeof uploadButton !== 'undefined' && uploadButton) {
        uploadButton.addEventListener('click', function() {
            if (fileInput) fileInput.click();
        });
    }
    
    if (typeof fileInput !== 'undefined' && fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                for (let i = 0; i < e.target.files.length; i++) {
                    attachedFiles.push(e.target.files[i]);
                }
                addMessage(`Додано ${e.target.files.length} файл(ів)`, true);
            }
        });
    }
    
    // Обробка натискання на кнопки підказок
    suggestionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Беремо текст з кнопки для використання як повідомлення користувача
            const buttonText = button.textContent.trim();
            
            // Додаємо текст з кнопки в поле введення
            messageInput.value = buttonText;
            
            // Для кнопок з текстом про дизайн додатку чи оцінку проектів,
            // додаємо "оцінка" або "розрахувати", щоб чат розпізнав це як запит на оцінку
            if (buttonText.includes('Дизайн') || 
                buttonText.includes('проекту') || 
                buttonText.toLowerCase().includes('оцін')) {
                messageInput.value = "Розрахуйте " + buttonText;
            }
            
            // Викликаємо обробку повідомлення
            handleMessageSend();
        });
    });
    
    // Додаємо стилі для таблиць
    const style = document.createElement('style');
    style.textContent = `
        .estimation-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        .estimation-table th, .estimation-table td {
            border: 1px solid #e0e0e0;
            padding: 8px 12px;
            text-align: left;
        }
        .estimation-table th {
            background-color: #f3f4f6;
            font-weight: 600;
        }
        .estimation-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
    `;
    document.head.appendChild(style);
    
    // Додаємо функції для визначення складності та додаткових фаз
    function determineComplexity(request) {
        const lowComplexityKeywords = ['простий', 'базовий', 'легкий', 'стандартний', 'типовий'];
        const highComplexityKeywords = ['складний', 'комплексний', 'нестандартний', 'унікальний', 'інтерактивний', 'анімований'];
        
        let complexity = 'середня'; // За замовчуванням
        
        // Аналіз тексту запиту для визначення складності
        const requestLower = request.toLowerCase();
        
        if (lowComplexityKeywords.some(keyword => requestLower.includes(keyword))) {
            complexity = 'низька';
        } else if (highComplexityKeywords.some(keyword => requestLower.includes(keyword))) {
            complexity = 'висока';
        }
        
        return complexity;
    }
    
    function determineAdditionalPhases(request) {
        return {
            designSystem: request.toLowerCase().includes('дизайн система') || 
                          request.toLowerCase().includes('design system') ||
                          request.toLowerCase().includes('компоненти') ||
                          request.toLowerCase().includes('бібліотека') ||
                          request.toLowerCase().includes('library'),
                          
            discovery: request.toLowerCase().includes('дослідження') || 
                      request.toLowerCase().includes('discovery') || 
                      request.toLowerCase().includes('аналіз') ||
                      request.toLowerCase().includes('вивчення') ||
                      request.toLowerCase().includes('незрозуміло'),
                      
            wireframes: request.toLowerCase().includes('wireframe') || 
                       request.toLowerCase().includes('прототип') || 
                       request.toLowerCase().includes('каркас')
        };
    }

    // Обробники подій для нових кнопок
    exportPDFButton.addEventListener('click', exportToPDF);
    exportExcelButton.addEventListener('click', exportToExcel);
    saveEstimateButton.addEventListener('click', saveEstimateToHistory);
    showHistoryButton.addEventListener('click', showEstimateHistory);
    showRiskAnalysisButton.addEventListener('click', () => {
        if (lastEstimateResult && lastEstimateResult.riskAnalysis) {
            riskAnalysisContainer.style.display = 
                riskAnalysisContainer.style.display === 'none' || 
                riskAnalysisContainer.style.display === '' ? 'block' : 'none';
        } else {
            addMessage('Спочатку отримайте оцінку проекту для аналізу ризиків.');
        }
    });

    // Експортуємо функції для модального вікна у глобальний об'єкт window
    window.updateModalCharts = updateModalCharts;
    window.closeChartsModal = closeChartsModal;
    
    // Початкове привітання при завантаженні сторінки (автоматично українською)
    addMessage('Вітаю! Я чат-бот Cieden для оцінки вартості UI дизайну. Опишіть ваш проект або завантажте специфікацію, і я розрахую детальну оцінку часу та вартості розробки за методом PERT. Я також можу відповісти на запитання про компанію Cieden, наші послуги, команду, кейси, місію, блог, нагороди та багато іншого. You can also chat with me in English!');

    // Додаємо функцію визначення типу запиту користувача з урахуванням мови
    function determineQueryType(message) {
        // Визначаємо мову повідомлення
        currentLanguage = detectLanguage(message);
        
        // Вибираємо відповідні категорії запитань в залежності від мови
        const categories = currentLanguage === 'ua' ? queryCategories : queryCategories_en;
        
        // Перевірка на запити про створення проектів
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
            message.toLowerCase().includes(keyword.toLowerCase())
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
        
        // Перевірка на запит оцінки проекту
        const estimationKeywords_ua = [
            'оцінка', 'оцінити', 'розрахувати', 'вартість проекту', 'вартість дизайну', 
            'скільки коштує', 'скільки буде коштувати', 'ціна проекту', 'дизайн мобільного',
            'дизайн інформаційного', 'дизайн порталу', 'лендінг', 'e-commerce', 'вартість сайту',
            'вартість додатку', 'розробка сайту', 'розробка додатку', 'створення сайту',
            'ціна сайту', 'ціна додатку', 'дизайн сайту'
        ];
        
        const estimationKeywords_en = [
            'estimate', 'calculate', 'project cost', 'design cost', 'how much',
            'price of project', 'cost evaluation', 'mobile app design', 'website design',
            'landing page', 'e-commerce', 'portal design', 'information portal',
            'site cost', 'app cost', 'website development', 'app development'
        ];
        
        const estimationKeywords = currentLanguage === 'ua' ? estimationKeywords_ua : estimationKeywords_en;
        
        const isEstimationRequest = estimationKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        // Якщо це запит на оцінку проекту
        if (isEstimationRequest) {
            return 'estimation';
        }
        
        // Перевірка на інші типи запитів
        for (const [category, patterns] of Object.entries(categories)) {
            for (const pattern of patterns) {
                if (pattern.test(message)) {
                    return category;
                }
            }
        }
        
        // Якщо не вдалося визначити тип запиту
        return 'unknown';
    }

    // Функція для отримання відповіді на загальний запит з урахуванням мови
    async function getGeneralResponse(queryType, message, customInstructions = null) {
        try {
            // Формуємо базовий системний промпт
            let systemPrompt = 'Ви - корисний асистент, який допомагає користувачам. Відповідайте українською мовою.';
            
            // Додаємо користувацькі інструкції, якщо вони є
            if (customInstructions) {
                systemPrompt = customInstructions;
            }

            // Додаємо специфічні інструкції залежно від типу запиту
            switch (queryType) {
                case 'general':
                    systemPrompt += '\nВідповідайте на загальні питання коротко та зрозуміло.';
                    break;
                case 'technical':
                    systemPrompt += '\nНадавайте технічні деталі та пояснення.';
                    break;
                case 'business':
                    systemPrompt += '\nФокусуйтесь на бізнес-аспектах та рекомендаціях.';
                    break;
                default:
                    systemPrompt += '\nВідповідайте на питання максимально інформативно.';
            }

            // Викликаємо API з модифікованим системним промптом
            const response = await callOpenAI(message, false, systemPrompt);
            return response;
        } catch (error) {
            console.error('Помилка отримання відповіді:', error);
            throw error;
        }
    }

    // Функція для показу повідомлення про успішну операцію
    function showNotification(title, message, type = 'success') {
        // Створюємо елемент повідомлення
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        // Визначаємо іконку в залежності від типу
        let icon = '✅';
        if (type === 'error') {
            icon = '❌';
        } else if (type === 'info') {
            icon = 'ℹ️';
        }
        
        // Створюємо структуру повідомлення
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;
        
        // Додаємо повідомлення на сторінку
        document.body.appendChild(notification);
        
        // Показуємо повідомлення
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Автоматично приховуємо повідомлення через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    // Функція для відправки оцінки на email
    function sendEstimateToEmail(email, includeDetails, includeChart) {
        // В реальному проекті тут був би запит до API для відправки email
        // Зараз просто імітуємо успішну відправку
        
        // Логування для відлагодження
        console.log('Відправка оцінки на email:', {
            email,
            includeDetails,
            includeChart,
            estimate: lastEstimateResult
        });
        
        // Перевіряємо, чи є оцінка для відправки
        if (!lastEstimateResult) {
            showNotification('Помилка', 'Немає даних оцінки для відправки. Спочатку створіть оцінку.', 'error');
            return false;
        }
        
        // Валідація email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Помилка', 'Введіть коректну email адресу', 'error');
            return false;
        }
        
        // Імітуємо відправку запиту на сервер
        setTimeout(() => {
            // Після успішної відправки
            const message = currentLanguage === 'ua' 
                ? `Оцінка проекту "${lastEstimateResult.projectName}" відправлена на ${email}`
                : `Project estimate "${lastEstimateResult.projectName}" has been sent to ${email}`;
                
            showNotification(
                currentLanguage === 'ua' ? 'Відправлено' : 'Sent',
                message,
                'success'
            );
            
            // Закриваємо форму
            emailFormContainer.style.display = 'none';
        }, 1500);
        
        return true;
    }
    
    // Обробка подій для кнопок відправки на email
    if (sendToEmailButton) {
        sendToEmailButton.addEventListener('click', function() {
            // Показуємо форму для відправки
            emailFormContainer.style.display = 'block';
            
            // Прокручуємо до форми
            emailFormContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Фокусуємося на полі введення email
            emailInput.focus();
        });
    }
    
    if (cancelEmailButton) {
        cancelEmailButton.addEventListener('click', function() {
            // Закриваємо форму
            emailFormContainer.style.display = 'none';
        });
    }
    
    if (confirmEmailButton) {
        confirmEmailButton.addEventListener('click', function() {
            // Отримуємо значення полів
            const email = emailInput.value.trim();
            const includeDetails = includeDetailsCheckbox.checked;
            const includeChart = includeChartCheckbox.checked;
            
            // Відправляємо оцінку на email
            const success = sendEstimateToEmail(email, includeDetails, includeChart);
            
            // Якщо відправка успішна, закриваємо форму
            if (success) {
                // Затримка для імітації процесу відправки
                setTimeout(() => {
                    emailFormContainer.style.display = 'none';
                }, 500);
            }
        });
    }

    // Функція для відкриття модального вікна з графіками
    function openChartsModal() {
        // Копіюємо дані з основних графіків у модальні графіки
        updateModalCharts();
        
        // Відображаємо модальне вікно
        chartsModal.style.display = 'flex';
        
        // Додаємо клас active для анімації
        setTimeout(() => {
            chartsModal.classList.add('active');
        }, 10);
        
        // Забороняємо прокрутку основної сторінки
        document.body.style.overflow = 'hidden';
    }
    
    // Функція для закриття модального вікна
    function closeChartsModal() {
        // Видаляємо клас active для анімації закриття
        chartsModal.classList.remove('active');
        
        // Після завершення анімації приховуємо модальне вікно
        setTimeout(() => {
            chartsModal.style.display = 'none';
            
            // Відновлюємо прокрутку основної сторінки
            document.body.style.overflow = '';
        }, 300);
    }
    
    // Функція для оновлення графіків у модальному вікні
    function updateModalCharts() {
        if (!lastEstimateResult) return;
        
        const { pages, additionalPhases, totalTime, totalCost } = lastEstimateResult;
        
        // Очищаємо попередні графіки у модальному вікні
        if (modalTimeDistributionChart) {
            modalTimeDistributionChart.destroy();
        }
        if (modalPhaseDistributionChart) {
            modalPhaseDistributionChart.destroy();
        }
        
        // Створюємо графік розподілу часу за сторінками в модальному вікні
        const modalTimeCtx = document.getElementById('modalTimeDistributionChart').getContext('2d');
        modalTimeDistributionChart = new Chart(modalTimeCtx, {
            type: 'bar',
            data: {
                labels: pages.map(page => page.name),
                datasets: [{
                    label: 'Годин',
                    data: pages.map(page => page.totalTime),
                    backgroundColor: 'rgba(124, 58, 237, 0.6)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 60
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 25,
                        top: 20,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Розподіл часу за сторінками',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 5,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const percent = (value / totalTime * 100).toFixed(1);
                                return `${value} годин (${percent}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45,
                            padding: 10
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            padding: 8
                        },
                        title: {
                            display: true,
                            text: 'Години',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            padding: 10
                        }
                    }
                }
            }
        });
        
        // Створюємо графік розподілу часу за фазами в модальному вікні
        const phasesData = [
            { name: 'UI дизайн', time: pages.reduce((sum, page) => sum + page.totalTime, 0) }
        ];
        additionalPhases.forEach(phase => {
            phasesData.push(phase);
        });
        
        const modalPhaseCtx = document.getElementById('modalPhaseDistributionChart').getContext('2d');
        modalPhaseDistributionChart = new Chart(modalPhaseCtx, {
            type: 'pie',
            data: {
                labels: phasesData.map(phase => phase.name),
                datasets: [{
                    data: phasesData.map(phase => phase.time),
                    backgroundColor: [
                        'rgba(100, 196, 252, 0.7)',
                        'rgba(131, 243, 208, 0.7)',
                        'rgba(253, 164, 175, 0.7)',
                        'rgba(251, 219, 125, 0.7)',
                        'rgba(167, 139, 250, 0.7)'
                    ],
                    borderColor: [
                        'rgba(100, 196, 252, 1)',
                        'rgba(131, 243, 208, 1)',
                        'rgba(253, 164, 175, 1)',
                        'rgba(251, 219, 125, 1)',
                        'rgba(167, 139, 250, 1)'
                    ],
                    borderWidth: 1,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 20
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Розподіл часу за фазами',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 5,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percent = (value / totalTime * 100).toFixed(1);
                                return `${context.label}: ${value} годин (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Оновлюємо заголовок та інформацію в модальному вікні
        const modalTitleElement = document.getElementById('chartsModalTitle');
        const modalSummaryElement = document.getElementById('chartsModalSummary');
        
        if (modalTitleElement) {
            modalTitleElement.textContent = 'Деталі оцінки проекту';
        }
        
        if (modalSummaryElement) {
            modalSummaryElement.innerHTML = `
                <div class="modal-summary-item">
                    <div class="modal-summary-label">Загальний час:</div>
                    <div class="modal-summary-value">${totalTime} годин</div>
                </div>
                <div class="modal-summary-item">
                    <div class="modal-summary-label">Загальна вартість:</div>
                    <div class="modal-summary-value">$${totalCost}</div>
                </div>
            `;
        }
    }
    
    // Обробники подій для модального вікна
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeChartsModal);
    }
    
    // Закриття модального вікна по кліку на затемнену область
    if (chartsModal) {
        chartsModal.addEventListener('click', (e) => {
            if (e.target === chartsModal) {
                closeChartsModal();
            }
        });
    }
    
    // Обробники подій для кнопок у модальному вікні
    if (exportPDFModalButton) {
        exportPDFModalButton.addEventListener('click', exportToPDF);
    }
    
    if (exportExcelModalButton) {
        exportExcelModalButton.addEventListener('click', exportToExcel);
    }
    
    if (sendToEmailModalButton) {
        sendToEmailModalButton.addEventListener('click', () => {
            closeChartsModal();
            setTimeout(() => {
                // Показуємо форму для відправки на email
                emailFormContainer.style.display = 'block';
                
                // Прокручуємо до форми
                emailFormContainer.scrollIntoView({ behavior: 'smooth' });
                
                // Фокусуємося на полі введення email
                emailInput.focus();
            }, 300);
        });
    }
    
    // Експортуємо функції для глобального доступу з index.html
    window.updateModalCharts = updateModalCharts;
    window.closeChartsModal = closeChartsModal;

    // API ключ для OpenAI (зберігається на сервері, не на клієнті)
    let OPENAI_API_KEY = 'server-api-key'; // Клієнтам не потрібно вводити API ключ

    // Встановлюємо модель GPT-3.5 Turbo за замовчуванням
    localStorage.setItem('chatModel', 'gpt-3.5-turbo');
    
    // Приховуємо модальне вікно налаштувань API - в цій версії воно не потрібне
    function disableSettingsModal() {
        const settingsButton = document.getElementById('settingsButton');
        const settingsModal = document.getElementById('settingsModal');
        
        // Приховуємо кнопку налаштувань, якщо вона є
        if (settingsButton) {
            settingsButton.style.display = 'none';
        }
        
        // Приховуємо модальне вікно налаштувань, якщо воно є
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }
    
    // Викликаємо функцію для приховування налаштувань під час завантаження
    disableSettingsModal();
    
    // Отримуємо модель за замовчуванням з сервера при завантаженні
    fetch('/api/default-model')
        .then(response => response.json())
        .then(data => {
            if (data && data.model) {
                localStorage.setItem('chatModel', data.model);
            }
        })
        .catch(error => console.log('Помилка отримання налаштувань за замовчуванням', error));
    
    // Оновлюємо функцію callOpenAI, щоб вона використовувала локальний проксі-сервер
    async function callOpenAI(userMessage, isEstimationRequest, customSystemPrompt) {
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
                
                // Додаємо контекст знань про компанію
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
            
            // Підготуємо тіло запиту
            const requestBody = {
                model: AI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt + companyInfo
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            };
            
            console.log("Параметри запиту:", JSON.stringify(requestBody, null, 2));
            
            // Робимо запит до локального проксі-сервера замість OpenAI API напряму
            const response = await fetch('http://localhost:3000/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            // Логуємо статус відповіді
            console.log("Статус відповіді від проксі:", response.status);
            
            // Отримуємо дані відповіді
            const data = await response.json();
            console.log("Відповідь від проксі:", data);
            
            if (data.error) {
                throw new Error(`API помилка: ${data.error.message || JSON.stringify(data.error)}`);
            }
            
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            } else {
                console.error('Неочікувана відповідь від API:', data);
                return "Вибачте, сталася помилка при обробці вашого запиту. Спробуйте ще раз або зв'яжіться з нами напряму.";
            }
        } catch (error) {
            console.error('Загальна помилка в callOpenAI:', error);
            return `Вибачте, сталася помилка: ${error.message}. Можливо, проксі-сервер не запущено. Спробуйте ще раз або зв'яжіться з нами напряму.`;
        }
    }

    // Глобальні змінні для налаштувань API
    let AI_MODEL = "gpt-3.5-turbo";

    // Функція для зберігання налаштувань в localStorage
    function saveSettings(apiKey, model) {
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
            OPENAI_API_KEY = apiKey;
        }
        
        if (model) {
            localStorage.setItem('ai_model', model);
            AI_MODEL = model;
        }
    }
    
    // Функція для завантаження налаштувань з localStorage
    function loadSettings() {
        const savedApiKey = localStorage.getItem('openai_api_key');
        const savedModel = localStorage.getItem('ai_model');
        
        if (savedApiKey) {
            OPENAI_API_KEY = savedApiKey;
            document.getElementById('apiKeyInput').value = savedApiKey;
        }
        
        if (savedModel) {
            AI_MODEL = savedModel;
            document.getElementById('modelSelect').value = savedModel;
        }
    }
    
    // Обробники подій для модального вікна налаштувань
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const cancelSettingsButton = document.getElementById('cancelSettingsButton');
    
    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            if (settingsModal) {
                loadSettings(); // Завантажуємо збережені налаштування
                settingsModal.classList.add('active');
            }
        });
    }
    
    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', function() {
            settingsModal.classList.remove('active');
        });
    }
    
    if (cancelSettingsButton) {
        cancelSettingsButton.addEventListener('click', function() {
            settingsModal.classList.remove('active');
        });
    }
    
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', function() {
            const apiKey = document.getElementById('apiKeyInput').value;
            const model = document.getElementById('modelSelect').value;
            
            saveSettings(apiKey, model);
            settingsModal.classList.remove('active');
            
            // Показуємо повідомлення про успішне збереження
            showNotification(
                'Налаштування збережено', 
                'API ключ та модель AI успішно збережені', 
                'success'
            );
        });
    }
    
    // Завантажуємо налаштування при запуску
    window.addEventListener('DOMContentLoaded', function() {
        // Завантажуємо налаштування, якщо вони є
        if (document.getElementById('apiKeyInput')) {
            loadSettings();
        }
    });

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

    // Функція для валідації промпту
    function validatePrompt(prompt) {
        if (!prompt || prompt.trim() === '') {
            return {
                isValid: false,
                error: 'Промпт не може бути порожнім'
            };
        }

        // Перевірка мінімальної довжини
        if (prompt.length < 10) {
            return {
                isValid: false,
                error: 'Промпт має містити щонайменше 10 символів'
            };
        }

        // Перевірка на наявність ключових слів
        const requiredKeywords = ['що', 'як', 'де', 'коли', 'чому', 'хто'];
        const hasKeywords = requiredKeywords.some(keyword => 
            prompt.toLowerCase().includes(keyword)
        );

        if (!hasKeywords) {
            return {
                isValid: false,
                error: 'Промпт має містити питання (що, як, де, коли, чому, хто)'
            };
        }

        return {
            isValid: true,
            error: null
        };
    }

    // Функція для обробки інструкцій
    function processInstructions(instructions) {
        if (!instructions || instructions.trim() === '') {
            return null;
        }

        // Розбиваємо інструкції на окремі правила
        const rules = instructions.split('\n').map(rule => rule.trim()).filter(rule => rule);
        
        // Формуємо системний промпт з інструкціями
        const systemPrompt = `Ви - асистент, який дотримується наступних інструкцій:\n${rules.join('\n')}\n\nБудь ласка, відповідайте згідно з цими інструкціями.`;

        return systemPrompt;
    }

    // Функція для завантаження інструкцій з файлу
    async function loadInstructionsFromFile(filePath) {
        try {
            const response = await fetch(`/instructions/${filePath}`);
            if (!response.ok) {
                throw new Error('Помилка завантаження інструкцій');
            }
            const text = await response.text();
            return text;
        } catch (error) {
            console.error('Помилка завантаження інструкцій:', error);
            return null;
        }
    }

    // Функція для завантаження набору інструкцій
    async function loadInstructionSet(setName) {
        try {
            const response = await fetch('/instructions/instruction_sets.json');
            if (!response.ok) {
                throw new Error('Помилка завантаження наборів інструкцій');
            }
            const sets = await response.json();
            
            if (sets[setName]) {
                const instructions = await loadInstructionsFromFile(sets[setName].file);
                if (instructions) {
                    localStorage.setItem('chatInstructions', instructions);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Помилка завантаження набору інструкцій:', error);
            return false;
        }
    }

    // Модифікуємо функцію handleMessageSend
    async function handleMessageSend() {
        const userMessage = messageInput.value.trim();
        
        if (!userMessage) return;

        // Перевіряємо чи це команда завантаження набору інструкцій
        if (userMessage.startsWith('/завантажити_інструкції')) {
            const setName = userMessage.replace('/завантажити_інструкції', '').trim();
            const success = await loadInstructionSet(setName);
            
            if (success) {
                addMessage(`Набір інструкцій "${setName}" успішно завантажено.`, false);
            } else {
                addMessage('Помилка завантаження набору інструкцій.', false);
            }
            messageInput.value = '';
            return;
        }

        // Перевіряємо чи це інструкції
        if (userMessage.startsWith('/інструкції')) {
            const instructions = userMessage.replace('/інструкції', '').trim();
            const systemPrompt = processInstructions(instructions);
            
            if (systemPrompt) {
                addMessage('Інструкції успішно збережено. Тепер я буду відповідати згідно з цими правилами.', false);
                localStorage.setItem('chatInstructions', systemPrompt);
            } else {
                addMessage('Помилка: Інструкції не можуть бути порожніми.', false);
            }
            messageInput.value = '';
            return;
        }

        // Валідуємо промпт
        const validation = validatePrompt(userMessage);
        if (!validation.isValid) {
            addMessage(`Помилка валідації: ${validation.error}`, false);
            messageInput.value = '';
            return;
        }

        // Додаємо повідомлення користувача
        addMessage(userMessage, true);
        messageInput.value = '';

        // Отримуємо збережені інструкції
        const savedInstructions = localStorage.getItem('chatInstructions');
        
        try {
            // Визначаємо тип запиту
            const queryType = determineQueryType(userMessage);
            
            // Якщо це запит на оцінку
            if (queryType === 'estimation') {
                const result = await analyzeRequest(userMessage);
                addMessage(result, false);
            } else {
                // Для загальних запитів використовуємо збережені інструкції
                const response = await getGeneralResponse(queryType, userMessage, savedInstructions);
                addMessage(response, false);
            }
        } catch (error) {
            console.error('Помилка обробки повідомлення:', error);
            addMessage('Вибачте, сталася помилка при обробці вашого запиту. Спробуйте ще раз.', false);
        }
    }

    // Додаємо обробник події для поля вводу
    messageInput.addEventListener('input', function() {
        const sendButton = document.getElementById('sendMessage');
        if (this.value.trim() !== '') {
            sendButton.disabled = false;
        } else {
            sendButton.disabled = true;
        }
    });

    // Функція для оновлення стану кнопки
    function updateSendButtonState() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            const hasText = messageInput.value.trim() !== '';
            sendButton.disabled = !hasText;
        }
    }

    // Ініціалізуємо стан кнопки при завантаженні
    document.addEventListener('DOMContentLoaded', function() {
        const messageInput = document.getElementById('messageInput');
        
        if (messageInput) {
            // Оновлюємо стан при завантаженні
            updateSendButtonState();
            
            // Додаємо обробник події для поля вводу
            messageInput.addEventListener('input', updateSendButtonState);
        }
    });

    // Функція для пошуку схожих проектів
    function findSimilarProjects(projectDescription, allEstimations) {
        if (!allEstimations) return [];
        
        const keywords = projectDescription.toLowerCase().split(/\s+/);
        const similarProjects = [];
        
        for (const estimation of allEstimations) {
            let matchScore = 0;
            const projectName = estimation.name.toLowerCase();
            
            // Рахуємо кількість співпадінь ключових слів
            for (const keyword of keywords) {
                if (projectName.includes(keyword)) {
                    matchScore++;
                }
            }
            
            if (matchScore > 0) {
                similarProjects.push({
                    name: estimation.name,
                    score: matchScore,
                    data: estimation.data
                });
            }
        }
        
        // Сортуємо за релевантністю
        return similarProjects.sort((a, b) => b.score - a.score);
    }

    // Функція для аналізу схожих проектів
    function analyzeSimilarProjects(similarProjects) {
        if (!similarProjects || similarProjects.length === 0) {
            return null;
        }
        
        const analysis = {
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            recommendations: []
        };
        
        let totalTime = 0;
        let projectCount = 0;
        
        similarProjects.forEach(project => {
            const projectData = project.data;
            if (projectData.totalTime) {
                totalTime += projectData.totalTime;
                analysis.minTime = Math.min(analysis.minTime, projectData.totalTime);
                analysis.maxTime = Math.max(analysis.maxTime, projectData.totalTime);
                projectCount++;
            }
            
            // Додаємо рекомендації на основі схожих проектів
            if (projectData.recommendations) {
                analysis.recommendations.push(...projectData.recommendations);
            }
        });
        
        if (projectCount > 0) {
            analysis.averageTime = totalTime / projectCount;
        }
        
        return analysis;
    }

    // Функція для генерації відповіді з урахуванням схожих проектів
    async function generateEstimationResponse(message, estimationData) {
        try {
            // Шукаємо схожі проекти
            const similarProjects = findSimilarProjects(message, estimationData.allEstimations);
            const analysis = analyzeSimilarProjects(similarProjects);
            
            // Генеруємо базову відповідь
            let response = await processUserMessage(message, estimationData);
            
            // Додаємо інформацію про схожі проекти
            if (analysis) {
                response += "\n\n### Аналіз схожих проектів:\n";
                response += `* Середній час розробки: ${Math.round(analysis.averageTime)} годин\n`;
                response += `* Мінімальний час: ${Math.round(analysis.minTime)} годин\n`;
                response += `* Максимальний час: ${Math.round(analysis.maxTime)} годин\n`;
                
                if (analysis.recommendations && analysis.recommendations.length > 0) {
                    response += "\n### Рекомендації з попередніх проектів:\n";
                    const uniqueRecommendations = [...new Set(analysis.recommendations)];
                    uniqueRecommendations.slice(0, 5).forEach(rec => {
                        response += `* ${rec}\n`;
                    });
                }
            }
            
            return response;
        } catch (error) {
            console.error('Помилка при генерації відповіді:', error);
            return 'Вибачте, сталася помилка при обробці вашого запиту. Спробуйте ще раз.';
        }
    }

    // Обробка відправки повідомлення
    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;

        // Додаємо повідомлення користувача
        addMessage(message, true);
        messageInput.value = '';

        // Показуємо індикатор завантаження
        const loadingMessage = document.createElement('div');
        loadingMessage.classList.add('message', 'bot-message', 'loading');
        loadingMessage.textContent = 'Обробка запиту...';
        chatMessages.appendChild(loadingMessage);

        try {
            // Завантажуємо дані та генеруємо відповідь
            const estimationData = await loadEstimationData();
            const response = await generateEstimationResponse(message, estimationData);

            // Видаляємо індикатор завантаження
            chatMessages.removeChild(loadingMessage);

            // Додаємо відповідь бота
            addMessage(response);

        } catch (error) {
            console.error('Помилка при обробці повідомлення:', error);
            
            // Видаляємо індикатор завантаження
            chatMessages.removeChild(loadingMessage);
            
            // Додаємо повідомлення про помилку
            addMessage('Вибачте, сталася помилка при обробці вашого запиту. Спробуйте ще раз.');
        }
    }

    // Ініціалізація стану чату та API
    const chatState = new ChatState();
    const convexApi = new ConvexApi();
});