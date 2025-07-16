// Fonction utilitaire pour créer les données du formulaire
function createFormData() {
    const form = document.getElementById('pv-form');
    const formData = new FormData(form);
    return formData;
}

// Fonction utilitaire pour valider tous les champs requis
function validateAllFields() {
    const form = document.getElementById('pv-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });

    if (!isValid) {
        showToast('error', 'Veuillez remplir tous les champs obligatoires.');
    }

    return isValid;
}

// Fonction pour prévisualiser le document
async function previewDocument() {
    const previewButton = document.querySelector('button[onclick="previewDocument()"]');
    const generateButton = document.querySelector('button[onclick="generateDocument()"]');
    const originalPreviewText = previewButton.innerHTML;

    try {
        // Désactiver les boutons pendant la génération
        previewButton.disabled = true;
        generateButton.disabled = true;
        previewButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération de l\'aperçu...';

        // Valider les champs
        if (!validateAllFields()) {
            return;
        }

        const formData = createFormData();
        formData.append('current_step', '3'); // On force l'étape 3 pour la prévisualisation

        // Envoyer la requête
        const response = await fetch('/preview', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            // Ouvrir la modal de prévisualisation
            const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
            const previewFrame = document.getElementById('previewFrame');
            previewFrame.src = `/static/temp/preview_${data.preview_id}.pdf`;

            // Attendre que le PDF soit chargé
            previewFrame.onload = () => {
                previewModal.show();
            };

            // En cas d'erreur de chargement du PDF
            previewFrame.onerror = () => {
                showToast('error', 'Erreur lors du chargement de la prévisualisation');
                previewButton.disabled = false;
                generateButton.disabled = false;
                previewButton.innerHTML = originalPreviewText;
            };
        } else {
            showToast('error', data.error || 'Erreur lors de la prévisualisation');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('error', 'Une erreur est survenue lors de la prévisualisation');
    } finally {
        // Réactiver les boutons
        previewButton.disabled = false;
        generateButton.disabled = false;
        previewButton.innerHTML = originalPreviewText;
    }
}

// Fonction pour générer le document final
async function generateDocument() {
    const generateButton = document.querySelector('button[onclick="generateDocument()"]');
    const originalGenerateText = generateButton.innerHTML;

    try {
        // Désactiver le bouton pendant la génération
        generateButton.disabled = true;
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';

        // Valider les champs
        if (!validateAllFields()) {
            return;
        }

        const formData = createFormData();

        // Envoyer la requête
        const response = await fetch('/generer', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        if (response.headers.get('content-type') === 'application/pdf') {
            // Gérer la réponse
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pv_ago.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            throw new Error('Format de réponse incorrect');
        }

        showToast('success', 'Document généré avec succès !');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('error', 'Une erreur est survenue lors de la génération');
    } finally {
        // Réactiver le bouton
        generateButton.disabled = false;
        generateButton.innerHTML = originalGenerateText;
    }
}

// Fonction pour générer le document final
async function generateDocument() {
    const generateButton = document.querySelector('button[onclick="generateDocument()"]');
    const originalGenerateText = generateButton.innerHTML;

    try {
        // Désactiver le bouton pendant la génération
        generateButton.disabled = true;
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';

        // Valider les champs
        if (!validateAllFields()) {
            generateButton.disabled = false;
            generateButton.innerHTML = originalGenerateText;
            return;
        }

        const formData = createFormData();

        // Envoyer la requête
        const response = await fetch('/generer', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la génération du document');
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
            // Télécharger le PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/["']/g, '') || 'pv_ago.pdf';

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // Nettoyage
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            showToast('success', 'Document généré avec succès !');
        } else {
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            throw new Error('Format de réponse incorrect');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('error', 'Une erreur est survenue lors de la génération');
    } finally {
        // Réactiver le bouton
        generateButton.disabled = false;
        generateButton.innerHTML = originalGenerateText;
    }
}

// Fonction pour afficher les toasts de notification
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
