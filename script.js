/*** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y2, x2, y2, x2, y2);
    ctx.stroke();
    ctx.closePath();
};
let __uuid = 0;
/*** @type {Object<number, Entity>} */
const entities = {};

class V2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {number | V2} x
     * @param {number} y
     * @returns {V2}
     */
    add(x, y) {
        if (x instanceof V2) {
            y = x.y;
            x = x.x;
        }
        return new V2(this.x + x, this.y + y);
    }

    /**
     * @param {number | V2} x
     * @param {number} y
     * @returns {V2}
     */
    subtract(x, y) {
        if (x instanceof V2) {
            y = x.y;
            x = x.x;
        }
        return new V2(this.x - x, this.y - y);
    }

    /**
     * @param {number | V2} x
     * @param {number} y
     * @returns {V2}
     */
    multiply(x, y) {
        if (x instanceof V2) {
            y = x.y;
            x = x.x;
        }
        return new V2(this.x * x, this.y * y);
    }

    /**
     * @param {number | V2} x
     * @param {number} y
     * @returns {V2}
     */
    divide(x, y) {
        if (x instanceof V2) {
            y = x.y;
            x = x.x;
        }
        return new V2(this.x / x, this.y / y);
    }

    /*** @returns {V2} */
    floor() {
        return new V2(Math.floor(this.x), Math.floor(this.y));
    }

    /*** @returns {V2} */
    round() {
        return new V2(Math.round(this.x), Math.round(this.y));
    }

    /*** @returns {V2} */
    abs() {
        return new V2(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * @param {V2} v2
     * @returns {V2}
     */
    set_position(v2) {
        this.x = v2.x;
        this.y = v2.y;
        return this;
    }

    /**
     * @param {V2} v2
     * @returns {number}
     */
    distance(v2) {
        return Math.sqrt(Math.pow(v2.x - this.x, 2) + Math.pow(v2.y - this.y, 2));
    }

    /**
     * @param {number} degrees - As degrees
     * @returns {V2}
     */
    direction_reversed(degrees) {
        return this.direction(degrees).multiply(-1, -1);
    }

    /**
     * @param {number} degrees - As degrees
     * @returns {V2}
     */
    direction(degrees) {
        return new V2(-Math.sin(((degrees - 90) * Math.PI / 180) - (Math.PI / 2)), -Math.cos(((degrees - 90) * Math.PI / 180) - (Math.PI / 2)));
    }

    /**
     * @param {V2} v2
     * @returns {number} - As degrees
     */
    look_at(v2) {
        let res = Math.atan2(v2.x - this.x, v2.y - this.y) / Math.PI * 180;
        if (res < 0) res += 360;
        return res;
    }

    motion_to(v2) {
        return this.direction(this.look_at(v2));
    }

    motion_reversed_to(v2) {
        return this.direction_reversed(this.look_at(v2));
    }
}

class Entity extends V2 {
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {number} radius
     */
    constructor(x, y, color = "#000000", radius = 10) {
        super(x, y);
        this.color = color;
        this.radius = radius;
        this.alive = true;
        this.uuid = __uuid++;
        this.ticks = 0;
        entities[this.uuid] = this;
        /*** @type {Entity[]} */
        this.connected = [];
        this.fall_momentum = 0;
    }

    /**
     * @param {Entity} entity
     * @returns {boolean}
     */
    collides(entity) {
        return this.getMiddle().distance(entity.getMiddle()) < ((entity.radius + this.radius) / 2);
    }

    /*** @param {Entity} entity */
    connect(entity) {
        this.connected.push(entity);
        entity.connected.push(this);
    }

    /*** @returns {Entity[]} */
    getCollisions() {
        return Object.values(entities)
            .filter(entity => entity.alive && entity !== this && this.collides(entity));
    }

    /*** @returns {V2} */
    getMiddle() {
        return this.add(this.radius / 2, this.radius / 2);
    }

    update() {
        this.ticks++;
        const collision = this.getCollisions()[0];
        if(collision) {
            const motion = this.getMiddle().motion_reversed_to(collision.getMiddle()).multiply(2, 2);
            this.set_position(this.add(motion.x, motion.y));
            this.fall_momentum = 0;
        }
        ctx.fillStyle = this.color || "#000000";
        const circle = new Path2D();
        circle.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2);
        ctx.fill(circle);
        this.connected.forEach(entity => ctx.drawLine(this.x, this.y, entity.x, entity.y));
    }
}

class Living extends Entity {
    update() {
        const stringAlert = this.connected
            .filter(i => i.distance(this) > 30)
            .sort((a, b) => b.distance(this) - a.distance(this))[0];
        const stringDistance = this.connected
            .filter(i => i.distance(this) > 15)
            .sort((a, b) => b.distance(this) - a.distance(this))[0];
        if (this.getCollisions()[0]) {
        } else /*if (stringAlert) {
            const motion = this.getMiddle().motion_to(stringAlert).multiply(this.distance(stringAlert.getMiddle()) - 15, this.distance(stringAlert.getMiddle()) - 15);
            this.set_position(this.add(motion.x, motion.y));
            this.fall_momentum = 0;
        } else */if (stringDistance) {
            console.log(this.getMiddle(), stringDistance.getMiddle(), this.getMiddle().motion_to(stringDistance.getMiddle()))
            const motion = this.getMiddle().motion_to(stringDistance.getMiddle());
            this.set_position(this.add(motion.x, motion.y));
            this.fall_momentum = 0;
        } else this.y += 0.5 + (this.fall_momentum += 0.01);
        super.update();
    }
}

function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Object.values(entities).filter(entity => entity.alive).forEach(entity => entity.update());
    setTimeout(render, 5);
}

render();

for (let x = 10; x < canvas.width; x += 10) {
    new Entity(x, 500)
    new Entity(x - 5, 505)
}

const a = new Entity(100, 100);

/*let last = new Entity(100, 100);
let a = new Living(110, 100);
let b = new Entity(120, 100);
last.connect(a);
b.connect(a);*/

/*let last = new Entity(100, 100);
for (let x = 111; x < 500; x += 11) {
    let now = new Living(x, 100);
    now.connect(last);
    last = now;
}
new Entity(507, 100).connect(last);*/

addEventListener("mousemove", ev => {
    const motion = a.motion_to(new V2(ev.clientX, ev.clientY))
    a.set_position(a.add(motion.x, motion.y))
})
addEventListener("click", ev => {
    a.set_position(new V2(ev.clientX, ev.clientY))
})