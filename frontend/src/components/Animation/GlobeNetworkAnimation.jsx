// import React, { useEffect, useRef } from 'react';

// const GlobeNetworkAnimation = () => {
//   const canvasRef = useRef(null);
  
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
    
//     // Set canvas size
//     canvas.width = 400;
//     canvas.height = 400;
    
//     // Center point
//     const centerX = canvas.width / 2;
//     const centerY = canvas.height / 2;
    
//     // Create nodes in a 3D sphere structure
//     const nodes = [];
//     const nodeCount = 50; // Increased number of nodes
//     const radius = 130;
    
//     // User icons will be placed at some nodes
//     const userIconNodes = [3, 7, 10, 15, 18, 22, 25, 30, 35, 40];
    
//     // Generate nodes in a sphere-like arrangement
//     for (let i = 0; i < nodeCount; i++) {
//       // Create points on a sphere surface using spherical coordinates
//       const phi = Math.acos(-1 + (2 * i) / nodeCount);
//       const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      
//       // Convert to cartesian coordinates for full sphere effect
//       const x = radius * Math.cos(theta) * Math.sin(phi) + centerX;
//       const y = radius * Math.sin(theta) * Math.sin(phi) + centerY;
//       const z = radius * Math.cos(phi); // Used for depth
      
//       nodes.push({
//         x,
//         y,
//         z,
//         radius: userIconNodes.includes(i) ? 10 : 4,
//         isUserIcon: userIconNodes.includes(i),
//         connections: [],
//         // Small random movement
//         dx: (Math.random() - 0.5) * 0.2,
//         dy: (Math.random() - 0.5) * 0.2,
//         dz: (Math.random() - 0.5) * 0.2,
//         rotation: Math.random() * Math.PI * 2,
//         rotationSpeed: (Math.random() - 0.5) * 0.001
//       });
//     }
    
//     // Create connections between nodes based on proximity
//     for (let i = 0; i < nodes.length; i++) {
//       for (let j = i + 1; j < nodes.length; j++) {
//         const dx = nodes[i].x - nodes[j].x;
//         const dy = nodes[i].y - nodes[j].y;
//         const dz = nodes[i].z - nodes[j].z;
//         const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
//         // Connect if within threshold distance
//         if (distance < radius * 0.9) {
//           nodes[i].connections.push(j);
//           nodes[j].connections.push(i);
//         }
//       }
//     }
    
//     // Data pulse animation
//     const pulses = [];
    
//     function createPulse() {
//       // Select a random node with connections
//       let sourceIndex;
//       do {
//         sourceIndex = Math.floor(Math.random() * nodes.length);
//       } while (nodes[sourceIndex].connections.length === 0);
      
//       const targetIndex = nodes[sourceIndex].connections[
//         Math.floor(Math.random() * nodes[sourceIndex].connections.length)
//       ];
      
//       pulses.push({
//         sourceIndex,
//         targetIndex,
//         progress: 0,
//         speed: 0.01 + Math.random() * 0.015,
//         color: `rgba(0, 150, 255, 0.8)`
//       });
//     }
    
//     // Create initial pulses
//     for (let i = 0; i < 5; i++) {
//       createPulse();
//     }
    
//     let frameCount = 0;
//     let angle = 0;
    
//     function drawUserIcon(x, y, size) {
//       // Draw a simple user icon
//       ctx.fillStyle = '#000';
//       ctx.beginPath();
//       ctx.arc(x, y, size, 0, Math.PI * 2);
//       ctx.fill();
      
//       // Head
//       ctx.fillStyle = '#fff';
//       ctx.beginPath();
//       ctx.arc(x, y - size * 0.15, size * 0.4, 0, Math.PI * 2);
//       ctx.fill();
      
//       // Body
//       ctx.beginPath();
//       ctx.arc(x, y + size * 0.35, size * 0.55, 0, Math.PI);
//       ctx.fill();
//     }
    
//     function animate() {
//       // Clear canvas
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
      
//       // Rotate the entire system slightly for 3D effect
//       angle += 0.003;
      
//       // Update node positions with slight movement
//       for (let i = 0; i < nodes.length; i++) {
//         const node = nodes[i];
        
//         // Apply small random movements
//         node.x += node.dx;
//         node.y += node.dy;
//         node.z += node.dz;
//         node.rotation += node.rotationSpeed;
        
//         // Keep nodes within bounds
//         const distFromCenter = Math.sqrt(
//           (node.x - centerX) * (node.x - centerX) + 
//           (node.y - centerY) * (node.y - centerY)
//         );
        
//         if (distFromCenter > radius * 0.75) {
//           node.dx *= -1;
//           node.dy *= -1;
//           node.dz *= -1;
//         }
//       }
      
//       // Sort nodes by z-value for proper 3D layering
//       const sortedNodes = [...nodes].sort((a, b) => a.z - b.z);
      
//       // Draw connections
//       ctx.strokeStyle = 'rgba(0, 150, 200, 0.2)';
//       ctx.lineWidth = 1;
      
//       for (let i = 0; i < sortedNodes.length; i++) {
//         const node = sortedNodes[i];
        
//         for (let j = 0; j < node.connections.length; j++) {
//           const targetNode = nodes[node.connections[j]];
          
//           // Calculate opacity based on z-position
//           const avgZ = (node.z + targetNode.z) / 2;
//           const opacity = Math.min(1, Math.max(0.1, (avgZ + radius) / (2 * radius)));
          
//           ctx.strokeStyle = `rgba(0, 150, 200, ${opacity * 0.5})`;
//           ctx.beginPath();
//           ctx.moveTo(node.x, node.y);
//           ctx.lineTo(targetNode.x, targetNode.y);
//           ctx.stroke();
//         }
//       }
      
//       // Draw nodes
//       for (let i = 0; i < sortedNodes.length; i++) {
//         const node = sortedNodes[i];
        
//         // Calculate opacity based on z-position
//         const opacity = Math.min(1, Math.max(0.2, (node.z + radius) / (2 * radius)));
        
//         if (node.isUserIcon) {
//           drawUserIcon(node.x, node.y, node.radius);
//         } else {
//           // Draw regular nodes
//       ctx.fillStyle = `rgba(0, 70, 120, ${opacity})`;
//       ctx.beginPath();
//       ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
//       ctx.fill();
//         }
//       }
      
//       // Draw and update pulses
//       for (let i = pulses.length - 1; i >= 0; i--) {
//         const pulse = pulses[i];
//         const sourceNode = nodes[pulse.sourceIndex];
//         const targetNode = nodes[pulse.targetIndex];
        
//         // Calculate position along the line
//         const x = sourceNode.x + (targetNode.x - sourceNode.x) * pulse.progress;
//         const y = sourceNode.y + (targetNode.y - sourceNode.y) * pulse.progress;
        
//         // Draw pulse
//         ctx.fillStyle = pulse.color;
//         ctx.beginPath();
//         ctx.arc(x, y, 3, 0, Math.PI * 2);
//         ctx.fill();
        
//         // Update pulse
//         pulse.progress += pulse.speed;
        
//         // Remove pulse if it reached target
//         if (pulse.progress >= 1) {
//           pulses.splice(i, 1);
          
//           // Create a new pulse
//           if (Math.random() > 0.3) {
//             createPulse();
//           }
//         }
//       }
      
//       // Create new pulse occasionally
//       frameCount++;
//       if (frameCount % 60 === 0) {
//         createPulse();
//       }
      
//       requestAnimationFrame(animate);
//     }
    
//     // Start animation
//     animate();
    
//     return () => {
//       // Cleanup if needed
//     };
//   }, []);
  
//   return (
//     <div className="globe-network-animation" style={{ 
//       position: 'absolute',
//       right: '5%',
//       top: '30%',
//       zIndex: 1,
//       opacity: 0.9,
//       pointerEvents: 'none' // So it doesn't interfere with form interaction
//     }}>
//       <canvas 
//         ref={canvasRef} 
//         style={{ 
//           width: '350px',
//           height: '350px'
//         }} 
//       />
//     </div>
//   );
// };

// export default GlobeNetworkAnimation;