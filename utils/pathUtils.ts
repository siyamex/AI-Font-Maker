import { PathCommand, Point } from '../types';

// Convert opentype.js Path commands to our editable Command structure
// Note: opentype.js commands are slightly different from SVG standard, this bridges the gap
export const parsePathCommands = (opentypePath: any): PathCommand[] => {
  if (!opentypePath || !opentypePath.commands) return [];
  return opentypePath.commands.map((cmd: any) => {
    // Deep copy to avoid mutating the font object directly until save
    return { ...cmd };
  });
};

export const commandsToSvgPath = (commands: PathCommand[]): string => {
  return commands.map(cmd => {
    switch (cmd.type) {
      case 'M': return `M ${cmd.x} ${cmd.y}`;
      case 'L': return `L ${cmd.x} ${cmd.y}`;
      case 'Q': return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
      case 'C': return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
      case 'Z': return 'Z';
      default: return '';
    }
  }).join(' ');
};

// Simplified extraction of control points for UI
export const extractControlPoints = (commands: PathCommand[]): { x: number, y: number, type: 'on' | 'off', cmdIndex: number, key: string }[] => {
  const points: { x: number, y: number, type: 'on' | 'off', cmdIndex: number, key: string }[] = [];

  commands.forEach((cmd, i) => {
    if (cmd.type === 'M' || cmd.type === 'L') {
      if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {
        points.push({ x: cmd.x, y: cmd.y, type: 'on', cmdIndex: i, key: 'main' });
      }
    } else if (cmd.type === 'Q') {
      if (typeof cmd.x1 === 'number' && typeof cmd.y1 === 'number') {
        points.push({ x: cmd.x1, y: cmd.y1, type: 'off', cmdIndex: i, key: 'c1' });
      }
      if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {
        points.push({ x: cmd.x, y: cmd.y, type: 'on', cmdIndex: i, key: 'main' });
      }
    } else if (cmd.type === 'C') {
      if (typeof cmd.x1 === 'number' && typeof cmd.y1 === 'number') {
        points.push({ x: cmd.x1, y: cmd.y1, type: 'off', cmdIndex: i, key: 'c1' });
      }
      if (typeof cmd.x2 === 'number' && typeof cmd.y2 === 'number') {
        points.push({ x: cmd.x2, y: cmd.y2, type: 'off', cmdIndex: i, key: 'c2' });
      }
      if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {
        points.push({ x: cmd.x, y: cmd.y, type: 'on', cmdIndex: i, key: 'main' });
      }
    }
  });

  return points;
};

// Algorithmic Modifier: Jitter / Handwritten Style
export const applyJitter = (commands: PathCommand[], intensity: number): PathCommand[] => {
  const jitter = () => (Math.random() - 0.5) * intensity;
  
  return commands.map(cmd => {
    const newCmd = { ...cmd };
    if (newCmd.x !== undefined) newCmd.x += jitter();
    if (newCmd.y !== undefined) newCmd.y += jitter();
    if (newCmd.x1 !== undefined) newCmd.x1 += jitter();
    if (newCmd.y1 !== undefined) newCmd.y1 += jitter();
    if (newCmd.x2 !== undefined) newCmd.x2 += jitter();
    if (newCmd.y2 !== undefined) newCmd.y2 += jitter();
    return newCmd;
  });
};

// Algorithmic Modifier: Simple Expansion (Simulates Bold)
export const applyExpansion = (commands: PathCommand[], factor: number, glyphWidth: number, unitsPerEm: number): PathCommand[] => {
  // 1. Calculate centroid approx
  let sumX = 0, sumY = 0, count = 0;
  commands.forEach(cmd => {
    if (cmd.x !== undefined && cmd.y !== undefined) {
      sumX += cmd.x;
      sumY += cmd.y;
      count++;
    }
  });
  
  if (count === 0) return commands;
  const centerX = sumX / count;
  const centerY = sumY / count;

  return commands.map(cmd => {
    const newCmd = { ...cmd };
    const expand = (val: number | undefined, center: number) => {
      if (val === undefined) return undefined;
      return center + (val - center) * factor;
    };

    newCmd.x = expand(newCmd.x, centerX);
    newCmd.y = expand(newCmd.y, centerY);
    newCmd.x1 = expand(newCmd.x1, centerX);
    newCmd.y1 = expand(newCmd.y1, centerY);
    newCmd.x2 = expand(newCmd.x2, centerX);
    newCmd.y2 = expand(newCmd.y2, centerY);
    
    return newCmd;
  });
};

// Algorithmic Modifier: Slant (Fake Italic)
export const applySlant = (commands: PathCommand[], degrees: number): PathCommand[] => {
  // Shear transformation: x' = x + y * tan(theta)
  const rad = degrees * (Math.PI / 180);
  const tan = Math.tan(rad);

  return commands.map(cmd => {
    const newCmd = { ...cmd };
    
    const skew = (x: number | undefined, y: number | undefined) => {
        if (x === undefined || y === undefined) return x;
        return x + (y * tan);
    };

    if (newCmd.x !== undefined) newCmd.x = skew(newCmd.x, newCmd.y);
    if (newCmd.x1 !== undefined) newCmd.x1 = skew(newCmd.x1, newCmd.y1);
    if (newCmd.x2 !== undefined) newCmd.x2 = skew(newCmd.x2, newCmd.y2);
    
    return newCmd;
  });
};

// Algorithmic Modifier: Pixelate (Grid Snap)
export const applyPixelate = (commands: PathCommand[], gridSize: number): PathCommand[] => {
    const snap = (v: number | undefined) => {
        if (v === undefined) return undefined;
        return Math.round(v / gridSize) * gridSize;
    };

    return commands.map(cmd => {
        // Force curves to lines for true pixel look? 
        // For now, just snap all control points.
        const newCmd = { ...cmd };
        newCmd.x = snap(newCmd.x);
        newCmd.y = snap(newCmd.y);
        newCmd.x1 = snap(newCmd.x1);
        newCmd.y1 = snap(newCmd.y1);
        newCmd.x2 = snap(newCmd.x2);
        newCmd.y2 = snap(newCmd.y2);
        return newCmd;
    });
};

// Algorithmic Modifier: Flatten (Curves to Lines)
export const applyFlatten = (commands: PathCommand[]): PathCommand[] => {
    return commands.map(cmd => {
        if (cmd.type === 'Q' || cmd.type === 'C') {
            // Convert to Line
            return { type: 'L', x: cmd.x, y: cmd.y };
        }
        return { ...cmd };
    });
};

// Algorithmic Modifier: Axis Scale (Wide/Condensed/Thin)
export const applyAxisScale = (commands: PathCommand[], scaleX: number, scaleY: number): PathCommand[] => {
  // Calculate centroid
  let sumX = 0, sumY = 0, count = 0;
  commands.forEach(cmd => {
    if (cmd.x !== undefined && cmd.y !== undefined) {
      sumX += cmd.x;
      sumY += cmd.y;
      count++;
    }
  });
  
  if (count === 0) return commands;
  const centerX = sumX / count;
  const centerY = sumY / count;

  return commands.map(cmd => {
    const newCmd = { ...cmd };
    const scale = (val: number | undefined, center: number, factor: number) => {
      if (val === undefined) return undefined;
      return center + (val - center) * factor;
    };

    newCmd.x = scale(newCmd.x, centerX, scaleX);
    newCmd.y = scale(newCmd.y, centerY, scaleY);
    newCmd.x1 = scale(newCmd.x1, centerX, scaleX);
    newCmd.y1 = scale(newCmd.y1, centerY, scaleY);
    newCmd.x2 = scale(newCmd.x2, centerX, scaleX);
    newCmd.y2 = scale(newCmd.y2, centerY, scaleY);
    return newCmd;
  });
};

// Algorithmic Modifier: Punk (Exaggerate Curves by moving control points)
export const applyPunk = (commands: PathCommand[], intensity: number): PathCommand[] => {
    const jitter = () => (Math.random() - 0.5) * intensity;
    return commands.map(cmd => {
        const newCmd = { ...cmd };
        // Only move control points, keep anchors fixed for legibility
        if (newCmd.x1 !== undefined) newCmd.x1 += jitter();
        if (newCmd.y1 !== undefined) newCmd.y1 += jitter();
        if (newCmd.x2 !== undefined) newCmd.x2 += jitter();
        if (newCmd.y2 !== undefined) newCmd.y2 += jitter();
        return newCmd;
    });
};