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
