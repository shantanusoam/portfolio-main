// EnhancedPhysicsSimulation.tsx - An interactive physics playground with custom cursor and game elements
// ----------------------------------------------------------------------------------------------
// • Custom physics-based cursor using Matter.js
// • Interactive elements that react to collisions
// • "Angry Birds"-like mini-game triggered by a glowing bird icon
// • Smooth animations using anime.js
// • Styled using Emotion for custom components
// ----------------------------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import Matter, {
  Engine, 
  Render, 
  Runner, 
  Bodies, 
  Body, 
  World, 
  Composite, 
  Mouse, 
  MouseConstraint,
  Events,
  Vector,
  Constraint,
  Query
} from 'matter-js';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import useSound from 'use-sound';
import anime from 'animejs';
import { GiBirdTwitter } from 'react-icons/gi';
import { IoMdClose } from 'react-icons/io';

// Types
interface EnhancedPhysicsSimulationProps {
  /** Increment this value to drop a new particle */
  particleTrigger?: number;
}

// Configuration
const WALL_THICKNESS = 50;
const CURSOR_SIZE = 20;
const CURSOR_COLOR = '#3498db';
const COLLISION_SOUND_SRC = '/rubberstring2.mp3';
const BIRD_SOUND_SRC = '/bird_sound.mp3'; // You might need to add this sound file
const TEXT_ELEMENTS = [
  { text: 'Drag Me', x: 40, y: 30, size: 25 },
  { text: 'Bounce Me', x: 60, y: 40, size: 30 },
  { text: 'Throw Me', x: 30, y: 60, size: 35 },
];

// Animation - Pulse effect for the bird icon
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(66, 220, 219, 0.7);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(66, 220, 219, 0);
    transform: scale(1.1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 220, 219, 0);
    transform: scale(1);
  }
`;

// Styled Components
const PlaygroundContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  cursor: none; /* Hide default cursor */
`;

const BirdButton = styled.button`
  position: fixed;
  top: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(66, 220, 219, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  z-index: 1000;
  cursor: pointer;
  color: #00eeff;
  font-size: 30px;
  animation: ${pulse} 2s infinite;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(66, 220, 219, 0.4);
    transform: scale(1.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(66, 220, 219, 0.5);
  }
`;

const CloseButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  z-index: 1001;
  cursor: pointer;
  color: white;
  font-size: 24px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
`;

const GameInstructions = styled.div`
  position: absolute;
  bottom: 30px;
  left: 30px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 16px;
  max-width: 300px;
  z-index: 999;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// The main component
const EnhancedPhysicsSimulation: React.FC<EnhancedPhysicsSimulationProps> = ({ 
  particleTrigger = 0 
}) => {
  // Refs for DOM elements and Matter.js instances
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const renderRef = useRef<Render | null>(null);
  const cursorRef = useRef<Body | null>(null);
  const mouseConstraintRef = useRef<MouseConstraint | null>(null);
  const textBodiesRef = useRef<Body[]>([]);
  const slingRef = useRef<{ point: Vector, body: Body | null, constraint: Constraint | null }>({
    point: Vector.create(0, 0),
    body: null,
    constraint: null
  });
  const gameTargetsRef = useRef<Body[]>([]);

  // State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGameMode, setIsGameMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Sound effects
  const [playCollision] = useSound(COLLISION_SOUND_SRC, {
    volume: 0.5,
    interrupt: false,
  });
  
  const [playBirdSound] = useSound(BIRD_SOUND_SRC, {
    volume: 0.5,
  });

  // Helper: Create walls around the container
  const createWalls = (width: number, height: number) => {
    if (!engineRef.current) return;
    
    const wallOptions = { 
      isStatic: true, 
      render: { 
        fillStyle: 'transparent',
        strokeStyle: 'rgba(255, 255, 255, 0.1)',
        lineWidth: 1
      } 
    };

    const floor = Bodies.rectangle(
      width / 2, 
      height + WALL_THICKNESS / 2, 
      width, 
      WALL_THICKNESS, 
      wallOptions
    );
    
    const ceiling = Bodies.rectangle(
      width / 2, 
      -WALL_THICKNESS / 2, 
      width, 
      WALL_THICKNESS, 
      wallOptions
    );
    
    const leftWall = Bodies.rectangle(
      -WALL_THICKNESS / 2, 
      height / 2, 
      WALL_THICKNESS, 
      height, 
      wallOptions
    );
    
    const rightWall = Bodies.rectangle(
      width + WALL_THICKNESS / 2, 
      height / 2, 
      WALL_THICKNESS, 
      height, 
      wallOptions
    );

    World.add(engineRef.current.world, [floor, ceiling, leftWall, rightWall]);
  };

  // Helper: Create interactive text bodies
  const createTextBodies = (width: number, height: number) => {
    if (!engineRef.current) return;
    
    // Clear any existing text bodies
    if (textBodiesRef.current.length > 0) {
      World.remove(engineRef.current.world, textBodiesRef.current);
      textBodiesRef.current = [];
    }
    
    // Create new text bodies
    TEXT_ELEMENTS.forEach(({ text, x, y, size }) => {
      const textBody = Bodies.rectangle(
        width * (x / 100), 
        height * (y / 100), 
        text.length * size * 0.6, 
        size * 1.5, 
        {
          restitution: 0.7,
          friction: 0.1,
          frictionAir: 0.01,
          chamfer: { radius: 5 },
          render: {
            fillStyle: '#f39c12',
            strokeStyle: '#e67e22',
            lineWidth: 2,
            // We'll use the label to identify this as a text body
            text: {
              content: text,
              color: '#fff',
              size: size,
              family: 'Arial'
            }
          }
        }
      );
      
      textBodiesRef.current.push(textBody);
    });
    
    World.add(engineRef.current.world, textBodiesRef.current);
  };

  // Helper: Create the cursor ball
  const createCursorBall = () => {
    if (!engineRef.current) return;
    
    const cursorBall = Bodies.circle(
      100, 
      100, 
      CURSOR_SIZE, 
      {
        restitution: 0.7,
        friction: 0.1,
        frictionAir: 0.01,
        render: {
          fillStyle: CURSOR_COLOR,
          strokeStyle: '#2980b9',
          lineWidth: 2
        },
        label: 'cursor',
        // Make it a sensor so it can detect collisions without physical response
        isSensor: true,
        // Allow cursor to be interactive
        isStatic: false,
        // Make cursor more responsive
        density: 0.01,
        // Let's tag this as a cursor to identify it easily
        plugin: {
          isCursor: true
        }
      }
    );
    
    cursorRef.current = cursorBall;
    World.add(engineRef.current.world, cursorBall);
  };

  // Helper: Setup the game mode
  const setupGameMode = (width: number, height: number) => {
    if (!engineRef.current || !cursorRef.current) return;
    
    // Remove existing text bodies
    if (textBodiesRef.current.length > 0) {
      World.remove(engineRef.current.world, textBodiesRef.current);
      textBodiesRef.current = [];
    }
    
    // Disable the regular mouse constraint
    if (mouseConstraintRef.current) {
      World.remove(engineRef.current.world, mouseConstraintRef.current);
      mouseConstraintRef.current = null;
    }
    
    // Create slingshot base
    const slingshotPoint = Vector.create(width * 0.2, height * 0.7);
    slingRef.current.point = slingshotPoint;
    
    // Create targets (like boxes to knock down)
    const targets = [];
    for (let i = 0; i < 8; i++) {
      const size = 40 + Math.random() * 30;
      const x = width * 0.7 + (Math.random() * 0.2 * width);
      const y = height * 0.7 - (i * 60);
      
      const target = Bodies.rectangle(
        x, 
        y, 
        size, 
        size, 
        {
          restitution: 0.3,
          friction: 0.1,
          frictionAir: 0.01,
          render: {
            fillStyle: i % 2 === 0 ? '#e74c3c' : '#3498db',
            strokeStyle: '#2c3e50',
            lineWidth: 2
          }
        }
      );
      
      targets.push(target);
    }
    
    gameTargetsRef.current = targets;
    World.add(engineRef.current.world, targets);
    
    // Create a new projectile (bird)
    resetSlingshot();
    
    // Show game instructions
    setShowInstructions(true);
    setTimeout(() => setShowInstructions(false), 5000);
  };

  // Helper: Reset the slingshot with a new projectile
  const resetSlingshot = () => {
    if (!engineRef.current) return;
    
    // Remove old projectile and constraint
    if (slingRef.current.body) {
      World.remove(engineRef.current.world, slingRef.current.body);
    }
    if (slingRef.current.constraint) {
      World.remove(engineRef.current.world, slingRef.current.constraint);
    }
    
    // Create new projectile (bird)
    const projectile = Bodies.circle(
      slingRef.current.point.x, 
      slingRef.current.point.y, 
      25, 
      {
        restitution: 0.7,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.004,
        render: {
          fillStyle: '#e74c3c',
          strokeStyle: '#c0392b',
          lineWidth: 2,
          sprite: {
            texture: '/angry_bird.png', // You'll need to add this image
            xScale: 0.5,
            yScale: 0.5
          }
        },
        label: 'projectile'
      }
    );
    
    // Create elastic constraint (the slingshot band)
    const constraint = Constraint.create({
      pointA: slingRef.current.point,
      bodyB: projectile,
      stiffness: 0.01,
      damping: 0.1,
      render: {
        visible: true,
        lineWidth: 2,
        strokeStyle: '#e74c3c'
      }
    });
    
    slingRef.current.body = projectile;
    slingRef.current.constraint = constraint;
    
    World.add(engineRef.current.world, [projectile, constraint]);
  };

  // Initialize the physics world
  useEffect(() => {
    if (!containerRef.current || engineRef.current) return;
    
    // Get container dimensions
    const bounds = containerRef.current.getBoundingClientRect();
    const { width, height } = bounds;
    
    // Create engine
    const engine = Engine.create({
      velocityIterations: 8,
      positionIterations: 8,
    });
    engineRef.current = engine;
    
    // Create renderer
    const render = Render.create({
      element: containerRef.current,
      engine,
      canvas: canvasRef.current!,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        showSleeping: false,
        showAngleIndicator: false,
        pixelRatio: window.devicePixelRatio,
      }
    });
    renderRef.current = render;
    
    // Create runner
    const runner = Runner.create();
    runnerRef.current = runner;
    
    // Setup walls
    createWalls(width, height);
    
    // Create the cursor ball
    createCursorBall();
    
    // Create interactive text elements
    createTextBodies(width, height);
    
    // Create mouse object and constraint
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    
    mouseConstraintRef.current = mouseConstraint;
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;
    
    // Handle collisions
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Check if the cursor hits a text body
        const isCursorCollision = 
          (bodyA === cursorRef.current || bodyB === cursorRef.current) && 
          pair.collision.depth > 1;
          
        if (isCursorCollision) {
          // Play collision sound
          playCollision();
          
          // Find the text body in the collision
          const textBody = bodyA === cursorRef.current ? bodyB : bodyA;
          
          // Apply a force to make it bounce
          const force = Vector.mult(
            Vector.normalise(Vector.sub(textBody.position, cursorRef.current!.position)),
            0.05
          );
          Body.applyForce(textBody, textBody.position, force);
          
          // Apply visual effect using anime.js
          anime({
            targets: `#text-${textBody.id}`,
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
            duration: 500,
            easing: 'easeOutElastic(1, .5)'
          });
        }
        
        // Check if a projectile hits a target in game mode
        if (isGameMode && 
            ((bodyA === slingRef.current.body && gameTargetsRef.current.includes(bodyB)) || 
             (bodyB === slingRef.current.body && gameTargetsRef.current.includes(bodyA)))) {
          playCollision();
          
          // Check if we need to reset the slingshot (when the projectile stops)
          setTimeout(() => {
            if (slingRef.current.body && 
                Vector.magnitude(slingRef.current.body.velocity) < 0.5) {
              resetSlingshot();
            }
          }, 3000);
        }
      });
    });
    
    // Handle mouse up event for slingshot in game mode
    Events.on(mouse, 'mouseup', (event) => {
      if (isGameMode && slingRef.current.body && slingRef.current.constraint) {
        // Release the projectile
        setTimeout(() => {
          if (slingRef.current.constraint) {
            World.remove(engine.world, slingRef.current.constraint);
            slingRef.current.constraint = null;
            
            // Play bird sound
            playBirdSound();
            
            // Check if we need to reset after a while
            setTimeout(() => {
              if (slingRef.current.body &&
                  (Vector.magnitude(slingRef.current.body.velocity) < 0.5 ||
                   slingRef.current.body.position.y > height)) {
                resetSlingshot();
              }
            }, 4000);
          }
        }, 20);
      }
    });
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !renderRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Update renderer
      render.options.width = width;
      render.options.height = height;
      render.canvas.width = width;
      render.canvas.height = height;
      
      // Recreate walls for new dimensions
      World.clear(engine.world, false);
      createWalls(width, height);
      
      // Recreate interactive elements
      if (isGameMode) {
        setupGameMode(width, height);
      } else {
        createTextBodies(width, height);
        
        // Restore cursor and mouse constraint
        if (cursorRef.current) {
          World.add(engine.world, cursorRef.current);
        } else {
          createCursorBall();
        }
        
        if (mouseConstraintRef.current) {
          World.add(engine.world, mouseConstraintRef.current);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start the simulation
    Render.run(render);
    Runner.run(runner, engine);
    
    // Update cursor position to follow the mouse
    Events.on(mouseConstraint, 'mousemove', (event) => {
      if (!cursorRef.current) return;
      
      // Smoothly move the cursor ball to the mouse position
      Body.setPosition(cursorRef.current, event.mouse.position);
      
      // In game mode, handle dragging the projectile
      if (isGameMode && slingRef.current.body && slingRef.current.constraint) {
        const mousePosition = event.mouse.position;
        
        // Check if mouse is near the projectile
        const distance = Vector.magnitude(
          Vector.sub(mousePosition, slingRef.current.body.position)
        );
        
        if (distance < 50) {
          Body.setPosition(slingRef.current.body, {
            x: mousePosition.x,
            y: mousePosition.y
          });
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      
      if (renderRef.current) {
        Render.stop(renderRef.current);
      }
      
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
      }
    };
  }, [playCollision, playBirdSound, isGameMode]);

  // Toggle full screen and game mode
  const handleToggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
    
    // If entering full screen, wait for animation then setup game mode
    if (!isFullScreen) {
      setTimeout(() => {
        setIsGameMode(true);
        
        // Setup game mode
        if (containerRef.current && engineRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setupGameMode(width, height);
        }
      }, 600);
    } else {
      // If exiting, immediately exit game mode
      setIsGameMode(false);
      
      // Reset to normal mode
      if (containerRef.current && engineRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        // Clear world
        World.clear(engineRef.current.world, false);
        
        // Recreate walls
        createWalls(width, height);
        
        // Recreate text bodies
        createTextBodies(width, height);
        
        // Recreate cursor
        createCursorBall();
        
        // Recreate mouse constraint
        const mouse = Mouse.create(renderRef.current!.canvas);
        const mouseConstraint = MouseConstraint.create(engineRef.current, {
          mouse,
          constraint: {
            stiffness: 0.2,
            render: { visible: false }
          }
        });
        
        mouseConstraintRef.current = mouseConstraint;
        World.add(engineRef.current.world, mouseConstraint);
        renderRef.current!.mouse = mouse;
      }
    }
  };

  // Handle ESC key press to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        handleToggleFullScreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  return (
    <>
      <PlaygroundContainer
        ref={containerRef}
        style={{
          position: isFullScreen ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: isFullScreen ? '100vh' : '100%',
          backgroundColor: isFullScreen ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
          zIndex: isFullScreen ? 9999 : 996,
          transition: 'all 0.6s ease-in-out',
        }}
        aria-hidden="true" // Not part of content flow for screen readers
      >
        <canvas ref={canvasRef} />
        
        {!isFullScreen && (
          <BirdButton 
            onClick={handleToggleFullScreen}
            aria-label="Open interactive game"
            title="Click to open physics game"
          >
            <GiBirdTwitter />
          </BirdButton>
        )}
        
        {isFullScreen && (
          <CloseButton
            onClick={handleToggleFullScreen}
            aria-label="Close game"
            title="Close game"
          >
            <IoMdClose />
          </CloseButton>
        )}
        
        <GameInstructions className={showInstructions ? 'visible' : ''}>
          Pull the red bird and release to launch it at the targets.
          Try to knock down all the blocks! Press ESC to exit.
        </GameInstructions>
      </PlaygroundContainer>
    </>
  );
};

// Export both the enhanced component and the original MatterScene
export { EnhancedPhysicsSimulation };

// Re-export the original MatterScene for backward compatibility
import MatterScene from './PhysicsSimulation';
export { MatterScene };
