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
    }

    preload(){
        this.load.image("Tileset generic", "assets/levels/1/Tileset generic.png");
        this.load.tilemapTiledJSON("map", "assets/levels/1/pacman-generic-map.json");
        
        // Load ghost images
        this.load.image("red_ghost", "assets/images/red_ghost.png");
        this.load.image("pink_ghost", "assets/images/pink_ghost.png");
        this.load.image("blue_ghost", "assets/images/blue_ghost.png");
        this.load.image("green_ghost", "assets/images/green_ghost.png");
    }

    create(){
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage("Tileset generic");
        const layer = this.map.createLayer("Tile Layer 1", tileset);
        layer.setCollisionByExclusion(-1, true);

        // Ghosts Physics Group
        this.ghostsGroup = this.physics.add.group();
        
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
    }

    update(){
        // Ghost movement
        this.ghostSprites.forEach((ghost, index) => {
            if (ghost.visible && ghost.active) {
                this.updateGhostMovement(ghost, index);
            }
        });
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