// Fonction pour ajouter un nouveau point à l'ordre du jour
function addOrdreJourItem() {
    const container = document.getElementById('ordre_du_jour_container');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control" name="ordre_du_jour[]" required>
        <button type="button" class="btn btn-outline-danger" onclick="removeOrdreJourItem(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// Fonction pour supprimer un point de l'ordre du jour
function removeOrdreJourItem(button) {
    const container = document.getElementById('ordre_du_jour_container');
    if (container.children.length > 1) {
        button.closest('.input-group').remove();
    } else {
        // Ne pas supprimer le dernier élément, juste le vider
        button.closest('.input-group').querySelector('input').value = '';
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Si aucun point n'existe, en ajouter un par défaut
    const container = document.getElementById('ordre_du_jour_container');
    if (!container.children.length) {
        addOrdreJourItem();
    }

    // Formater la date par défaut si elle n'est pas déjà définie
    const dateAgo = document.getElementById('date_ago');
    if (!dateAgo.value) {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        dateAgo.value = defaultDate.toISOString().split('T')[0];
    }

    // Formater l'heure par défaut si elle n'est pas déjà définie
    const heureAgo = document.getElementById('heure_ago');
    if (!heureAgo.value) {
        heureAgo.value = '10:00';
    }
});
