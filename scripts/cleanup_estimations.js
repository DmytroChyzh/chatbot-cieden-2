const fs = require('fs').promises;
const path = require('path');

async function cleanupEstimations() {
    try {
        // Шлях до папки з даними
        const dataDir = path.join(__dirname, '../data');
        
        // Читаємо всі файли в папці
        const files = await fs.readdir(dataDir);
        
        // Фільтруємо файли для видалення
        const filesToDelete = files.filter(file => 
            file.endsWith('.json') && 
            file !== 'all_estimations.json' &&
            file !== 'estimations.json'
        );

        console.log('Файли для видалення:');
        filesToDelete.forEach(file => console.log(`- ${file}`));

        // Видаляємо кожен файл
        for (const file of filesToDelete) {
            const filePath = path.join(dataDir, file);
            await fs.unlink(filePath);
            console.log(`Видалено: ${file}`);
        }

        console.log(`\nУспішно видалено ${filesToDelete.length} файлів`);

    } catch (error) {
        console.error('Помилка при видаленні файлів:', error);
    }
}

// Запускаємо функцію
cleanupEstimations(); 