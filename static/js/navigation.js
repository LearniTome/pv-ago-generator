// Configuration des sections
const sections = ['entreprise', 'associes', 'documents'];
let currentSection = 0;

// Navigation vers la section suivante
function nextSection(currentSectionId) {
    if (validateCurrentSection()) {
        // Mettre à jour la barre de progression
        const progress = ((currentSection + 1) / sections.length) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;

        // Mettre à jour les étapes
        document.querySelector(`.progress-step[id="step${currentSection + 1}"]`)?.classList.remove('active');
        document.querySelector(`.progress-step[id="step${currentSection + 2}"]`)?.classList.add('active');

        navigateToSection(currentSection + 1);
    }
}

// Navigation vers la section précédente
function previousSection() {
    navigateToSection(currentSection - 1);
}

// Validation de la section courante
function validateCurrentSection() {
    const currentSectionId = sections[currentSection];

    if (currentSectionId === 'entreprise') {
        return validateEntrepriseSection();
    } else if (currentSectionId === 'associes') {
        return validateAssociesSection();
    } else if (currentSectionId === 'documents') {
        return validateDocumentsSection();
    }

    return true;
}

// Validation de la section entreprise
function validateEntrepriseSection() {
    const requiredFields = document.querySelectorAll('#entreprise-section [required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    if (!isValid) {
        showNotification('error', 'Veuillez remplir tous les champs obligatoires');
    }

    return isValid;
}

// Validation de la section associés
function validateAssociesSection() {
    const totalPourcentage = document.getElementById('total-pourcentage');
    const totalParts = document.getElementById('total-parts');
    const capitalInput = document.querySelector('input[name="capital"]');
    const capital = parseInt(capitalInput?.value || 0);

    let isValid = true;
    const pourcentageTotal = parseFloat(totalPourcentage.value);
    const partsTotal = parseInt(totalParts.value);

    // Vérification des champs requis
    const requiredFields = document.querySelectorAll('#associes-list [required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    // Vérification du total des pourcentages
    if (Math.abs(pourcentageTotal - 100) > 0.01) {
        isValid = false;
        showNotification('error', 'Le total des pourcentages doit être égal à 100%');
    }

    // Vérification du total des parts
    if (partsTotal !== capital) {
        isValid = false;
        showNotification('error', 'Le total des parts doit être égal au capital social');
    }

    return isValid;
}

// Validation de la section documents
function validateDocumentsSection() {
    // Ajoutez ici la validation spécifique pour la section documents
    return true;
}

// Navigation vers une section
function navigateToSection(index) {
    if (index >= 0 && index < sections.length) {
        document.getElementById(`${sections[currentSection]}-section`).style.display = 'none';
        currentSection = index;
        document.getElementById(`${sections[currentSection]}-section`).style.display = 'block';
        updateProgress();
        updateStepIndicators();
    }
}

// Mise à jour de la barre de progression
function updateProgress() {
    const progress = ((currentSection + 1) / sections.length) * 100;
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = `${progress}%`;
}

// Mise à jour des indicateurs d'étapes
function updateStepIndicators() {
    sections.forEach((section, index) => {
        const step = document.getElementById(`step${index + 1}`);
        if (index === currentSection) {
            step.classList.add('active');
        } else if (index < currentSection) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Affichage de la section courante
function showCurrentSection() {
    sections.forEach((section, index) => {
        const sectionElement = document.getElementById(`${section}-section`);
        sectionElement.style.display = index === currentSection ? 'block' : 'none';
    });
    updateStepIndicators();
}

// Fonction pour afficher les notifications
function showNotification(type, message) {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    toast.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => toast.remove(), 3000);
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
    updateProgress();

    // Ajouter les gestionnaires d'événements pour les boutons de navigation
    document.querySelectorAll('.next-section').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            nextSection();
        });
    });

    document.querySelectorAll('.prev-section').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            previousSection();
        });
    });

    // Initialiser les indicateurs d'étapes
    updateStepIndicators();
});
