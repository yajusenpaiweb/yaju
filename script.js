document.addEventListener("DOMContentLoaded", () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.fade-in-up');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Add mouse move parallax effect to background orbs
    document.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.glow-orb');
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        
        orbs.forEach((orb, index) => {
            const factor = index === 0 ? 30 : -20;
            orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });
});
