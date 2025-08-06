class Pacman extends Phaser.Scene {
    constructor () {
        super();
        this.Pacman = null;
        this.direction = null;
        this.previousDirection = "left";
        this.blockSize = 16;
        this.board = [];
        this.speed = 170;
        this.intersections = [];
        this.nextIntersection = null;
        
        // Ghost properties
        this.ghosts = [];
        this.ghostSprites = [];
        this.ghostColors = ['red', 'pink', 'blue', 'green'];
        this.ghostReleaseTimer = null;
        this.ghostsReleased = 0;
        this.centerX = 232;
        this.centerY = 220;

        // Weather and level properties
        this.currentLevel = 1;
        this.weatherLoaded = false;
        this.API_KEY = '83afd44f94bfe725eb51047a18c6da34';
    }

    async fetchWeatherData() {
        if (!this.API_KEY || this.API_KEY === '83afd44f94bfe725eb51047a18c6da34') {
            console.log('No weather API key configured. Using default level 1.');
            return { temperature: 20, city: 'Default' };
        }

        try {
            if (navigator.geolocation) {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;
                            const weather = await this.getWeatherByCoords(lat, lon);
                            resolve(weather);
                        },
                        async () => {
                            console.log('Geolocation failed, using default city (London)');
                            const weather = await this.getWeatherByCity('London');
                            resolve(weather);
                        }
                    );
                });
            } else {
                console.log('Geolocation not supported, using default city (London)');
                return await this.getWeatherByCity('London');
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            return { temperature: 20, city: 'Error' };
        }
    }

    async getWeatherByCoords(lat, lon) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
        );
        const data = await response.json();
        return { temperature: data.main.temp, city: data.name };
    }

    async getWeatherByCity(city) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.API_KEY}&units=metric`
        );
        const data = await response.json();
        return { temperature: data.main.temp, city: data.name };
    }

    determineLevelFromTemperature(temperature) {
        console.log(`Current temperature: ${temperature}°C`);
        
        if (temperature <= 10) {
            console.log('Cold weather detected - Loading ICE level (Level 2)');
            return 2;
        } else if (temperature >= 25) {
            console.log('Hot weather detected - Loading DESERT level (Level 3)');
            return 3;
        } else {
            console.log('Normal weather detected - Loading GENERIC level (Level 1)');
            return 1;
        }
    }

    preload() {
    if (!this.weatherLoaded) {
        this.fetchWeatherData().then((weatherData) => {
            this.currentLevel = this.determineLevelFromTemperature(weatherData.temperature);
            this.weatherLoaded = true;
            this.scene.restart();
        });
        return;
    }
        
        // Load appropriate level assets based on weather
        this.loadLevelAssets(this.currentLevel);

        this.load.spritesheet("pacman", "assets/images/pacman0.png", {
            frameWidth: 32, frameHeight: 32
        });
        this.load.spritesheet("pacman1", "assets/images/pacman1.png", {
            frameWidth: 32, frameHeight: 32
        });
        this.load.spritesheet("pacman2", "assets/images/pacman2.png", {
            frameWidth: 32, frameHeight: 32
        });
        this.load.spritesheet("pacman3", "assets/images/pacman3.png", {
            frameWidth: 32, frameHeight: 32
        });
        this.load.spritesheet("pacman4", "assets/images/pacman4.png", {
            frameWidth: 32, frameHeight: 32
        });

        this.load.image("dot", "assets/images/dot.png");
        
        // Load ghost images
        this.load.image("red_ghost", "assets/images/red_ghost.png");
        this.load.image("pink_ghost", "assets/images/pink_ghost.png");
        this.load.image("blue_ghost", "assets/images/blue_ghost.png");
        this.load.image("green_ghost", "assets/images/green_ghost.png");
    }

    loadLevelAssets(level) {
        switch(level) {
            case 1:
                this.load.image("Tileset generic", "assets/levels/1/Tileset generic.png");
                this.load.tilemapTiledJSON("map", "assets/levels/1/pacman-generic-map.json");
                break;
            case 2:
                this.load.image("Tileset ice & desert", "assets/levels/2/Tileset ice & desert.png");
                this.load.tilemapTiledJSON("map", "assets/levels/2/pacman-ice-map.json");
                break;
            case 3:
                this.load.image("Tileset ice & desert", "assets/levels/3/Tileset ice & desert.png");
                this.load.tilemapTiledJSON("map", "assets/levels/3/pacman-desert-map.json");
                break;
        }
    }


    create(){
        // Weather data should be loaded by now
        this.map = this.make.tilemap({ key: "map" });
         
        // Use the appropriate tileset based on current level
        let tileset;
        switch(this.currentLevel) {
            case 1:
                tileset = this.map.addTilesetImage("Tileset generic", "Tileset generic");
                break;
            case 2:
            case 3:
                tileset = this.map.addTilesetImage("Tileset ice & desert", "Tileset ice & desert");
                break;
            default:
                tileset = this.map.addTilesetImage("Tileset generic", "Tileset generic");
        }
        
        if (!tileset) {
            console.error('Failed to create tileset for level:', this.currentLevel);
            return;
        }
        
        const layer = this.map.createLayer("Tile Layer 1", tileset);
        if (!layer) {
            console.error('Failed to create layer');
            return;
        }
        
        layer.setCollisionByExclusion(-1, true);

        this.pacman = this.physics.add.sprite(240, 448, "pacman");
        this.pacman.setDisplaySize(28, 28); // Make Pacman smaller (original is 32x32)
        this.pacman.body.setSize(28, 28); // Update physics body to match
        this.anims.create({
            key: "pacmanAnim",
            frames: [
                { key: "pacman", frame: 0 },
                { key: "pacman1", frame: 0 },
                { key: "pacman2", frame: 0 },
                { key: "pacman3", frame: 0 },
                { key: "pacman4", frame: 0 }
            ],
            frameRate: 10,
            repeat: -1
        });
        this.pacman.play("pacmanAnim");
        this.physics.add.collider(this.pacman, layer);

        // Ghosts Physics Group
        this.ghostsGroup = this.physics.add.group();


        this.dots = this.physics.add.group();
        this.populateBoardAndEmpties(layer);
        this.physics.add.overlap(this.pacman, this.dots, this.eatDot, null, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.overlap(this.pacman, this.ghostsGroup, this.pacmanDies, null, this);

        
        // Initialize all ghosts
        this.initializeGhosts();
        
        // Ghost release every 5 seconds
        this.releaseFirstGhost();
        this.ghostReleaseTimer = this.time.addEvent({
            delay: 5000,
            callback: this.releaseNextGhost,
            callbackScope: this,
            repeat: 2
        });
        // Display current level info
        console.log(`Game started with Level ${this.currentLevel}`);
    }

    populateBoardAndEmpties(layer) {
    layer.forEachTile(tile => {
        if (!this.board[tile.y]) {
            this.board[tile.y] = [];
        }
        this.board[tile.y][tile.x] = tile.index;

        // Filter out areas we don't want dots in
        if (tile.y < 3 || (tile.y > 13 && tile.y < 17 && tile.x > 11 && tile.x < 16) || (tile.y == 17
            && tile.x != 6 && tile.x != 21)) {
            return;
        }
        const rightTile = this.map.getTileAt(tile.x + 1, tile.y, true, "Tile Layer 1");
        const bottomTile = this.map.getTileAt(tile.x, tile.y + 1, true, "Tile Layer 1");
        const rightBottomTile = this.map.getTileAt(tile.x + 1, tile.y + 1, true, "Tile Layer 1");

        // Change check from tile.index === -1 to tile == null OR !tile || tile.index === -1
        if ((!tile || tile.index === -1) &&
            (!rightTile || rightTile.index === -1) &&
            (!bottomTile || bottomTile.index === -1) &&
            (!rightBottomTile || rightBottomTile.index === -1)) {
            
            const x = tile.x * this.blockSize;
            const y = tile.y * this.blockSize;
            this.dots.create(x + this.blockSize / 2 + 5, y + this.blockSize / 2 + 10, "dot");
        }
    });
}

eatDot(pacman, dot){
    dot.disableBody(true, true);
}

    update(){
        // Ghost movement
        this.ghostSprites.forEach((ghost, index) => {
            if (ghost.visible && ghost.active) {
                this.updateGhostMovement(ghost, index);
            }
        });

        //pacman controls
        this.handleDirectionInput();

        if(this.dots.countActive(true) === 0){
            this.scene.pause();
            this.add.text(200, 290, "YOU WIN!!!!!", { fontSize: '32px', fill: '#fff' });
            console.log("All dots eaten! You win!");
        }
    }

    initializeGhosts() {
        // Create all 4 ghosts at the center position
        this.ghostColors.forEach((color, index) => {
            const ghost = this.physics.add.sprite(this.centerX, this.centerY, `${color}_ghost`);
            ghost.setVisible(false); // Start invisible
            ghost.setActive(false); // Start inactive
            ghost.setDisplaySize(18, 18);
            ghost.body.setSize(18, 18);
            ghost.setData('direction', 'up');
            ghost.setData('lastDirectionChange', 0);
            ghost.setData('color', color);
            
            this.ghostsGroup.add(ghost);
            this.ghostSprites.push(ghost);
        });
    }

    releaseFirstGhost() {
        if (this.ghostSprites.length > 0) {
            const ghost = this.ghostSprites[0];
            ghost.setVisible(true);
            ghost.setActive(true);
            ghost.setPosition(this.centerX, this.centerY);
            ghost.setData('direction', 'up');
            ghost.setData('lastDirectionChange', this.time.now);
            this.ghostsReleased++;
            console.log(`Released ${ghost.getData('color')} ghost!`);
        }
    }

    releaseNextGhost() {
        if (this.ghostsReleased < this.ghostSprites.length) {
            const ghost = this.ghostSprites[this.ghostsReleased];
            ghost.setVisible(true);
            ghost.setActive(true);
            ghost.setPosition(this.centerX, this.centerY);
            ghost.setData('direction', 'up');
            ghost.setData('lastDirectionChange', this.time.now);
            this.ghostsReleased++;
            console.log(`Released ${ghost.getData('color')} ghost!`);
        }
    }

    updateGhostMovement(ghost, index) {
        const currentTime = this.time.now;
        const lastChange = ghost.getData('lastDirectionChange') || 0;
        const direction = ghost.getData('direction');
        
        // Change direction every 2-4 seconds or if hitting a wall
        if (currentTime - lastChange > Phaser.Math.Between(2000, 4000) || this.isGhostBlocked(ghost, direction)) {
            const newDirection = this.getValidGhostDirection(ghost);
            ghost.setData('direction', newDirection);
            ghost.setData('lastDirectionChange', currentTime);
        }
        
        // Move ghost based on current direction
        this.moveGhost(ghost, ghost.getData('direction'));
    }

    moveGhost(ghost, direction) {
        const speed = 80;
        
        this.checkGhostTunnel(ghost);
        
        switch (direction) {
            case 'up':
                ghost.setVelocity(0, -speed);
                break;
            case 'down':
                ghost.setVelocity(0, speed);
                break;
            case 'left':
                ghost.setVelocity(-speed, 0);
                break;
            case 'right':
                ghost.setVelocity(speed, 0);
                break;
            default:
                ghost.setVelocity(0, 0);
        }
    }

    //tunnel logic
    checkGhostTunnel(ghost) {
        const mapWidth = this.map.widthInPixels;
        const tunnelY = 288;
        const tunnelTolerance = 16;
        
        // Check if ghost is in the tunnel area
        if (Math.abs(ghost.y - tunnelY) <= tunnelTolerance) {
            if (ghost.x < -10) {
                ghost.setPosition(mapWidth + 5, ghost.y);
                console.log(`${ghost.getData('color')} ghost wrapped from left to right`);
            }
            else if (ghost.x > mapWidth + 10) {
                ghost.setPosition(-5, ghost.y);
                console.log(`${ghost.getData('color')} ghost wrapped from right to left`);
            }
        }
    }

    isGhostBlocked(ghost, direction) {
        const tileSize = 16;
        const checkDistance = tileSize;
        let checkX = ghost.x;
        let checkY = ghost.y;
        
        switch (direction) {
            case 'up':
                checkY -= checkDistance;
                break;
            case 'down':
                checkY += checkDistance;
                break;
            case 'left':
                checkX -= checkDistance;
                break;
            case 'right':
                checkX += checkDistance;
                break;
        }
        
        const tunnelY = 288;
        const tunnelTolerance = 16;
        if (Math.abs(ghost.y - tunnelY) <= tunnelTolerance) {
            if ((direction === 'left' && checkX < 0) || (direction === 'right' && checkX >= this.map.widthInPixels)) {
                return false;
            }
        }
        
        // Check normal bounds
        if (checkX < 0 || checkX >= this.map.widthInPixels || checkY < 0 || checkY >= this.map.heightInPixels) {
            return true;
        }
        
        // Check if the next position would be a wall
        const tileX = Math.floor(checkX / tileSize);
        const tileY = Math.floor(checkY / tileSize);
        const tile = this.map.getTileAt(tileX, tileY);
        
        return tile && tile.collides;
    }

    // Helps Ghost not get stuck
    getValidGhostDirection(ghost) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(dir => !this.isGhostBlocked(ghost, dir));
        
        if (validDirections.length === 0) {
            ghost.setPosition(this.centerX, this.centerY - 50);
            ghost.setData('lastDirectionChange', this.time.now);
            console.log(`${ghost.getData('color')} ghost was stuck - teleported to safety`);
            return 'up';
        }
        
        // Ghost move away from center
        const distanceFromOriginalCenter = Phaser.Math.Distance.Between(ghost.x, ghost.y, this.centerX, 220);
        if (distanceFromOriginalCenter < 50) {
            if (validDirections.includes('up')) {
                return 'up';
            }
            const horizontalDirections = validDirections.filter(dir => dir === 'left' || dir === 'right');
            if (horizontalDirections.length > 0) {
                return horizontalDirections[Phaser.Math.Between(0, horizontalDirections.length - 1)];
            }
        }
        
        return validDirections[Phaser.Math.Between(0, validDirections.length - 1)];
    }

    getRandomDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        return directions[Phaser.Math.Between(0, directions.length - 1)];
    }

    getRandomHorizontalDirection() {
        const directions = ['left', 'right'];
        return directions[Phaser.Math.Between(0, 1)];
    }

    handleDirectionInput() {
        const arrowKeys = ["left", "right", "up", "down"];
        for (const key of arrowKeys){
            if(this.cursors[key].isDown) {
                if(key === "left") {
                    this.pacman.setVelocityX(-1*this.speed);
                }
                if(key === "right") {
                    this.pacman.setVelocityX(this.speed);
                }
                if(key === "up") {
                    this.pacman.setVelocityY(-1*this.speed);
                }
                if(key === "down") {
                    this.pacman.setVelocityY(this.speed);
                }
            }
        }
    }
    pacmanDies(pacman, ghost) {
        this.scene.pause();
        ghost.scene.add.text(120, 250, 'Game Over', { fontSize: '32px', fill: '#fff' });
        console.log(`Pacman was caught by ${ghost.getData('color')} ghost`);
    }
}
const config = {
    type: Phaser.AUTO,
    width: 464,
    height: 560,
    parent: "container",
    scene: Pacman,
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
}

const game = new Phaser.Game(config);