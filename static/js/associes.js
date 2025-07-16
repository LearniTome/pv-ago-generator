let totalParts = 0;

function ajouterAssocie() {
    const container = document.getElementById('associes-container');
    const template = document.getElementById('associe-template');
    const clone = template.content.cloneNode(true);

    // Mise à jour du numéro d'associé
    const numeroAssocie = container.children.length + 1;
    clone.querySelector('.associe-numero').textContent = numeroAssocie;

    // Ajout de l'associé au container
    container.appendChild(clone);

    // Mise à jour des pourcentages
    updateAllPercentages();
}

function supprimerAssocie(element) {
    const associeContainer = element.closest('.associe-container');
    associeContainer.remove();

    // Mise à jour des numéros d'associés
    const containers = document.querySelectorAll('.associe-container');
    containers.forEach((container, index) => {
        container.querySelector('.associe-numero').textContent = index + 1;
    });

    // Mise à jour des pourcentages
    updateAllPercentages();
}

function calculerPourcentage(input) {
    updateAllPercentages();
}

function updateAllPercentages() {
    const containers = document.querySelectorAll('.associe-container');
    let totalParts = 0;

    // Calculer le total des parts
    containers.forEach(container => {
        const parts = parseInt(container.querySelector('[name="associe_parts[]"]').value) || 0;
        totalParts += parts;
    });

    // Mettre à jour les pourcentages
    containers.forEach(container => {
        const parts = parseInt(container.querySelector('[name="associe_parts[]"]').value) || 0;
        const percentage = totalParts > 0 ? ((parts / totalParts) * 100).toFixed(2) : '0';
        container.querySelector('[name="associe_pourcentage[]"]').value = percentage + '%';
    });
}

// Fonctions pour gérer les associés
document.addEventListener('DOMContentLoaded', function() {
    const associesList = document.getElementById('associes-list');
    const addAssocieBtn = document.getElementById('add-associe');
    const saveAssociesBtn = document.getElementById('save-associes');
    const associeTemplate = document.getElementById('associe-template');
    const capitalInput = document.querySelector('input[name="capital"]');

    // Ajouter le premier associé au chargement si la liste est vide
    if (associesList && associesList.children.length === 0) {
        addAssocieBtn && addAssocieBtn.click();
    }

    // Fonction pour calculer les totaux
    function calculateTotals() {
        const totalPartsInput = document.getElementById('total-parts');
        const totalPourcentageInput = document.getElementById('total-pourcentage');

        let totalParts = 0;
        let totalPourcentage = 0;
        const capitalSocial = parseInt(capitalInput?.value || 0);

        // Récupérer toutes les inputs de parts et pourcentages
        const partsInputs = document.getElementsByName('associe_parts[]');
        const pourcentageInputs = document.getElementsByName('associe_pourcentage[]');

        // Calculer les totaux
        for (let i = 0; i < partsInputs.length; i++) {
            const parts = parseInt(partsInputs[i].value || 0);
            const pourcentage = parseFloat(pourcentageInputs[i].value || 0);

            totalParts += parts;
            totalPourcentage += pourcentage;

            // Vérifier la cohérence entre les parts et le pourcentage
            if (capitalSocial > 0 && parts > 0) {
                const calculatedPourcentage = (parts / capitalSocial) * 100;
                if (Math.abs(calculatedPourcentage - pourcentage) > 0.01) {
                    pourcentageInputs[i].value = calculatedPourcentage.toFixed(2);
                    totalPourcentage = calculateTotalPourcentage();
                }
            }
        }

        // Mettre à jour les champs de totaux
        if (totalPartsInput) totalPartsInput.value = totalParts;
        if (totalPourcentageInput) totalPourcentageInput.value = totalPourcentage.toFixed(2);

        // Validation des totaux
        if (totalPartsInput && capitalSocial > 0) {
            if (totalParts !== capitalSocial) {
                totalPartsInput.classList.add('is-invalid');
                totalPartsInput.classList.remove('is-valid');
            } else {
                totalPartsInput.classList.add('is-valid');
                totalPartsInput.classList.remove('is-invalid');
            }
        }

        if (totalPourcentageInput) {
            if (Math.abs(totalPourcentage - 100) > 0.01) {
                totalPourcentageInput.classList.add('is-invalid');
                totalPourcentageInput.classList.remove('is-valid');
            } else {
                totalPourcentageInput.classList.add('is-valid');
                totalPourcentageInput.classList.remove('is-invalid');
            }
        }

        return { isValid: totalParts === capitalSocial && Math.abs(totalPourcentage - 100) <= 0.01 };
    }

    // Fonction pour calculer le pourcentage total
    function calculateTotalPourcentage() {
        const pourcentageInputs = document.getElementsByName('associe_pourcentage[]');
        return Array.from(pourcentageInputs).reduce((total, input) => total + (parseFloat(input.value) || 0), 0);
    }

    // Fonction pour configurer les événements d'un associé
    function setupAssocieEvents(associeElement) {
        const partsInput = associeElement.querySelector('.parts-input');
        const pourcentageInput = associeElement.querySelector('.pourcentage-input');
        const removeBtn = associeElement.querySelector('.remove-associe');

        if (partsInput) {
            partsInput.addEventListener('input', function() {
                if (capitalInput?.value) {
                    const parts = parseInt(this.value || 0);
                    const pourcentage = (parts / parseInt(capitalInput.value)) * 100;
                    if (pourcentageInput) {
                        pourcentageInput.value = pourcentage.toFixed(2);
                    }
                }
                calculateTotals();
            });
        }

        if (pourcentageInput) {
            pourcentageInput.addEventListener('input', function() {
                if (capitalInput?.value) {
                    const pourcentage = parseFloat(this.value || 0);
                    const parts = Math.round((pourcentage * parseInt(capitalInput.value)) / 100);
                    if (partsInput) {
                        partsInput.value = parts;
                    }
                }
                calculateTotals();
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (associesList.children.length > 1) {
                    associeElement.remove();
                    calculateTotals();
                } else {
                    showNotification('error', 'Il doit y avoir au moins un associé');
                }
            });
        }
    }

    // Ajouter un nouvel associé
    if (addAssocieBtn) {
        addAssocieBtn.addEventListener('click', function() {
            if (associeTemplate && associesList) {
                const clone = document.importNode(associeTemplate.content, true);
                associesList.appendChild(clone);
                setupAssocieEvents(associesList.lastElementChild);
                calculateTotals();
            }
        });
    }

    // Sauvegarder les associés
    if (saveAssociesBtn) {
        saveAssociesBtn.addEventListener('click', function() {
            const { isValid } = calculateTotals();
            if (!isValid) {
                showNotification('error', 'Veuillez vérifier les parts et pourcentages avant de sauvegarder');
                return;
            }

            const associes = [];
            const forms = document.querySelectorAll('.associe-item');

            forms.forEach(form => {
                const associe = {
                    nom: form.querySelector('[name="associe_nom[]"]')?.value,
                    prenom: form.querySelector('[name="associe_prenom[]"]')?.value,
                    adresse: form.querySelector('[name="associe_adresse[]"]')?.value,
                    cni: form.querySelector('[name="associe_cni[]"]')?.value,
                    cni_validite: form.querySelector('[name="associe_cni_validite[]"]')?.value,
                    cni_lieu: form.querySelector('[name="associe_cni_lieu[]"]')?.value,
                    email: form.querySelector('[name="associe_email[]"]')?.value,
                    telephone: form.querySelector('[name="associe_telephone[]"]')?.value,
                    parts: parseInt(form.querySelector('[name="associe_parts[]"]')?.value),
                    pourcentage: parseFloat(form.querySelector('[name="associe_pourcentage[]"]')?.value)
                };
                associes.push(associe);
            });

            // Envoyer les données au serveur
            fetch('/save_associes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ associes })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showNotification('success', 'Les données des associés ont été sauvegardées avec succès');
                } else if (data.error) {
                    showNotification('error', `Erreur lors de la sauvegarde: ${data.error}`);
                }
            })
            .catch(error => {
                showNotification('error', `Erreur lors de la sauvegarde: ${error.message}`);
            });
        });
    }

    // Écouter les changements sur le capital social
    if (capitalInput) {
        capitalInput.addEventListener('input', function() {
            calculateTotals();
        });
    }

    // Fonction pour afficher les notifications
    function showNotification(type, message) {
        const toastContainer = document.querySelector('.toast-container');
        if (toastContainer) {
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
    }

    // Configuration initiale pour les associés existants
    document.querySelectorAll('.associe-item').forEach(setupAssocieEvents);

    // Observer les changements dans la liste des associés
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                calculateTotals();
            }
        });
    });

    if (associesList) {
        observer.observe(associesList, { childList: true });
    }

    // Calcul initial des totaux
    calculateTotals();
});

function checkAssociesCount() {
    const typeSociete = document.querySelector('[name="type_societe"]').value;
    const containers = document.querySelectorAll('.associe-container');
    const addButton = document.querySelector('.add-associe-btn');
    const warning = document.createElement('div');
    warning.className = 'alert alert-warning mt-3';

    // Supprime les avertissements précédents
    document.querySelectorAll('.alert-warning').forEach(el => el.remove());

    if (typeSociete === 'SARL AU' && containers.length > 1) {
        warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Une SARL AU ne peut avoir qu\'un seul associé.';
        addButton.disabled = true;
        containers[0].parentNode.insertBefore(warning, containers[0]);
    } else if (typeSociete === 'SARL' && containers.length < 2) {
        warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Une SARL doit avoir au moins deux associés.';
        containers[0].parentNode.insertBefore(warning, containers[0]);
    } else {
        addButton.disabled = false;
    }
}
