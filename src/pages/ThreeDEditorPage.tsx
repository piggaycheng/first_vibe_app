import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useRef, useState } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import type { Mesh } from 'three';

function RotatingBox(props: any) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const theme = useTheme();

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
    }
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? theme.palette.secondary.main : theme.palette.primary.main} />
    </mesh>
  );
}

export default function ThreeDEditorPage() {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          3D Editor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Interactive 3D Scene Editor
        </Typography>
      </Paper>

      <Paper 
        elevation={3} 
        sx={{ 
          height: '70vh', // 固定高度防止 Canvas 無限擴張
          overflow: 'hidden', 
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#000' : '#f0f0f0' 
        }}
      >
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
          
          <RotatingBox position={[0, 0, 0]} />
          
          <Grid 
            position={[0, -2, 0]} 
            args={[10.5, 10.5]} 
            cellSize={0.5} 
            cellThickness={0.5} 
            cellColor="#6f6f6f" 
            sectionSize={3} 
            sectionThickness={1} 
            sectionColor="#9d4b4b" 
            fadeDistance={30} 
            fadeStrength={1} 
            followCamera={false} 
            infiniteGrid={true}
          />
          
          <OrbitControls makeDefault />
        </Canvas>
      </Paper>
    </Box>
  );
}
