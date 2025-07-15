// Configuration des sections
const sections = ['entreprise', 'associes', 'documents', 'preview'];
let currentSection = 'entreprise';

// Navigation vers la section suivante
function nextSection(current) {
    console.log('nextSection called with:', current);
    const currentIndex = sections.indexOf(current);

    if (currentIndex < sections.length - 1) {
        // Masquer la section actuelle
        const currentSection = document.getElementById(`${current}-section`);
        if (currentSection) {
            currentSection.style.display = 'none';
        }

        // Afficher la section suivante
        const nextSectionId = `${sections[currentIndex + 1]}-section`;
        const nextSection = document.getElementById(nextSectionId);
        if (nextSection) {
            nextSection.style.display = 'block';
        }

        // Mettre à jour la barre de progression
        updateProgressBar(currentIndex + 1);
    }
}

// Navigation vers la section précédente
function previousSection(current) {
    const currentIndex = sections.indexOf(current);
    if (currentIndex > 0) {
        // Masquer la section actuelle
        document.getElementById(`${current}-section`).style.display = 'none';

        // Afficher la section précédente
        const prevSectionId = `${sections[currentIndex - 1]}-section`;
        document.getElementById(prevSectionId).style.display = 'block';

        // Mettre à jour la barre de progression
        updateProgressBar(currentIndex - 1);
    }
}

// Mise à jour de la barre de progression
function updateProgressBar(sectionIndex) {
    const progress = ((sectionIndex + 1) / sections.length) * 100;
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);

    // Mettre à jour les étapes
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index <= sectionIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Masquer toutes les sections sauf la première
    sections.forEach(section => {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.style.display = section === 'entreprise' ? 'block' : 'none';
        }
    });

    // Initialiser la barre de progression
    updateProgressBar(0);
});
