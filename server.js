/**
 * Сервер для обработки данных опроса "Мост 2025"
 * Упрощенная версия с основной функциональностью без сложных настроек безопасности
 */
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла
dotenv.config();

// Инициализация Express приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Базовая настройка middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Функция для аутентификации в Google API с использованием Service Account
 * @returns {Promise<google.auth.JWT>} Объект для аутентификации
 */
async function getAuthClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  await auth.authorize();
  return auth;
}

/**
 * Обработчик для сохранения данных из опроса в Google Таблицу
 */
app.post('/api/survey-submit', async (req, res) => {
  try {
    const surveyData = req.body;

    // Проверяем наличие данных
    if (!surveyData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Отсутствуют данные опроса' 
      });
    }

    console.log('Получены данные опроса:', new Date().toISOString());
    
    // Получаем аутентификацию
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Создаем массив для записи в таблицу
    const row = [new Date().toISOString()]; // Добавляем временную метку

    // Преобразуем данные опроса в формат для таблицы
    // Этот порядок должен соответствовать заголовкам в таблице
    const fieldOrder = [
      'Будущее после войны',
      'Высказывания о Западе и союзниках',
      'Истории о военных и погибших',
      'Вопросы экономики',
      'Динамика разговоров о войне 2022-2025',
      'Сколько людей в окружении поддерживают войну',
      'Война, как обыденность',
      'Война и церковь',
      'Отношение к антивоенным оппозиционерам',
      'Мужчины или женщины?',
      'Возраст собеседников',
      'Источники о войне и событиях в России',
      'География',
      'Возраст респондента',
      'Частота разговоров о политике и войне',
      'Избегаю обсуждение войны с ближним кругом',
      'Как проходят регулярные вопросы о войне с ближним кругом',
      'Причины избегания обсуждений войны с широким кругом',
      'Как проходят регулярные обсуждения войны с широким кругом',
      'Причины избегания разговоров о войне с незнакомцами',
      'Как проходят регулярные разговоры о войне с незнакомцами'
    ];

    // Добавляем значения в нужном порядке
    fieldOrder.forEach(field => {
      if (surveyData[field] !== undefined) {
        // Обрабатываем разные типы данных
        if (typeof surveyData[field] === 'object' && surveyData[field] !== null) {
          row.push(JSON.stringify(surveyData[field]));
        } else {
          row.push(surveyData[field]);
        }
      } else {
        // Если поле отсутствует, добавляем пустую ячейку
        row.push('');
      }
    });

    // Определяем следующую свободную строку в таблице
    const metadataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A:A',
    });

    const rowCount = metadataResponse.data.values ? metadataResponse.data.values.length + 1 : 1;

    // Записываем данные в таблицу
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Sheet1!A${rowCount}`,
      valueInputOption: 'RAW',
      resource: {
        values: [row]
      }
    });

    console.log(`Данные сохранены в строке ${rowCount}`);

    // Отправляем успешный ответ
    res.status(200).json({ success: true, message: 'Данные успешно сохранены' });
  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Произошла ошибка при обработке запроса',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Запуск сервера
 */
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT} в режиме ${process.env.NODE_ENV || 'development'}`);
  console.log(`Откройте браузер и перейдите по адресу http://localhost:${PORT}`);
});

module.exports = app;