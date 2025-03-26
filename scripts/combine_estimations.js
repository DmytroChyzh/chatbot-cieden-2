const fs = require('fs').promises;
const path = require('path');

async function combineEstimations() {
    try {
        // Шлях до папки з даними
        const dataDir = path.join(__dirname, '../data');
        
        // Читаємо всі файли в папці
        const files = await fs.readdir(dataDir);
        
        // Фільтруємо тільки JSON файли з естімейтами
        const estimationFiles = files.filter(file => 
            file.endsWith('.json') && 
            file !== 'all_estimations.json' &&
            file !== 'estimations.json'
        );

        // Створюємо об'єкт для об'єднаних даних
        const combinedData = {
            estimations: [],
            statistics: {
                averageEstimates: {},
                commonPages: [],
                projectTypes: []
            },
            metadata: {
                lastUpdated: new Date().toISOString(),
                totalProjects: 0,
                version: "1.0.0"
            }
        };

        // Читаємо та обробляємо кожен файл
        for (const file of estimationFiles) {
            const filePath = path.join(dataDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const estimation = JSON.parse(content);

            // Додаємо естімейт до списку
            combinedData.estimations.push({
                name: file.replace('.json', ''),
                data: estimation
            });

            combinedData.metadata.totalProjects++;
        }

        // Зберігаємо об'єднані дані
        const outputPath = path.join(dataDir, 'all_estimations.json');
        await fs.writeFile(
            outputPath, 
            JSON.stringify(combinedData, null, 2),
            'utf8'
        );

        console.log(`Успішно об'єднано ${combinedData.metadata.totalProjects} естімейтів`);
        console.log(`Результат збережено в: ${outputPath}`);

    } catch (error) {
        console.error('Помилка при об\'єднанні естімейтів:', error);
    }
}

// Запускаємо функцію
combineEstimations(); 