// Charger les templates au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    setupTemplateListeners();
});

async function loadTemplates() {
    try {
        const response = await fetch('/list_templates');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();
        const select = document.getElementById('document-template');
        if (!select) return;

        select.innerHTML = '<option value="">Choisir un modèle...</option>';

        if (result.success && result.templates) {
            result.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.path;

                // Formater le nom du template pour l'affichage
                const displayName = template.name
                    .replace(/_/g, ' ')
                    .replace(/modele/i, '')
                    .replace(/pv/i, 'PV')
                    .replace(/ago/i, 'AGO')
                    .trim();

                option.textContent = displayName;
                option.dataset.type = template.type;
                select.appendChild(option);
            });

            select.disabled = false;
        } else {
            throw new Error('Aucun modèle disponible');
        }
    } catch (error) {
        console.error('Erreur de chargement des templates:', error);
        showStatusMessage('Erreur lors du chargement des modèles: ' + error.message, 'danger');

        const select = document.getElementById('document-template');
        if (select) {
            select.disabled = true;
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    }
}

function setupTemplateListeners() {
    const templateSelect = document.getElementById('document-template');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            updateTemplateInfo(selectedOption);
        });
    }
}

function updateTemplateInfo(option) {
    const infoText = document.getElementById('template-type-text');
    if (!infoText) return;

    if (!option.value) {
        infoText.innerHTML = 'Sélectionnez un modèle pour voir les détails';
        return;
    }

    // Extraire le type de société du nom du fichier
    const fileName = option.textContent.toLowerCase();
    let typeInfo = 'Modèle standard';

    if (fileName.includes('sarl au')) {
        typeInfo = 'Modèle pour SARL AU (Associé Unique)';
    } else if (fileName.includes('sarl')) {
        typeInfo = 'Modèle pour SARL (plusieurs associés)';
    }

    infoText.innerHTML = typeInfo;
}

function getSelectedTemplate() {
    const select = document.getElementById('document-template');
    if (!select) return null;

    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption || !selectedOption.value) return null;

    return {
        path: selectedOption.value,
        name: selectedOption.textContent,
        type: selectedOption.dataset.type
    };
}

function updateTypeFromTemplate() {
    const template = getSelectedTemplate();
    if (!template) return;

    const typeSelect = document.getElementById('type_societe');
    if (!typeSelect) return;

    const templateName = template.name.toLowerCase();
    if (templateName.includes('sarl au')) {
        typeSelect.value = 'SARL AU';
    } else if (templateName.includes('sarl')) {
        typeSelect.value = 'SARL';
    }

    // Déclencher l'événement change
    typeSelect.dispatchEvent(new Event('change'));
}

async function saveTemplate() {
    try {
        if (!validateAllFields()) {
            showStatusMessage('Veuillez remplir correctement tous les champs obligatoires avant de sauvegarder', 'warning');
            return;
        }

        const name = await showPromptModal('Sauvegarder le modèle', 'Nom du modèle:');
        if (!name) return;

        const formData = new FormData(document.getElementById('pv-form'));
        const template = {};
        formData.forEach((value, key) => {
            if (value !== '') {  // Ne pas inclure les champs vides
                template[key] = value;
            }
        });

        const response = await fetch('/save_favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                template: template
            })
        });
        const result = await response.json();
        if (result.message) {
            showToast('success', 'Template sauvegardé avec succès');
            loadTemplates();
        }
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        showToast('error', 'Erreur lors de la sauvegarde du template');
    }
}

// Fonction pour afficher une boîte de dialogue modale stylisée
function showPromptModal(title, message) {
    return new Promise((resolve) => {
        // Créer la modal
        const modalHtml = `
            <div class="modal fade" id="promptModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="promptInput" class="form-label">${message}</label>
                                <input type="text" class="form-control" id="promptInput">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" id="promptConfirm">Confirmer</button>
                        </div>
                    </div>
                </div>
            </div>`;

        // Ajouter la modal au document
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalElement = document.getElementById('promptModal');
        const modal = new bootstrap.Modal(modalElement);
        const input = document.getElementById('promptInput');

        // Gérer la confirmation
        document.getElementById('promptConfirm').onclick = () => {
            const value = input.value.trim();
            modal.hide();
            setTimeout(() => {
                modalElement.remove();
                resolve(value);
            }, 150);
        };

        // Gérer l'annulation
        modalElement.addEventListener('hidden.bs.modal', () => {
            setTimeout(() => {
                modalElement.remove();
                resolve(null);
            }, 150);
        });

        // Afficher la modal
        modal.show();
        input.focus();
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
});
