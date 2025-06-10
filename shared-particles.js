// Shared particle system functionality

// Enhanced particle system
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 300;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        
        // Random particle type
        const types = ['particle-small', 'particle-medium', 'particle-large'];
        const typeWeights = [0.6, 0.3, 0.1]; // More small particles
        
        let randomType = 'particle-small';
        const rand = Math.random();
        if (rand > typeWeights[0] + typeWeights[1]) {
            randomType = 'particle-large';
        } else if (rand > typeWeights[0]) {
            randomType = 'particle-medium';
        }
        
        particle.className = `particle ${randomType}`;
        particle.style.left = Math.random() * 100 + '%';
        
        // Fix particles appearing at top - start them below viewport
        const initialDelay = Math.random() * 20 + 's'; // Spread out over 20 seconds
        particle.style.animationDelay = initialDelay;
        
        // Store the base duration for each particle type
        const baseDuration = Math.random() * 4 + 4; // 4-8 seconds
        particle.style.animationDuration = baseDuration + 's';
        particle.dataset.baseDuration = baseDuration; // Store original duration
        
        particlesContainer.appendChild(particle);
        
        // Set initial very slow speed for loading state
        setTimeout(() => {
            const animations = particle.getAnimations();
            if (animations.length > 0) {
                animations[0].playbackRate = 0.05; // Very slow initially
                particle.dataset.currentRate = 0.05;
            }
        }, 100);
    }
}

// Control particle speed based on train status (for index.html)
function updateParticleSpeed(status) {
    const particles = document.querySelectorAll('.particle');
    
    // Define speed multipliers based on status
    let targetSpeedMultiplier = 1;
    
    if (status.main.includes('at ')) {
        targetSpeedMultiplier = 0.1; // Much slower when at station
    } else if (status.main.includes('approaching ')) {
        targetSpeedMultiplier = 0.5; // Medium speed when approaching
    } else if (status.main.includes('departing ')) {
        targetSpeedMultiplier = 1; // Normal speed when departing
    } else if (status.main.includes('between ')) {
        targetSpeedMultiplier = 3; // Even faster when traveling between stations
    } else if (status.main.includes('on break') || status.main.includes('not on the DLR')) {
        targetSpeedMultiplier = 0.05; // Very slow when not working
    }
    
    particles.forEach(particle => {
        // Get all animations on this particle
        const animations = particle.getAnimations();
        
        if (animations.length > 0) {
            const animation = animations[0]; // Get the floatUp animation
            
            // Get current playback rate or default to 1
            const currentRate = particle.dataset.currentRate ? parseFloat(particle.dataset.currentRate) : 1;
            
            // Store transition data
            particle.dataset.targetRate = targetSpeedMultiplier;
            particle.dataset.startRate = currentRate;
            particle.dataset.transitionStart = Date.now();
            
            // Clear any existing transition
            if (particle.rateTransition) {
                clearInterval(particle.rateTransition);
            }
            
            // Smooth transition over 10 seconds
            particle.rateTransition = setInterval(() => {
                const elapsed = Date.now() - parseFloat(particle.dataset.transitionStart);
                const duration = 10000; // 10 seconds
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease-out function
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                const startRate = parseFloat(particle.dataset.startRate);
                const targetRate = parseFloat(particle.dataset.targetRate);
                const currentRate = startRate + (targetRate - startRate) * easedProgress;
                
                // Update playback rate smoothly
                animation.playbackRate = currentRate;
                particle.dataset.currentRate = currentRate;
                
                // Clean up when done
                if (progress >= 1) {
                    clearInterval(particle.rateTransition);
                    particle.rateTransition = null;
                }
            }, 50); // Update every 50ms for smooth transition
        }
    });
}