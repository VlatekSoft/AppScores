// Глобальные переменные
let players = []; // Массив игроков
let history = []; // История действий для функции отмены

// Элементы DOM
const playerNameInput = document.getElementById('player-name');
const createPlayerBtn = document.getElementById('create-player');
const playersList = document.getElementById('players-list');
const totalInputsEl = document.getElementById('total-inputs');
const totalOutputsEl = document.getElementById('total-outputs');
const totalBalanceEl = document.getElementById('total-balance');
const deleteAllBtn = document.getElementById('delete-all');
const clearSumsBtn = document.getElementById('clear-sums');
const undoBtn = document.getElementById('undo');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Загрузка данных из localStorage
    loadData();
    
    // Обновление интерфейса
    updateTotals();
    renderPlayers();
    
    // Обработчики событий
    playerNameInput.addEventListener('input', toggleCreateButton);
    createPlayerBtn.addEventListener('click', createPlayer);
    deleteAllBtn.addEventListener('click', deleteAll);
    clearSumsBtn.addEventListener('click', clearSums);
    undoBtn.addEventListener('click', undoLastAction);
});

// Функция для активации/деактивации кнопки создания игрока
function toggleCreateButton() {
    createPlayerBtn.disabled = !playerNameInput.value.trim();
}

// Функция создания нового игрока
function createPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) return;
    
    // Создаем нового игрока
    const player = {
        id: Date.now().toString(),
        name: name,
        inputs: 0,
        outputs: 0,
        history: []
    };
    
    // Добавляем в историю действий
    addToHistory('add_player', { player });
    
    // Добавляем игрока в массив
    players.push(player);
    
    // Очищаем поле ввода
    playerNameInput.value = '';
    toggleCreateButton();
    
    // Обновляем интерфейс
    renderPlayers();
    saveData();
}

// Функция отрисовки списка игроков
function renderPlayers() {
    // Сортируем игроков по сальдо (от большего к меньшему)
    const sortedPlayers = [...players].sort((a, b) => {
        const balanceA = a.inputs - a.outputs;
        const balanceB = b.inputs - b.outputs;
        return balanceB - balanceA;
    });
    
    // Очищаем список
    playersList.innerHTML = '';
    
    // Добавляем игроков в список
    sortedPlayers.forEach(player => {
        const template = document.getElementById('player-template');
        const playerItem = template.content.cloneNode(true);
        
        // Устанавливаем ID игрока
        const li = playerItem.querySelector('.player-item');
        li.dataset.playerId = player.id;
        
        // Устанавливаем имя игрока
        const nameEl = playerItem.querySelector('.player-name');
        nameEl.textContent = player.name;
        
        // Устанавливаем сальдо игрока
        const balanceEl = playerItem.querySelector('.player-balance');
        const balance = player.inputs - player.outputs;
        const formattedBalance = (balance / 1000).toFixed(1);
        balanceEl.textContent = formattedBalance;
        balanceEl.classList.add(balance >= 0 ? 'positive' : 'negative');
        
        // Добавляем обработчики событий
        const playerInfo = playerItem.querySelector('.player-info');
        playerInfo.addEventListener('click', () => toggleHistory(player.id));
        
        const plusBtn = playerItem.querySelector('.btn-plus');
        plusBtn.addEventListener('click', () => adjustAmount(player.id, 1000));
        
        const minusBtn = playerItem.querySelector('.btn-minus');
        minusBtn.addEventListener('click', () => adjustAmount(player.id, -1000));
        
        const inputBtn = playerItem.querySelector('.btn-input');
        inputBtn.addEventListener('click', () => addInput(player.id));
        
        const outputBtn = playerItem.querySelector('.btn-output');
        outputBtn.addEventListener('click', () => addOutput(player.id));
        
        const deleteBtn = playerItem.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => deletePlayer(player.id));
        
        // Заполняем историю операций
        const historyList = playerItem.querySelector('.history-list');
        player.history.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            historyList.appendChild(li);
        });
        
        // Добавляем элемент в список
        playersList.appendChild(playerItem);
    });
}

// Функция для показа/скрытия истории операций игрока
function toggleHistory(playerId) {
    const playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
    const playerName = playerItem.querySelector('.player-name');
    const historyEl = playerItem.querySelector('.player-history');
    
    playerName.classList.toggle('active');
    
    if (historyEl.classList.contains('hidden')) {
        historyEl.classList.remove('hidden');
        historyEl.classList.add('show');
        historyEl.classList.add('slide-down');
    } else {
        historyEl.classList.remove('show');
        historyEl.classList.add('slide-up');
        setTimeout(() => {
            historyEl.classList.add('hidden');
            historyEl.classList.remove('slide-up');
            historyEl.classList.remove('slide-down');
        }, 300);
    }
}

// Функция для изменения суммы в поле ввода
function adjustAmount(playerId, change) {
    const playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
    const amountInput = playerItem.querySelector('.input-amount');
    
    let amount = parseInt(amountInput.value) || 1000;
    amount += change;
    
    // Ограничиваем значение от 1000 до 99999
    amount = Math.max(1000, Math.min(99999, amount));
    
    amountInput.value = amount;
}

// Функция для добавления ввода средств
function addInput(playerId) {
    const playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
    const amountInput = playerItem.querySelector('.input-amount');
    const amount = parseInt(amountInput.value) || 1000;
    
    // Находим игрока
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Добавляем в историю действий
    addToHistory('add_input', { 
        playerId, 
        amount, 
        previousInputs: players[playerIndex].inputs 
    });
    
    // Обновляем данные игрока
    players[playerIndex].inputs += amount;
    
    // Добавляем запись в историю операций игрока
    const dateTime = formatDateTime(new Date());
    const historyEntry = `[${dateTime}] Ввод: ${amount}`;
    players[playerIndex].history.push(historyEntry);
    
    // Сбрасываем значение поля ввода на 1000
    amountInput.value = 1000;
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для добавления вывода средств
function addOutput(playerId) {
    const playerItem = document.querySelector(`.player-item[data-player-id="${playerId}"]`);
    const amountInput = playerItem.querySelector('.input-amount');
    const amount = parseInt(amountInput.value) || 1000;
    
    // Находим игрока
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Добавляем в историю действий
    addToHistory('add_output', { 
        playerId, 
        amount, 
        previousOutputs: players[playerIndex].outputs 
    });
    
    // Обновляем данные игрока
    players[playerIndex].outputs += amount;
    
    // Добавляем запись в историю операций игрока
    const dateTime = formatDateTime(new Date());
    const historyEntry = `[${dateTime}] Вывод: ${amount}`;
    players[playerIndex].history.push(historyEntry);
    
    // Сбрасываем значение поля ввода на 1000
    amountInput.value = 1000;
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для удаления игрока
function deletePlayer(playerId) {
    // Находим игрока
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Добавляем в историю действий
    addToHistory('delete_player', { 
        player: players[playerIndex] 
    });
    
    // Удаляем игрока
    players.splice(playerIndex, 1);
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для обновления общих сумм
function updateTotals() {
    const totals = players.reduce((acc, player) => {
        acc.inputs += player.inputs;
        acc.outputs += player.outputs;
        return acc;
    }, { inputs: 0, outputs: 0 });
    
    totalInputsEl.textContent = totals.inputs;
    totalOutputsEl.textContent = totals.outputs;
    totalBalanceEl.textContent = totals.inputs - totals.outputs;
}

// Функция для удаления всех данных
function deleteAll() {
    if (!confirm('Вы уверены, что хотите удалить все данные?')) return;
    
    // Добавляем в историю действий
    addToHistory('delete_all', { players: [...players] });
    
    // Очищаем массив игроков
    players = [];
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для очистки сумм
function clearSums() {
    if (!confirm('Вы уверены, что хотите очистить все суммы?')) return;
    
    // Добавляем в историю действий
    addToHistory('clear_sums', { 
        players: players.map(p => ({ ...p })) 
    });
    
    // Очищаем суммы и историю операций
    players.forEach(player => {
        player.inputs = 0;
        player.outputs = 0;
        player.history = [];
    });
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для отмены последнего действия
function undoLastAction() {
    if (history.length === 0) return;
    
    // Получаем последнее действие
    const lastAction = history.pop();
    
    // Отменяем действие в зависимости от типа
    switch (lastAction.type) {
        case 'add_player':
            // Удаляем добавленного игрока
            players = players.filter(p => p.id !== lastAction.data.player.id);
            break;
            
        case 'delete_player':
            // Восстанавливаем удаленного игрока
            players.push(lastAction.data.player);
            break;
            
        case 'add_input':
            // Отменяем ввод средств
            const playerInputIndex = players.findIndex(p => p.id === lastAction.data.playerId);
            if (playerInputIndex !== -1) {
                players[playerInputIndex].inputs = lastAction.data.previousInputs;
                // Удаляем последнюю запись из истории операций
                players[playerInputIndex].history.pop();
            }
            break;
            
        case 'add_output':
            // Отменяем вывод средств
            const playerOutputIndex = players.findIndex(p => p.id === lastAction.data.playerId);
            if (playerOutputIndex !== -1) {
                players[playerOutputIndex].outputs = lastAction.data.previousOutputs;
                // Удаляем последнюю запись из истории операций
                players[playerOutputIndex].history.pop();
            }
            break;
            
        case 'delete_all':
            // Восстанавливаем всех игроков
            players = lastAction.data.players;
            break;
            
        case 'clear_sums':
            // Восстанавливаем суммы и историю операций
            players = lastAction.data.players;
            break;
    }
    
    // Обновляем интерфейс
    updateTotals();
    renderPlayers();
    saveData();
}

// Функция для добавления действия в историю
function addToHistory(type, data) {
    history.push({ type, data });
    // Ограничиваем историю до 50 последних действий
    if (history.length > 50) {
        history.shift();
    }
}

// Функция для форматирования даты и времени
function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Функция для сохранения данных в localStorage
function saveData() {
    localStorage.setItem('appScores_players', JSON.stringify(players));
}

// Функция для загрузки данных из localStorage
function loadData() {
    const savedPlayers = localStorage.getItem('appScores_players');
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
    }
}