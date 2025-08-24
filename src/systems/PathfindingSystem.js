export class PathfindingSystem {
  static findPath(map, startX, startY, endX, endY, maxTime = 100) {
    const startTime = Date.now();
    const mapHeight = map.length;
    const mapWidth = map[0].length;

    // Validate coordinates
    if (!this.isValidPosition(map, startX, startY)
        || !this.isValidPosition(map, endX, endY)) {
      return [];
    }

    // If destination is not passable (except for castle tiles which are valid targets), return empty path
    if (!map[endY][endX].isPassable() && !map[endY][endX].castle) {
      return [];
    }

    // A* algorithm implementation
    const openSet = [];
    const closedSet = new Set();
    const gScore = {};
    const fScore = {};
    const cameFrom = {};

    const startKey = `${startX},${startY}`;
    const endKey = `${endX},${endY}`;

    // Initialize start node
    gScore[startKey] = 0;
    fScore[startKey] = this.heuristic(startX, startY, endX, endY);
    openSet.push({ x: startX, y: startY, f: fScore[startKey] });

    while (openSet.length > 0) {
      // Check timeout
      if (Date.now() - startTime > maxTime) {
        break;
      }

      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = `${current.x},${current.y}`;

      // Reached goal
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(cameFrom, currentKey, startX, startY);
      }

      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getNeighbors(current.x, current.y, mapWidth, mapHeight);

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey) || (!map[neighbor.y][neighbor.x].isPassable() && !map[neighbor.y][neighbor.x].castle)) {
          continue;
        }

        const tentativeGScore = gScore[currentKey] + 1;

        const existingOpenNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);
        if (!existingOpenNode) {
          // New node
          gScore[neighborKey] = tentativeGScore;
          fScore[neighborKey] = tentativeGScore + this.heuristic(neighbor.x, neighbor.y, endX, endY);
          cameFrom[neighborKey] = currentKey;
          openSet.push({ x: neighbor.x, y: neighbor.y, f: fScore[neighborKey] });
        } else if (tentativeGScore < gScore[neighborKey]) {
          // Better path found
          gScore[neighborKey] = tentativeGScore;
          fScore[neighborKey] = tentativeGScore + this.heuristic(neighbor.x, neighbor.y, endX, endY);
          cameFrom[neighborKey] = currentKey;
          existingOpenNode.f = fScore[neighborKey];
        }
      }
    }

    return []; // No path found
  }

  static isValidPosition(map, x, y) {
    return x >= 0 && x < map[0].length && y >= 0 && y < map.length;
  }

  static heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance
  }

  static getNeighbors(x, y, width, height) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 }, // Right
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
    ];

    for (const dir of directions) {
      const newX = x + dir.x;
      const newY = y + dir.y;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  static reconstructPath(cameFrom, currentKey, startX, startY) {
    const path = [];
    let current = currentKey;

    while (current) {
      const [x, y] = current.split(',').map(Number);
      if (x !== startX || y !== startY) { // Don't include start position
        path.unshift({ x, y });
      }
      current = cameFrom[current];
    }

    return path;
  }
}
