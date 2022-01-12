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

class Model {
    /*** @param {function(v2: V2, width: number, height: number): void} callable */
    constructor(callable) {
        this.callable = callable;
    }
}

const MODEL_GENERATOR = {
    square: color => new Model((v2, width, height) => {
        ctx.fillStyle = color || "#000000";
        ctx.fillRect(v2.x, v2.y, width, height);
    }),
    circle: color => new Model((v2, width) => {
        ctx.fillStyle = color || "#000000";
        const circle = new Path2D();
        circle.arc(v2.x, v2.y, width / 2, 0, Math.PI * 2);
        ctx.fill(circle);
    })
};

class V2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(x, y) {
        return new V2(this.x + x, this.y + y);
    }

    subtract(x, y) {
        return new V2(this.x - x, this.y - y);
    }

    multiply(x, y) {
        return new V2(this.x * x, this.y * y);
    }

    divide(x, y) {
        return new V2(this.x / x, this.y / y);
    }

    floor() {
        return new V2(Math.floor(this.x), Math.floor(this.y));
    }

    round() {
        return new V2(Math.round(this.x), Math.round(this.y));
    }

    abs() {
        return new V2(Math.abs(this.x), Math.abs(this.y));
    }

    /*** @param {V2} v2 */
    set_position(v2) {
        this.x = v2.x;
        this.y = v2.y;
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
        return new V2(-Math.cos(((degrees - 90) * Math.PI / 180) - (Math.PI / 2)), -Math.sin(((degrees - 90) * Math.PI / 180) - (Math.PI / 2)));
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

    /**
     * @param {number} currentRadius
     * @param {V2} v2
     * @param {number} radius
     */
    collides_circles(currentRadius, v2, radius) {
        return (this.add(currentRadius / 2, currentRadius / 2)).distance(v2.add(radius / 2, radius / 2)) < ((radius + currentRadius) / 2);
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
     * @param {Model} model
     * @param {number} width
     * @param {number} height
     */
    constructor(x, y, model = MODEL_GENERATOR.circle("#000000"), width = 10, height = 10) {
        super(x, y);
        this.model = model;
        this.width = width;
        this.height = height;
        this.alive = true;
        this.uuid = __uuid++;
        this.ticks = 0;
        entities[this.uuid] = this;
        /*** @type {Entity[]} */
        this.connected = [];
    }

    /*** @param {Entity} entity */
    connect(entity) {
        this.connected.push(entity);
        entity.connected.push(this);
    }

    update() {
        this.ticks++;
        this.model.callable(this, this.width, this.height);
        this.connected.forEach(entity => ctx.drawLine(this.x, this.y, entity.x, entity.y));
    }
}

class Living extends Entity {
    /**
     * @param {number} x
     * @param {number} y
     * @param {Model} model
     * @param {number} width
     * @param {number} height
     */
    constructor(x, y, model = MODEL_GENERATOR.circle("#000000"), width = 10, height = 10) {
        super(x, y, model, width, height);
        this.fall_momentum = 0;
    }

    update() {
        const ent = this.connected
                .filter(i => i.distance(this) > 15)
                .sort((a, b) => b.distance(this) - a.distance(this))[0];
        /**
         ||
         Object.values(entities)
         .find(entity => entity.alive && entity !== this && this.collides_circles(this.width, entity, entity.width));
         */
        if (ent) {
            this.set_position(this.add((this.add(this.width / 2, this.width / 2)).motion_to(ent.add(ent.width / 2, ent.width / 2)).x, this.motion_reversed_to(ent).y));
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

let last = new Entity(100, 100);
for (let x = 111; x < 500; x += 11) {
    let now = new Living(x, 100);
    now.connect(last);
    last = now;
}
new Entity(507, 100).connect(last);