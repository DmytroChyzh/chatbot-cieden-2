const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Завантажуємо змінні оточення з .env
dotenv.config();

// Встановлюємо API ключ для OpenAI
// УВАГА: Це лише для розробки. У продакшені краще використовувати змінні оточення або .env файл
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'ваш-api-ключ-тут';

const app = express();
const port = process.env.PORT || 3000;
const fallbackPort = process.env.FALLBACK_PORT || 3001; // Запасний порт, якщо основний зайнятий

// Дозволяємо CORS для доступу з фронтенду
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Вивід інформації про всі запити для діагностики
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Обслуговування статичних файлів з папки public
const publicPath = path.join(__dirname, '../public');
console.log('Шлях до публічних файлів:', publicPath);
app.use(express.static(publicPath));

// Додаємо обслуговування папки з даними
const dataPath = path.join(__dirname, '../public/data');
console.log('Шлях до даних:', dataPath);
app.use('/data', express.static(dataPath));

// Маршрут для кореневої сторінки
app.get('/', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  console.log('Надсилаємо файл:', indexPath);
  res.sendFile(indexPath);
});

// Маршрут для перевірки статусу сервера
app.get('/status', (req, res) => {
  res.json({ status: 'API Proxy Server is running' });
});

// Ендпоінт для отримання моделі за замовчуванням (без передачі ключа)
app.get('/api/default-model', (req, res) => {
  res.json({ model: 'gpt-3.5-turbo' });
});

// Проксі-маршрут для OpenAI API
app.post('/api/openai', async (req, res) => {
  try {
    console.log('Отримано запит до OpenAI API');
    
    // Отримуємо параметри запиту від клієнта
    const { model, messages, temperature, max_tokens } = req.body;
    
    // Перевіряємо наявність необхідних параметрів
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Необхідні параметри відсутні або невірний формат' 
      });
    }
    
    // Перевіряємо, чи є API ключ
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'ваш-api-ключ-тут') {
      console.error('Помилка: API ключ не налаштовано');
      return res.status(500).json({
        error: 'API ключ не налаштовано на сервері',
        details: 'Адміністратор повинен додати API ключ OpenAI в .env файл'
      });
    }
    
    // Відправляємо запит до OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model || 'gpt-3.5-turbo',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    console.log('Успішна відповідь від OpenAI API');
    
    // Повертаємо відповідь клієнту
    res.json(response.data);
    
  } catch (error) {
    console.error('Помилка під час запиту до OpenAI API:', error.message);
    
    // Повертаємо помилку клієнту
    if (error.response) {
      // Якщо є відповідь з помилкою від OpenAI API
      console.error('OpenAI API відповів з помилкою:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      // Якщо інша помилка
      res.status(500).json({ 
        error: 'Помилка сервера',
        message: error.message
      });
    }
  }
});

// Маршрут для отримання списку всіх естімейтів
app.get('/api/estimations', async (req, res) => {
    try {
        const files = await fs.readdir(dataPath);
        const estimationFiles = files.filter(file => 
            file.toLowerCase().endsWith('.json') && 
            (file.toLowerCase().includes('estimation') || file.toLowerCase().includes('estimate'))
        );
        
        const estimations = await Promise.all(estimationFiles.map(async (file) => {
            try {
                const content = await fs.readFile(path.join(dataPath, file), 'utf-8');
                return {
                    filename: file,
                    content: JSON.parse(content)
                };
            } catch (error) {
                console.error(`Помилка читання файлу ${file}:`, error);
                return {
                    filename: file,
                    error: 'Помилка читання файлу'
                };
            }
        }));

        res.json({
            success: true,
            estimations
        });
    } catch (error) {
        console.error('Помилка отримання списку естімейтів:', error);
        res.status(500).json({
            success: false,
            error: 'Помилка отримання списку естімейтів'
        });
    }
});

// Маршрут для обробки всіх інших запитів (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Спрощуємо запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущено на порту ${port}`);
}); 