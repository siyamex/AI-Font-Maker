import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment, Stage, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PathCommand } from '../types';

interface Glyph3DViewerProps {
  commands: PathCommand[];
  depth: number;
  color: string;
}

const GlyphMesh: React.FC<{ commands: PathCommand[], depth: number, color: string }> = ({ commands, depth, color }) => {
  const shapes = useMemo(() => {
    // Convert our PathCommands to a THREE.ShapePath, then to THREE.Shape[]
    const shapePath = new THREE.ShapePath();

    commands.forEach(cmd => {
      switch (cmd.type) {
        case 'M':
          if (cmd.x !== undefined && cmd.y !== undefined) 
            shapePath.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          if (cmd.x !== undefined && cmd.y !== undefined) 
            shapePath.lineTo(cmd.x, cmd.y);
          break;
        case 'Q':
          if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x !== undefined && cmd.y !== undefined)
            shapePath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          break;
        case 'C':
          if (cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined && cmd.x !== undefined && cmd.y !== undefined)
            shapePath.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          break;
        case 'Z':
          // shapePath does not have a close() method like Path, but subsequent moveTo handles subpaths.
          // We rely on toShapes() to close properly.
          break;
      }
    });

    // Converting to shapes: isCCW = true usually works for standard fonts to differentiate holes
    // Font coordinates are often "correctly" wound by fontTools/opentype.js
    return shapePath.toShapes(true);
  }, [commands]);

  const extrudeSettings = useMemo(() => ({
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.05,
    bevelSize: depth * 0.05,
    bevelSegments: 4,
    curveSegments: 12
  }), [depth]);

  if (!shapes || shapes.length === 0) return null;

  return (
    <Center>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shapes, extrudeSettings]} />
        <meshStandardMaterial 
            color={color} 
            roughness={0.2} 
            metalness={0.6}
            emissive={color}
            emissiveIntensity={0.1}
        />
      </mesh>
    </Center>
  );
};

const Glyph3DViewer: React.FC<Glyph3DViewerProps> = ({ commands, depth, color }) => {
  return (
    <Canvas shadows camera={{ position: [0, 0, 800], fov: 45 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.5} contactShadow={false}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
             <GlyphMesh commands={commands} depth={depth} color={color} />
          </Float>
        </Stage>
        <OrbitControls makeDefault />
      </Suspense>
    </Canvas>
  );
};

export default Glyph3DViewer;