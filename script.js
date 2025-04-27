document.addEventListener('DOMContentLoaded', () => {
    // Configuração inicial da página
    document.title = 'Jogo da Velha'; // Define o título da aba

    // Variáveis de estado do jogo
    let gameBoard = ['', '', '', '', '', '', '', '', '']; // Tabuleiro vazio
    let currentPlayer = 'X'; // Jogador inicial
    let gameActive = true; // Controle do fluxo do jogo
    let scores = { X: 0, O: 0, draw: 0 }; // Placar
    let gameMode = '2players'; // Modo padrão
    let difficulty = 'easy'; // Dificuldade padrão
    let isDarkMode = false; // Tema claro padrão
    const jsConfetti = new JSConfetti(); // Efeitos de confete
    const difficulties = ['Fácil', 'Médio', 'Difícil']; // Opções de dificuldade
    const difficultyValues = ['easy', 'medium', 'hard']; // Valores correspondentes

    // Seleção de elementos DOM
    const cells = document.querySelectorAll('.cell');
    const turnIndicator = document.getElementById('turn-indicator');
    const restartButton = document.getElementById('restart');
    const modeToggle = document.getElementById('mode-toggle');
    const difficultyButton = document.getElementById('difficulty');
    const gameStatusElement = document.getElementById('game-status');
    const gameModeHelpElement = document.getElementById('game-mode-help');
    const themeToggle = document.getElementById('theme-toggle');
    const helpButton = document.getElementById('help-button');
    const helpModal = document.querySelector('.help-modal');
    const closeHelp = document.querySelector('.close-help');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const scoreDrawElement = document.getElementById('score-draw');
    const container = document.querySelector('.container');

    // Inicialização do jogo
    initTheme();
    setupEventListeners();
    updateGameUI();
    updateScoresDisplay();
    handleWindowResize();

    // Funções de tema
    function initTheme() {
        // Carrega preferência de tema do localStorage
        isDarkMode = localStorage.getItem('darkMode') === 'true';
        applyTheme();
    }

    function applyTheme() {
        // Aplica tema atual ao documento
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    }

    function toggleTheme() {
        // Alterna entre temas claro/escuro
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    }

    // Configuração de event listeners
    function setupEventListeners() {
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        
        // Eventos de botões
        restartButton.addEventListener('click', resetGame);
        modeToggle.addEventListener('click', toggleGameMode);
        difficultyButton.addEventListener('click', toggleDifficulty);
        themeToggle.addEventListener('click', toggleTheme);

        // Eventos do modal de ajuda
        helpButton.addEventListener('click', () => helpModal.style.display = 'flex');
        closeHelp.addEventListener('click', () => helpModal.style.display = 'none');
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.style.display = 'none';
        });

        // Evento de redimensionamento
        window.addEventListener('resize', handleWindowResize);
    }

    // Manipulação de redimensionamento
    function handleWindowResize() {
        // Ajustes responsivos para telas pequenas
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        if (windowHeight < 600 || windowWidth < 400) {
            container.style.maxHeight = '98vh';
            container.style.padding = '10px';
        } else {
            container.style.maxHeight = '';
            container.style.padding = '';
        }

        // Redesenha linha vencedora se necessário
        const winner = checkWinner(false);
        if (winner && winner !== 'Empate') {
            const winPattern = findWinningPattern();
            if (winPattern) drawWinningLine(winPattern);
        }
    }

    // Controle de modo de jogo
    function toggleGameMode() {
        // Alterna entre 2 jogadores e vs IA
        gameMode = gameMode === '2players' ? 'ia' : '2players';
        modeToggle.textContent = `Modo: ${gameMode === '2players' ? '2 Jogadores' : 'vs IA'}`;
        difficultyButton.style.display = gameMode === 'ia' ? 'block' : 'none';
        updateGameModeHelp();
        restartGame();
    }

    // Controle de dificuldade
    function toggleDifficulty() {
        const currentIndex = difficultyValues.indexOf(difficulty);
        const nextIndex = (currentIndex + 1) % difficulties.length;
        difficulty = difficultyValues[nextIndex];
        difficultyButton.textContent = `Dificuldade: ${difficulties[nextIndex]}`;
        updateGameModeHelp();
    }

    // Atualização da UI do modo de jogo
    function updateGameModeHelp() {
        gameModeHelpElement.textContent = gameMode === '2players'
            ? 'Modo: 2 Jogadores'
            : `Modo: vs IA (${difficulties[difficultyValues.indexOf(difficulty)]})`;
    }

    // Lógica principal do jogo
    function handleCellClick(event) {
        // Processa clique em uma célula
        const cellIndex = parseInt(event.target.getAttribute('data-index'));
        if (gameBoard[cellIndex] !== '' || !gameActive) return;
        if (gameMode === 'ia' && currentPlayer !== 'X') return;

        makeMove(cellIndex, currentPlayer);
    }

    function makeMove(cellIndex, player) {
        // Executa uma jogada
        gameBoard[cellIndex] = player;
        cells[cellIndex].textContent = player;
        cells[cellIndex].style.color = player === 'X' ? 'var(--x-color)' : 'var(--o-color)';

        const winner = checkWinner();
        if (winner) {
            endGame(winner);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateGameUI();

            // Jogada da IA se necessário
            if (gameMode === 'ia' && currentPlayer === 'O') {
                setTimeout(makeAIMove, 800);
            }
        }
    }

    // Lógica da IA
    function makeAIMove() {
        if (!gameActive || currentPlayer !== 'O') return;

        const emptyCells = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);

        if (emptyCells.length === 0) return;

        let move;
        switch (difficulty) {
            case 'easy':
                // Movimento aleatório
                move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                break;
            case 'medium':
                // Tenta vencer ou bloquear o jogador
                move = findWinningMove('O') || findWinningMove('X') || emptyCells[Math.floor(Math.random() * emptyCells.length)];
                break;
            case 'hard':
                // Estratégia avançada
                move = findBestMove();
                break;
        }

        makeMove(move, 'O');
    }

    // Funções auxiliares da IA
    function findWinningMove(player) {
        // Procura por jogadas vencedoras
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (
                (gameBoard[a] === player && gameBoard[b] === player && gameBoard[c] === '') ||
                (gameBoard[a] === player && gameBoard[c] === player && gameBoard[b] === '') ||
                (gameBoard[b] === player && gameBoard[c] === player && gameBoard[a] === '')
            ) {
                return gameBoard[a] === '' ? a : gameBoard[b] === '' ? b : c;
            }
        }
        return null;
    }

    function findBestMove() {
        // Estratégia ideal para dificuldade difícil
        if (gameBoard[4] === '') return 4;

        const winningMove = findWinningMove('O');
        if (winningMove !== null) return winningMove;

        const blockingMove = findWinningMove('X');
        if (blockingMove !== null) return blockingMove;

        const corners = [0, 2, 6, 8].filter(index => gameBoard[index] === '');
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

        const emptyCells = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Verificação de vitória
    function findWinningPattern() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
                return pattern;
            }
        }
        return null;
    }

    function checkWinner(shouldDrawLine = true) {
        // Verifica se há um vencedor
        const winPattern = findWinningPattern();
        if (winPattern) {
            if (shouldDrawLine) drawWinningLine(winPattern);
            return gameBoard[winPattern[0]];
        }

        return gameBoard.includes('') ? null : 'Empate';
    }

    // Efeitos visuais
    function drawWinningLine(pattern) {
        document.querySelector('.winning-line')?.remove();
    
        const [a, b, c] = pattern;
        const line = document.createElement('div');
        line.classList.add('winning-line');
    
        // Determina a cor baseada no jogador vencedor
        const winner = gameBoard[pattern[0]];
        line.style.backgroundColor = winner === 'X' ? 'var(--x-color)' : 'var(--o-color)';
        line.style.boxShadow = winner === 'X' 
            ? '0 0 10px rgba(240, 98, 146, 0.7)' 
            : '0 0 10px rgba(76, 175, 80, 0.7)';
    
        const board = document.querySelector('.game-board');
        const boardRect = board.getBoundingClientRect();
    
        const cellARect = cells[a].getBoundingClientRect();
        const cellCRect = cells[c].getBoundingClientRect();
    
        const startX = cellARect.left - boardRect.left + (cellARect.width / 2);
        const startY = cellARect.top - boardRect.top + (cellARect.height / 2);
        const endX = cellCRect.left - boardRect.left + (cellCRect.width / 2);
        const endY = cellCRect.top - boardRect.top + (cellCRect.height / 2);
    
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX);
    
        line.style.width = `${length}px`;
        line.style.height = '6px';
        line.style.left = `${startX}px`;
        line.style.top = `${startY}px`;
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${angle}rad)`;
    
        board.appendChild(line);
    }

    // Finalização do jogo
    function endGame(winner) {
        gameActive = false;

        if (winner === 'Empate') {
            turnIndicator.innerHTML = '<strong>Deu velha!</strong> 🏁';
            gameStatusElement.style.borderLeftColor = 'var(--draw-color)';
        } else {
            turnIndicator.innerHTML = `<strong>${winner === 'X' ? 'Jogador X' : (gameMode === '2players' ? 'Jogador O' : 'IA')} venceu!</strong> 🎉`;
            gameStatusElement.style.borderLeftColor = winner === 'X' ? 'var(--x-color)' : 'var(--o-color)';
            launchConfetti();
        }

        updateScores(winner);
        setTimeout(restartGame, 2000);
    }

    function launchConfetti() {
        // Efeito de confete para vitória
        jsConfetti.addConfetti({
            emojis: ['🎉', '✨', '🏆', '👑', '⭐'],
            emojiSize: 30,
            confettiNumber: 50,
        });
    }

    // Controle de placar
    function updateScores(winner) {
        if (winner === 'X') scores.X++;
        else if (winner === 'O') scores.O++;
        else scores.draw++;

        updateScoresDisplay();
    }

    function updateScoresDisplay() {
        scoreXElement.textContent = `X: ${scores.X}`;
        scoreOElement.textContent = `O: ${scores.O}`;
        scoreDrawElement.textContent = `Velhas: ${scores.draw}`;
    }

    // Reinicialização do jogo
    function restartGame() {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;

        cells.forEach(cell => {
            cell.textContent = '';
            cell.style.color = 'var(--text-color)';
        });

        updateGameUI();
        document.querySelector('.winning-line')?.remove();
    }

    function resetGame() {
        // Reinicia completamente (incluindo placar)
        scores = { X: 0, O: 0, draw: 0 };
        updateScoresDisplay();
        restartGame();
    }

    // Atualizações de UI
    function updateGameUI() {
        updateTurnIndicator();
        updateGameStatus();
        updateGameModeHelp();
    }

    function updateTurnIndicator() {
        if (gameMode === 'ia' && currentPlayer === 'O') {
            turnIndicator.innerHTML = 'Vez da <strong>IA (O)</strong> <span class="ia-thinking">...</span>';
        } else {
            turnIndicator.innerHTML = `É a vez do <strong>Jogador ${currentPlayer}</strong>`;
        }
    }

    function updateGameStatus() {
        gameStatusElement.className = 'game-status';

        if (!gameActive) return;

        if (gameMode === 'ia' && currentPlayer === 'O') {
            gameStatusElement.classList.add('status-ia');
            gameStatusElement.style.borderLeftColor = 'var(--o-color)';
        } else {
            gameStatusElement.classList.add(currentPlayer === 'X' ? 'status-player-x' : 'status-player-o');
            gameStatusElement.style.borderLeftColor = currentPlayer === 'X' ? 'var(--x-color)' : 'var(--o-color)';
        }
    }
});