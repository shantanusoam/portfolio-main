import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import useSound from "use-sound";

// Import sound file for collision effects
const collisionSoundPath = "/rubberstring2.mp3";

const STATIC_DENSITY = 15;
const PARTICLE_SIZE = 6;
const PARTICLE_BOUNCYNESS = 0.9;
const WALL_THICKNESS = 50; // Thickness for walls
const PARTICLE_COUNT = 10; // Number of particles to create initially

export const MatterScene = ({ particleTrigger }) => {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  
  const [constraints, setContraints] = useState();
  const [scene, setScene] = useState();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sound effect for collisions
  const [playCollisionSound] = useSound(collisionSoundPath, { volume: 0.5 });

  const handleResize = () => {
    setContraints(boxRef.current.getBoundingClientRect());
  };

  useEffect(() => {
    let Engine = Matter.Engine;
    let Render = Matter.Render;
    let World = Matter.World;
    let Mouse = Matter.Mouse;
    let MouseConstraint = Matter.MouseConstraint;
    let Bodies = Matter.Bodies;
    let Events = Matter.Events;
    let Composite = Matter.Composite;

    // Create engine
    let engine = Engine.create({
      positionIterations: 6,
      velocityIterations: 4
    });
    engineRef.current = engine;

    // Create renderer
    let render = Render.create({
      element: boxRef.current,
      engine: engine,
      canvas: canvasRef.current,
      options: {
        background: "transparent",
        wireframes: false,
        showAngleIndicator: false,
        pixelRatio: window.devicePixelRatio
      }
    });

    // Get initial dimensions
    const bounds = boxRef.current.getBoundingClientRect();
    const { width, height } = bounds;

    // Create boundaries (walls and floor)
    const floor = Bodies.rectangle(width / 2, height + STATIC_DENSITY / 2, width, STATIC_DENSITY, {
      isStatic: true,
      label: "floor",
      render: {
        fillStyle: "transparent"
      }
    });

    const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, {
      isStatic: true,
      label: "leftWall",
      render: {
        fillStyle: "transparent"
      }
    });

    const rightWall = Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, {
      isStatic: true,
      label: "rightWall",
      render: {
        fillStyle: "transparent"
      }
    });

    const ceiling = Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width, WALL_THICKNESS, {
      isStatic: true,
      label: "ceiling",
      render: {
        fillStyle: "transparent"
      }
    });

    // Add all bodies to the world
    World.add(engine.world, [floor, leftWall, rightWall, ceiling]);

    // Add initial particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height / 2);
      const radius = PARTICLE_SIZE + Math.random() * PARTICLE_SIZE;
      
      const particle = Bodies.circle(x, y, radius, {
        restitution: PARTICLE_BOUNCYNESS,
        friction: 0.05,
        render: {
          fillStyle: `hsl(${Math.random() * 360}, 80%, 60%)`,
          opacity: 0.8
        }
      });
      
      World.add(engine.world, particle);
    }

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });

    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Add collision detection
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        
        // Only play sound for collisions with sufficient force
        if (pair.collision.depth > 1) {
          playCollisionSound();
        }
      }
    });

    // Run the engine and renderer
    Engine.run(engine);
    Render.run(render);

    setContraints(bounds);
    setScene(render);
    setIsInitialized(true);

    window.addEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /*eslint-disable */
  useEffect(() => {
    if (scene && constraints && isInitialized) {
      let { width, height } = constraints;
      
      // Create a new particle with random properties
      const randomX = Math.random() * width;
      const randomSize = PARTICLE_SIZE + Math.random() * PARTICLE_SIZE;
      const randomColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
      
      const newParticle = Matter.Bodies.circle(randomX, -randomSize, randomSize, {
        restitution: PARTICLE_BOUNCYNESS,
        friction: 0.05,
        frictionAir: 0.001,
        render: {
          fillStyle: randomColor,
          opacity: 0.8
        }
      });
      
      // Apply a random force to make it more dynamic
      Matter.Body.applyForce(newParticle, 
        { x: randomX, y: -randomSize }, 
        { x: (Math.random() - 0.5) * 0.01, y: 0.01 }
      );
      
      Matter.World.add(scene.engine.world, newParticle);
      
      // Clean up particles that are off-screen to prevent memory issues
      const bodies = Matter.Composite.allBodies(scene.engine.world);
      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (!body.isStatic && body.position.y > height * 2) {
          Matter.World.remove(scene.engine.world, body);
        }
      }
    }
  }, [particleTrigger, isInitialized]);
  /*eslint-enable */

  useEffect(() => {
    if (constraints && scene && isInitialized) {
      let { width, height } = constraints;

      // Dynamically update canvas and bounds
      scene.bounds.max.x = width;
      scene.bounds.max.y = height;
      scene.options.width = width;
      scene.options.height = height;
      scene.canvas.width = width;
      scene.canvas.height = height;

      // Get all boundary walls
      const bodies = Matter.Composite.allBodies(scene.engine.world);
      const walls = bodies.filter(body => body.isStatic);
      
      // Update floor position and size
      const floor = walls.find(wall => wall.label === "floor");
      if (floor) {
        Matter.Body.setPosition(floor, {
          x: width / 2,
          y: height + STATIC_DENSITY / 2
        });
        Matter.Body.setVertices(floor, [
          { x: 0, y: height },
          { x: width, y: height },
          { x: width, y: height + STATIC_DENSITY },
          { x: 0, y: height + STATIC_DENSITY }
        ]);
      }
      
      // Update left wall
      const leftWall = walls.find(wall => wall.label === "leftWall");
      if (leftWall) {
        Matter.Body.setPosition(leftWall, {
          x: -WALL_THICKNESS / 2,
          y: height / 2
        });
        Matter.Body.setVertices(leftWall, [
          { x: -WALL_THICKNESS, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: height },
          { x: -WALL_THICKNESS, y: height }
        ]);
      }
      
      // Update right wall
      const rightWall = walls.find(wall => wall.label === "rightWall");
      if (rightWall) {
        Matter.Body.setPosition(rightWall, {
          x: width + WALL_THICKNESS / 2,
          y: height / 2
        });
        Matter.Body.setVertices(rightWall, [
          { x: width, y: 0 },
          { x: width + WALL_THICKNESS, y: 0 },
          { x: width + WALL_THICKNESS, y: height },
          { x: width, y: height }
        ]);
      }
      
      // Update ceiling
      const ceiling = walls.find(wall => wall.label === "ceiling");
      if (ceiling) {
        Matter.Body.setPosition(ceiling, {
          x: width / 2,
          y: -WALL_THICKNESS / 2
        });
        Matter.Body.setVertices(ceiling, [
          { x: 0, y: -WALL_THICKNESS },
          { x: width, y: -WALL_THICKNESS },
          { x: width, y: 0 },
          { x: 0, y: 0 }
        ]);
      }
    }
  }, [scene, constraints, isInitialized]);

  return (
    <div
      ref={boxRef}
      style={{
        position: "absolute",
        overflow: "hidden",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 996
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
