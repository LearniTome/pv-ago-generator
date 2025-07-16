document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les tooltips Bootstrap
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Initialiser la barre de progression
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }

    // Gérer les erreurs de chargement d'images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            console.warn('Image not loaded:', this.src);
            this.style.display = 'none';
        });
    });

    // Éviter la soumission du formulaire par défaut
    document.getElementById('pv-form')?.addEventListener('submit', function(e) {
        if (!validateAllFields()) {
            e.preventDefault();
        }
    });

    // Nettoyer les validations au chargement
    clearValidations();
});

// Fonction utilitaire pour nettoyer les validations
function clearValidations() {
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.validation-message').forEach(el => {
        el.remove();
    });
}

// Gestionnaire d'erreurs global
window.addEventListener('error', function(e) {
    console.error('Global error:', e.message);
    // Éviter l'affichage des erreurs non critiques dans la console
    if (e.message.includes('ResizeObserver') ||
        e.message.includes('Script error')) {
        e.preventDefault();
    }
});
