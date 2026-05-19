import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
// OrbitControlsは開発中の視点移動に便利ですが、本番では固定カメラにするためコメントアウトしています
import { OrbitControls } from '@react-three/drei';

// マップのサイズ（奇数にすると中心が0,0になります）
const MAP_SIZE = 5;
// 中心からのオフセット（5x5なら -2 から +2 の範囲）
const OFFSET = Math.floor(MAP_SIZE / 2);

// --- プレイヤーコンポーネント ---
const Player = ({ position }) => {
  return (
    // position[0]がX軸(左右)、position[1]がZ軸(奥・手前)。Y軸(高さ)は0.5で固定
    <mesh position={[position[0], 0.5, position[1]]}>
      <boxGeometry args={[0.8, 1, 0.8]} />
      {/* ボンバーマンっぽく、自己発光(emissive)で少し光らせてサイバーな見た目に */}
      <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={0.5} />
    </mesh>
  );
};

// --- マップ（床）コンポーネント ---
const Map = () => {
  const tiles = [];
  
  // -2 から +2 までループを回して 5x5 = 25マスの床を生成
  for (let z = -OFFSET; z <= OFFSET; z++) {
    for (let x = -OFFSET; x <= OFFSET; x++) {
      // チェス盤のように色を交互に変えて見やすくする
      const isEven = (Math.abs(x) + Math.abs(z)) % 2 === 0;
      const tileColor = isEven ? "#333333" : "#444444";

      tiles.push(
        <mesh key={`${x}-${z}`} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial color={tileColor} />
        </mesh>
      );
    }
  }
  return <>{tiles}</>;
};

// --- メインアプリケーション ---
export default function App() {
  // プレイヤーの座標状態 [x, z] （初期値は中心の [0, 0]）
  const [playerPosition, setPlayerPosition] = useState([0, 0]);

  // キーボード入力の監視
  useEffect(() => {
    const handleKeyDown = (e) => {
      setPlayerPosition((prev) => {
        let [x, z] = prev;

        // 十字キーまたはWASDで座標を更新
        if (e.key === 'ArrowUp' || e.key === 'w') z -= 1;     // 奥へ
        if (e.key === 'ArrowDown' || e.key === 's') z += 1;   // 手前へ
        if (e.key === 'ArrowLeft' || e.key === 'a') x -= 1;   // 左へ
        if (e.key === 'ArrowRight' || e.key === 'd') x += 1;  // 右へ

        // マップの外（-2 ～ +2の範囲外）に出ないようにクランプ（制限）する
        x = Math.max(-OFFSET, Math.min(OFFSET, x));
        z = Math.max(-OFFSET, Math.min(OFFSET, z));

        return [x, z];
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    // クリーンアップ関数（コンポーネントのアンマウント時にイベントを削除）
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* カメラを斜め上(y:6, z:6)に配置し、クォータービュー（見下ろし）にする */}
      <Canvas camera={{ position: [0, 6, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* ステージとプレイヤーの描画 */}
        <Map />
        <Player position={playerPosition} />
        
        {<OrbitControls />}
      </Canvas>
    </div>
  );
}