(function(global) {
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
        this.init();
    }

    // Statically keeping level info
    Minesweeper.Level = {
        Easy: { rows: 9, cols: 9, bombs: 10 },
        Medium: { rows: 16, cols: 16, bombs: 40 },
        Hard: { rows: 16, cols: 30, bombs: 99 }
    }

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

        // Board is untouched
        this.pristine = true;
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
        
        // Board is no longer pristine
        this.pristine = false;
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
        this.el.addEventListener('click', (e) => { this.open(); e.preventDefault(); });
        this.el.addEventListener('dblclick', (e) => { this.open(true); e.preventDefault(); });
        this.el.addEventListener('contextmenu', (e) => { this.toggleMark(); e.preventDefault(); return false; });
    }

    Cube.prototype.isEmpty = function() { return this.number === 0 };
    Cube.prototype.isBomb = function() { return this.number === -1 };
    Cube.prototype.setBomb = function() { this.number = -1; };

    Cube.prototype.open = function(isDblClick) {
        // Check for pristine board - and init bombs.
        if(this.board.pristine)
            this.board.setBombs(this);

        // Locking marked/open cubes
        if(this.isMarked || (this.isOpen && !isDblClick))
            return;

        // If bomb, lose game.
        if(this.isBomb()) {
            console.error('LOSE');
            console.log(this);
        }

        this.isOpen = true;

        // If number is 0 (or doubleclick) automatically open all neighbors
        if(this.number === 0 || isDblClick)
            this.board.getNeighbors(this.row, this.col).forEach((cube) => { cube.open() });
        
        // Write number to cube
        if(this.number > 0)
            this.el.innerText = this.number;

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