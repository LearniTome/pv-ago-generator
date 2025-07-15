async function loadTemplates() {
    try {
        const response = await fetch('/get_favorites');
        const result = await response.json();
        const select = document.getElementById('favorite-templates');
        select.innerHTML = '<option value="">Sélectionner un template</option>';
        result.favorites.forEach(favorite => {
            const option = document.createElement('option');
            option.value = JSON.stringify(favorite.template);
            option.textContent = favorite.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur de chargement des templates:', error);
        showToast('error', 'Erreur lors du chargement des templates');
    }
}

async function loadTemplate() {
    const select = document.getElementById('favorite-templates');
    if (!select.value) return;

    const template = JSON.parse(select.value);
    Object.entries(template).forEach(([key, value]) => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = value;
        }
    });
    updatePreview();
}

async function saveTemplate() {
    const name = prompt('Nom du template:');
    if (!name) return;

    const formData = new FormData(document.getElementById('pv-form'));
    const template = {};
    formData.forEach((value, key) => { template[key] = value });

    try {
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
});
