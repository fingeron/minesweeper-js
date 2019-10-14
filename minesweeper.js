(function(global) {
    // Local dependency - Requires EventEmitter
    EventEmitter = global.EventEmitter;
    if(!EventEmitter)
        throw new Error("No event emitter found, failed loading Minesweeper.");

    // This dictates the size of the cubes and therefore the size of the board.
    const CUBE_SIZE = 20;

    function Minesweeper(boardEl, level) {
        if(!(boardEl instanceof HTMLElement))
            throw new Error('An HTML element bust be provided as board.');
        this.boardEl = boardEl;

        // defaulting to Hard
        level = level || Minesweeper.Level.Hard;

        // Referencing measurments
        this.rows = level.rows;
        this.cols = level.cols;
        this.bombs = level.bombs;

        // Ensuring mandatory styling
        this.boardEl.style.height = (CUBE_SIZE * this.rows) + 'px';
        this.boardEl.style.width = (CUBE_SIZE * this.cols) + 'px';

        // Initializing game
        this.onStateChange = new EventEmitter();
        this.init();
    }

    // Statically keeping level info and game states
    Minesweeper.Level = {
        Easy: { rows: 9, cols: 9, bombs: 10 },
        Medium: { rows: 16, cols: 16, bombs: 40 },
        Hard: { rows: 16, cols: 30, bombs: 99 }
    };

    Minesweeper.State = {
        Init: 0,
        Playing: 1,
        Done: 2,
        Lose: 3
    };

    Minesweeper.prototype.init = function() {
        // Clearing element
        this.boardEl.innerHTML = '';

        // Creating board matrix
        this.board = [];
        for(let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for(let c = 0; c < this.cols; c++) {
                this.board[r][c] = new Cube(this, r, c);
                let cubeEl = this.board[r][c].el;

                // Resizing cubes
                cubeEl.style.height = cubeEl.style.width = CUBE_SIZE + 'px';

                // Appending cube el to board
                this.boardEl.appendChild(cubeEl);
            }
        }

        // Finally updating board state
        this.setState(Minesweeper.State.Init);
    };

    Minesweeper.prototype.setBombs = function(exclude) {
        // First assigning all bombs in random locations
        let bombsLeft = this.bombs;
        while(bombsLeft > 0) {
            let cube = this.board[random(this.rows)][random(this.cols)];

            // Checking if cube is excluded (probably first click)
            if(exclude instanceof Cube && cube === exclude)
                continue;

            // Checking if already assigned a bomb
            if(cube.isBomb()) 
                continue;

            cube.setBomb();
            bombsLeft--;
        }

        // Then assigning numbers to cubes
        for(let r = 0; r < this.rows; r++)
            for(let c = 0; c < this.cols; c++)
                if(!this.board[r][c].isBomb())
                    this.board[r][c].number = 
                        this.getNeighbors(r, c)
                            .reduce((count, cube) => { return cube.isBomb() ? count + 1 : count }, 0);
    };

    Minesweeper.prototype.getNeighbors = function(row, col) {
        let neighbors = [];

        for(let r = row-1; r <= row+1; r++)
            for(let c = col-1; c <= col+1; c++)
                if(r >= 0 && r < this.rows && c >= 0 && c < this.cols)
                    if(!(r === row && c === col))
                        neighbors.push(this.board[r][c]);
        
        return neighbors;
    };

    Minesweeper.prototype.lose = function() {
        this.setState(Minesweeper.State.Lose);
        for(let row of this.board)
            for(let cube of row) {
                if(cube.isBomb()) {
                    cube.el.innerText = 'X';
                    cube.el.style.color = 'red';
                }

                cube.el.removeEventListener('click', cube.listeners.open);
                cube.el.removeEventListener('dblclick', cube.listeners.openWithNeighbors);
                cube.el.removeEventListener('contextmenu', cube.listeners.mark);
            }
        alert("Lost!");
    };

    Minesweeper.prototype.setState = function(state) {
        let prevState = this.state;
        this.state = state;
        this.onStateChange.emit(this.state, prevState);
    };

    function Cube(board, row, col) {
        // Keeping reference to board and location
        this.board = board;
        this.row = row;
        this.col = col;

        // In the beginning a cube is empty.
        // later on it will be assigned it's proper number (1-8) or bomb (-1).
        this.number = 0;

        // Keeping cube state
        this.isOpen = false;
        this.isMarked = false;

        // Generating an element
        this.el = document.createElement('button');

        // Ensuring mandatory styling
        this.el.style.boxSizing = 'border-box';
        this.el.style.padding = this.el.style.margin = '0';
        this.el.style.float = 'left';
        
        // Cube events
        this.listeners = {
            open: (e) => { this.open(); e.preventDefault(); },
            openWithNeighbors: (e) => { this.open(true); e.preventDefault(); },
            mark: (e) => { this.toggleMark(); e.preventDefault(); return false; }
        };

        this.el.addEventListener('click', this.listeners.open);
        this.el.addEventListener('dblclick', this.listeners.openWithNeighbors);
        this.el.addEventListener('contextmenu', this.listeners.mark);
    }

    Cube.prototype.isEmpty = function() { return this.number === 0 };
    Cube.prototype.isBomb = function() { return this.number === -1 };
    Cube.prototype.setBomb = function() { this.number = -1; };

    Cube.prototype.open = function(isDblClick) {
        // Check for clean board - and set bombs.
        // Pass the clicked cube to ensure its not assigned a bomb.
        if(this.board.state === Minesweeper.State.Init) {
            this.board.setBombs(this);
            this.board.setState(Minesweeper.State.Playing);
        }

        // Locking marked/open cubes
        if(this.isMarked || (this.isOpen && !isDblClick))
            return;

        this.isOpen = true;

        // If number is 0 (or doubleclick) automatically open all neighbors
        if(this.number === 0 || isDblClick) {
            let neighbors = this.board.getNeighbors(this.row, this.col);

            // Check matching number and bomb markings
            if(this.number > 0) {
                let marked = 0;
                for(let n = 0; n < neighbors.length; n++) {
                    if(neighbors[n].isMarked)
                        marked++;
                }
                // If not equal, cancel operation
                if(this.number !== marked)
                    return;
            }

            // Eventually open neighbor cubes
            neighbors.forEach(cube => { cube.open(); });
        }
        
        // Write number to cube
        if(this.number > 0)
            this.el.innerText = this.number;
        else if(this.isBomb())
            this.board.lose();

        // Updating UI
        this.el.style.border = 'none';
    };

    Cube.prototype.toggleMark = function() {
        if(this.isOpen)
            return;
            
        // Update cube state and class
        this.isMarked = !this.isMarked;
        this.el.innerText = this.isMarked ? '*' : '';
    };

    // Helpers
    function random(range, start) {
        if(typeof start !== 'number')
            start = 0;

        return start + parseInt(Math.random()*(range - start));
    }

    // Providing reference to global object
    global.Minesweeper = Minesweeper;
})(this);