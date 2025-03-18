document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    menuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        menuButton.querySelector('i').classList.toggle('fa-bars');
        menuButton.querySelector('i').classList.toggle('fa-times');
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            mobileMenu.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate counter numbers
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    const animateCounters = () => {
        counters.forEach(counter => {
            const targetValue = +counter.dataset.count;
            const increment = targetValue / speed;
            let currentValue = 0;

            const updateCounter = () => {
                if (currentValue < targetValue) {
                    currentValue += increment;
                    counter.textContent = Math.ceil(currentValue);
                    setTimeout(updateCounter, 1);
                } else {
                    counter.textContent = targetValue;
                }
            };

            updateCounter();
        });
    };

    // Use Intersection Observer to trigger counter animation when visible
    const statsSection = document.querySelector('.stats-counter');
    
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    }

    // CTA button hover effect
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.style.background = `radial-gradient(circle at ${x}% ${y}%, var(--secondary-light), var(--secondary))`;
        });

        ctaButton.addEventListener('mouseleave', function() {
            this.style.background = 'var(--secondary)';
        });
    }

    // Form submission animation
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('.submit-button');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
            submitButton.style.background = '#28a745';
            
            // Reset form
            this.reset();
            
            // Reset button after delay
            setTimeout(() => {
                submitButton.innerHTML = originalText;
                submitButton.style.background = '';
            }, 3000);
        });
    }

    // Add animation classes to floating elements
    document.querySelectorAll('.floating-element').forEach((element, index) => {
        element.style.animationDelay = `${index * 0.5}s`;
    });

    // Parallax scrolling effect for hero section
    const heroSection = document.querySelector('.hero');
    
    window.addEventListener('scroll', function() {
        if (heroSection) {
            const scrollPosition = window.scrollY;
            heroSection.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
        }
    });

    // Reveal elements on scroll (alternative to AOS for custom animations)
    const revealElements = document.querySelectorAll('.fade-in');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
});