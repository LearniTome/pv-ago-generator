// Fonction pour afficher les toasts de notification si elle n'existe pas déjà
if (typeof showToast !== 'function') {
    function showToast(type, message) {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Validation des champs numériques
function validateInput(input, length, errorId) {
    if (!input || !errorId) return;

    const value = input.value;
    const error = document.getElementById(errorId);
    if (!error) return;

    const validationMessage = document.createElement('div');

    if (value.length > 0 && value.length !== length) {
        validationMessage.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            Doit contenir exactement ${length} chiffres (${value.length}/${length})
        `;
        validationMessage.className = 'validation-message validation-error';
        error.innerHTML = '';
        error.appendChild(validationMessage);
    } else if (value.length === length) {
        validationMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Format correct
        `;
        validationMessage.className = 'validation-message validation-success';
        error.innerHTML = '';
        error.appendChild(validationMessage);
        showToast('success', 'Format validé');
    } else {
        error.innerHTML = '';
    }
}

// Formatage du capital
function formatCapital(input) {
    const value = parseInt(input.value);
    if (!isNaN(value)) {
        const formatted = new Intl.NumberFormat('fr-FR').format(value);
        document.getElementById('capital-text').innerHTML =
            `<i class="fas fa-check-circle text-success"></i> ${formatted} Dirhams`;
        showToast('success', 'Capital enregistré avec succès');
    }
}

// Validation de section
function validateSection() {
    const currentSection = document.querySelector('.form-section:not([style*="display: none"])');
    const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('is-invalid');
            showToast('error', 'Veuillez remplir tous les champs obligatoires');
        } else {
            input.classList.remove('is-invalid');
        }
    });

    return isValid;
}

// Notifications Toast
function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon} ${type === 'success' ? 'text-success' : 'text-danger'}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
