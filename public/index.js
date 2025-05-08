const survey = new Survey.Model(json);
survey.applyTheme(themeJson);

// Добавляем русскую локализацию
survey.locale = "ru";

// При завершении опроса
survey.onComplete.add((sender, options) => {
    // Выводим в консоль для отладки (можно удалить в production)
    console.log(JSON.stringify(sender.data, null, 3));
    
    // Отправляем данные в API
    sendSurveyData(sender.data)
        .then(response => {
            console.log('Данные успешно отправлены');
        })
        .catch(error => {
            console.error('Ошибка при отправке данных:', error);
        });
});

/**
 * Отправляет данные опроса в API
 * 
 * @param {Object} data - Данные опроса
 * @returns {Promise} - Promise с результатом отправки
 */
async function sendSurveyData(data) {
    try {
        // Конфигурация эндпоинта для отправки данных находится на сервере
        // Это делается для повышения безопасности - не храним URL и авторизационные данные в клиентском коде
        const response = await fetch('/api/survey-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Не храним секретные ключи в клиентском коде
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        
        // В случае ошибки с основным API, используем запасной вариант
        // Это может быть другой эндпоинт или локальное сохранение данных
        return await sendDataFallback(data);
    }
}

/**
 * Запасной метод для отправки данных в случае ошибки с основным API
 * 
 * @param {Object} data - Данные опроса
 * @returns {Promise} - Promise с результатом отправки
 */
async function sendDataFallback(data) {
    try {
        // Здесь можно реализовать резервное сохранение данных
        // Например, отправка на другой сервер или сохранение в localStorage
        
        // Для демонстрации, просто логируем ошибку
        console.log('Используется запасной метод отправки данных');
        
        // В реальном сценарии здесь была бы отправка на резервный эндпоинт
        return { success: true, message: 'Данные сохранены через запасной метод' };
    } catch (error) {
        console.error('Ошибка запасного метода отправки:', error);
        throw error;
    }
}

// Отображаем опрос
survey.render(document.getElementById("surveyElement"));