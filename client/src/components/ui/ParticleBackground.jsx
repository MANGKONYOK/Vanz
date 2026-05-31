import { useEffect, useRef } from 'react';

export default function ParticleBackground({ isDarkMode }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // Setup canvas size
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        // Mouse tracking
        let mouse = { x: -1000, y: -1000, radius: 150 };
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };
        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        // Particle System
        const particlesArray = [];
        const numberOfParticles = Math.min((width * height) / 10000, 150); // Responsive amount

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.vx = (Math.random() * 0.4 - 0.2); // Gentle drift x
                this.vy = (Math.random() * 0.4 - 0.2); // Gentle drift y
                this.density = (Math.random() * 30) + 1;
            }
            draw() {
                ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.75)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
            update() {
                // Gentle drift movement
                this.baseX += this.vx;
                this.baseY += this.vy;

                // Screen boundary wrapping
                if (this.baseX < 0) { this.baseX = width; this.x = width; }
                else if (this.baseX > width) { this.baseX = 0; this.x = 0; }

                if (this.baseY < 0) { this.baseY = height; this.y = height; }
                else if (this.baseY > height) { this.baseY = 0; this.y = 0; }

                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                // Repel effect (like mini-ants scattering)
                if (distance < maxDistance) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 20;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 20;
                    }
                }
            }
        }

        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }

        // Connect particles with lines
        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) 
                                 + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    if (distance < (width/10) * (height/10)) {
                        opacityValue = 1 - (distance / 15000);
                        ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${opacityValue * 0.35})` : `rgba(0, 0, 0, ${opacityValue * 0.35})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].draw();
                particlesArray[i].update();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 z-[0] pointer-events-none opacity-85 dark:opacity-60"
        />
    );
}
