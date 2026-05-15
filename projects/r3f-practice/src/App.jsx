import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, KeyboardControls, useKeyboardControls } from '@react-three/drei'
import { Vector3 } from 'three'

// 1. WASDキーの入力設定
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
]

// 計算用のベクトル（毎フレーム新しく作ると重くなるため、外で一度だけ定義します）
const direction = new Vector3()
const frontVector = new Vector3()
const sideVector = new Vector3()

// 2. プレイヤーの移動と衝突判定を制御するコンポーネント
function Player() {
  const [, getKeys] = useKeyboardControls()
  const speed = 5 // 歩くスピード

  useFrame((state, delta) => {
    const { forward, backward, left, right } = getKeys()

    // ① カメラの現在の「絶対的な向き（クォータニオン）」を取得
    const rotation = state.camera.quaternion

    // ② カメラにとっての「前」方向を計算（空を飛んだり地面に潜ったりしないようY軸成分は0にする）
    frontVector.set(0, 0, -1).applyQuaternion(rotation)
    frontVector.y = 0
    frontVector.normalize()

    // ③ カメラにとっての「右」方向を計算
    sideVector.set(1, 0, 0).applyQuaternion(rotation)
    sideVector.y = 0
    sideVector.normalize()

    // ④ 押されているキーに応じて進む量（1か0か-1）を決定
    const moveForward = Number(forward) - Number(backward)
    const moveRight = Number(right) - Number(left)

    // ⑤ 「前」と「右」のベクトルを合成して、実際に進む方向を作る
    direction.set(0, 0, 0)
    direction.addScaledVector(frontVector, moveForward)
    direction.addScaledVector(sideVector, moveRight)

    // 斜め移動時に速くならないように長さを整え、スピードと時間を掛ける
    if (direction.length() > 0) {
      direction.normalize().multiplyScalar(speed * delta)
    }

    // ⑥ 次に移動する予定の座標を計算
    const nextX = state.camera.position.x + direction.x
    const nextZ = state.camera.position.z + direction.z

    // ⑦ 壁の突き抜け防止 (±9.5でストップ)
    state.camera.position.x = Math.max(-9.5, Math.min(9.5, nextX))
    state.camera.position.z = Math.max(-9.5, Math.min(9.5, nextZ))
    
    // ⑧ 視点の高さを1.5に固定
    state.camera.position.y = 1.5
  })

  return null
}

// 3. 四角い部屋を作るコンポーネント
function Room() {
  return (
    <group>
      {/* 床 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* 壁 (奥・手前・左・右) */}
      <mesh position={[0, 2.5, -10]}><boxGeometry args={[20, 5, 1]} /><meshStandardMaterial color="lightcoral" /></mesh>
      <mesh position={[0, 2.5, 10]}><boxGeometry args={[20, 5, 1]} /><meshStandardMaterial color="lightblue" /></mesh>
      <mesh position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[20, 5, 1]} /><meshStandardMaterial color="lightgreen" /></mesh>
      <mesh position={[10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[20, 5, 1]} /><meshStandardMaterial color="lightgoldenrodyellow" /></mesh>
    </group>
  )
}

function App() {
  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        
        {/* 画面上のUI */}
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '8px' }}>
          <b>画面内をクリック</b> してスタート<br />
          [ W A S D ] - 移動<br />
          [ ESC ] - マウスロック解除
        </div>

        <Canvas camera={{ position: [0, 1.5, 0], fov: 75 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          
          <Room />
          <Player />
          
          <PointerLockControls />
        </Canvas>
      </div>
    </KeyboardControls>
  )
}

export default App