export class Unit {
  constructor(factionId, count = 1) {
    this.factionId = factionId;
    this.count = count;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isMoving = false;
    this.path = [];
    this.pathIndex = 0;
    this.speed = 1.0; // Will be multiplied by faction speed
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  setPath(path) {
    this.path = path;
    this.pathIndex = 0;
    this.isMoving = path.length > 0;
    if (this.isMoving) {
      this.targetX = path[0].x;
      this.targetY = path[0].y;
    }
  }

  update(deltaTime, factionSpeed) {
    if (!this.isMoving || this.path.length === 0) {
      return false;
    }

    const actualSpeed = this.speed * factionSpeed;
    const target = this.path[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      // Reached current target
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;

      if (this.pathIndex >= this.path.length) {
        // Reached final destination
        this.isMoving = false;
        this.path = [];
        return true; // Movement complete
      }
      // Move to next target
      this.targetX = this.path[this.pathIndex].x;
      this.targetY = this.path[this.pathIndex].y;
    } else {
      // Move towards current target
      const moveDistance = actualSpeed * deltaTime / 1000;
      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
    }

    return false;
  }
}
