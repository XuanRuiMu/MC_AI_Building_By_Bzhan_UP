import React, { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store/useStore';

const MOVE_SPEED = 6;
const JUMP_FORCE = 5.0;
const GRAVITY = -15;
const MOUSE_SENSITIVITY = 0.002;
const BASE_FLY_SPEED = 12; // Base speed at x1.0
const MIN_SPEED_LEVEL = -10; // x0.1
const MAX_SPEED_LEVEL = 10;  // x10

export default function MinecraftControls() {
    const { camera, gl } = useThree();

    // Use refs for all state to avoid re-renders
    const isFlying = useRef(false);
    const isLockedRef = useRef(false);
    const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

    // Store setters (these are stable)
    const setIsFlying = useStore(state => state.setIsFlying);
    const setIsLocked = useStore(state => state.setIsLocked);
    const setFlySpeed = useStore(state => state.setFlySpeed);
    const flySpeedRef = useRef(useStore.getState().flySpeed);

    // Subscribe to flySpeed changes (zustand default subscribe)
    useEffect(() => {
        const unsubscribe = useStore.subscribe((state) => {
            flySpeedRef.current = state.flySpeed;
        });
        return unsubscribe;
    }, []);

    // Sync store state to refs
    const storeIsFlying = useStore(state => state.isFlying);
    useEffect(() => {
        isFlying.current = storeIsFlying;
    }, [storeIsFlying]);

    // Movement state
    const velocity = useRef(new THREE.Vector3());
    const moveDirection = useRef(new THREE.Vector3());
    const lastSpaceTime = useRef(0);

    // Keys object
    const keys = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    });

    // Mouse movement handler
    const handleMouseMove = useCallback((e) => {
        // CRITICAL: Only process if pointer is actually locked
        if (document.pointerLockElement !== gl.domElement) {
            return;
        }

        // Use movementX/Y which are relative deltas in pointer lock mode
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;

        // Ignore extremely large movements (browser bugs / edge cases)
        if (Math.abs(movementX) > 300 || Math.abs(movementY) > 300) {
            console.warn('Ignoring abnormal mouse movement:', movementX, movementY);
            return;
        }

        // Get current rotation from camera
        euler.current.setFromQuaternion(camera.quaternion);

        // Apply mouse movement
        euler.current.y -= movementX * MOUSE_SENSITIVITY;
        euler.current.x -= movementY * MOUSE_SENSITIVITY;

        // Clamp vertical rotation to prevent flipping
        euler.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, euler.current.x));

        // Apply rotation back to camera
        camera.quaternion.setFromEuler(euler.current);
    }, [camera, gl.domElement]);

    // Pointer lock state change handler
    const handlePointerLockChange = useCallback(() => {
        const isLocked = document.pointerLockElement === gl.domElement;
        isLockedRef.current = isLocked;
        setIsLocked(isLocked);

        console.log('Pointer Lock State:', isLocked ? 'LOCKED' : 'UNLOCKED');

        if (isLocked) {
            // Initialize euler from current camera rotation when locking
            euler.current.setFromQuaternion(camera.quaternion);
        } else {
            // Reset keys when unlocking
            keys.current = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false
            };
        }
    }, [camera, gl.domElement, setIsLocked]);

    // Pointer lock error handler
    const handlePointerLockError = useCallback(() => {
        console.error('Pointer Lock Error - could not lock pointer');
        isLockedRef.current = false;
        setIsLocked(false);
    }, [setIsLocked]);

    // Click to request pointer lock
    const handleClick = useCallback((e) => {
        // Prevent requesting if already locked
        if (document.pointerLockElement === gl.domElement) {
            return;
        }

        console.log('Requesting Pointer Lock...');

        // Request pointer lock on the canvas element
        gl.domElement.requestPointerLock().then(() => {
            console.log('Pointer Lock request succeeded');
        }).catch((err) => {
            console.error('Pointer Lock request failed:', err);
        });
    }, [gl.domElement]);

    // Keyboard handlers
    const handleKeyDown = useCallback((e) => {
        if (!isLockedRef.current) return;

        switch (e.code) {
            case 'KeyW': keys.current.forward = true; break;
            case 'KeyS': keys.current.backward = true; break;
            case 'KeyA': keys.current.left = true; break;
            case 'KeyD': keys.current.right = true; break;
            case 'Space':
                e.preventDefault();
                keys.current.up = true;

                // IMPORTANT: Only check for double-tap on first press, not key repeat
                if (!e.repeat) {
                    const now = Date.now();
                    if (now - lastSpaceTime.current < 300) {
                        isFlying.current = !isFlying.current;
                        setIsFlying(isFlying.current);
                        velocity.current.y = 0;
                    }
                    lastSpaceTime.current = now;
                }
                break;
            case 'ShiftLeft':
                e.preventDefault();
                keys.current.down = true;
                break;
        }
    }, [setIsFlying]);

    const handleKeyUp = useCallback((e) => {
        switch (e.code) {
            case 'KeyW': keys.current.forward = false; break;
            case 'KeyS': keys.current.backward = false; break;
            case 'KeyA': keys.current.left = false; break;
            case 'KeyD': keys.current.right = false; break;
            case 'Space': keys.current.up = false; break;
            case 'ShiftLeft': keys.current.down = false; break;
        }
    }, []);

    // Speed level ref for logarithmic scaling (-10 to +10, where 0 = x1.0)
    const speedLevelRef = useRef(0);
    const speedUpdateTimeout = useRef(null);

    // Convert speed level to actual multiplier: 10^(level/10)
    const levelToSpeed = (level) => Math.pow(10, level / 10);
    const speedToLevel = (speed) => Math.round(Math.log10(speed) * 10);

    // Initialize speed level from store
    useEffect(() => {
        speedLevelRef.current = speedToLevel(useStore.getState().flySpeed);
    }, []);

    // Mouse wheel handler for adjusting fly speed (logarithmic scale)
    const handleWheel = useCallback((e) => {
        if (!isLockedRef.current) return;

        e.preventDefault();

        // Adjust level (each scroll = 1 level)
        const delta = e.deltaY > 0 ? -1 : 1;
        const newLevel = Math.max(MIN_SPEED_LEVEL, Math.min(MAX_SPEED_LEVEL, speedLevelRef.current + delta));
        speedLevelRef.current = newLevel;

        // Convert to actual speed multiplier
        const newSpeed = levelToSpeed(newLevel);

        // Update ref immediately for smooth movement
        flySpeedRef.current = newSpeed;

        // Debounce store update to reduce UI re-renders
        if (speedUpdateTimeout.current) {
            clearTimeout(speedUpdateTimeout.current);
        }
        speedUpdateTimeout.current = setTimeout(() => {
            setFlySpeed(newSpeed);
        }, 100);
    }, [setFlySpeed]);

    // Setup event listeners
    useEffect(() => {
        const canvas = gl.domElement;

        // Pointer lock events
        document.addEventListener('pointerlockchange', handlePointerLockChange);
        document.addEventListener('pointerlockerror', handlePointerLockError);

        // Mouse move - listen on document level for pointer lock
        document.addEventListener('mousemove', handleMouseMove);

        // Click on canvas to lock
        canvas.addEventListener('click', handleClick);

        // Keyboard
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Mouse wheel for speed adjustment
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            document.removeEventListener('pointerlockchange', handlePointerLockChange);
            document.removeEventListener('pointerlockerror', handlePointerLockError);
            document.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('wheel', handleWheel);

            // Exit pointer lock on unmount
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            }
        };
    }, [gl.domElement, handlePointerLockChange, handlePointerLockError, handleMouseMove, handleClick, handleKeyDown, handleKeyUp, handleWheel]);

    useFrame((state, delta) => {
        // Only move if pointer is actually locked
        if (document.pointerLockElement !== gl.domElement) return;

        // Clamp delta to prevent huge jumps
        const clampedDelta = Math.min(delta, 0.1);
        const speed = isFlying.current ? (BASE_FLY_SPEED * flySpeedRef.current) : MOVE_SPEED;

        // Get direction vectors from camera
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);

        forward.applyQuaternion(camera.quaternion);
        right.applyQuaternion(camera.quaternion);

        // ALWAYS project movement to horizontal plane (like Minecraft)
        // WASD moves on XZ plane, Space/Shift controls vertical
        forward.y = 0;
        right.y = 0;

        const forwardLen = forward.length();
        const rightLen = right.length();

        if (forwardLen > 0.001) forward.divideScalar(forwardLen);
        else forward.set(0, 0, -1);

        if (rightLen > 0.001) right.divideScalar(rightLen);
        else right.set(1, 0, 0);

        // Calculate movement
        moveDirection.current.set(0, 0, 0);
        if (keys.current.forward) moveDirection.current.add(forward);
        if (keys.current.backward) moveDirection.current.sub(forward);
        if (keys.current.left) moveDirection.current.sub(right);
        if (keys.current.right) moveDirection.current.add(right);

        const moveLen = moveDirection.current.length();
        if (moveLen > 0.001) {
            moveDirection.current.divideScalar(moveLen).multiplyScalar(speed * clampedDelta);
            camera.position.add(moveDirection.current);
        }

        // Vertical Movement
        if (isFlying.current) {
            if (keys.current.up) camera.position.y += speed * clampedDelta;
            if (keys.current.down) camera.position.y -= speed * clampedDelta;
            velocity.current.y = 0;
        } else {
            velocity.current.y += GRAVITY * clampedDelta;
            velocity.current.y = Math.max(velocity.current.y, -50);

            if (keys.current.up && camera.position.y <= 1.75) {
                velocity.current.y = JUMP_FORCE;
            }
            camera.position.y += velocity.current.y * clampedDelta;

            if (camera.position.y < 1.7) {
                camera.position.y = 1.7;
                velocity.current.y = 0;
            }
        }
    });

    return null;
}
