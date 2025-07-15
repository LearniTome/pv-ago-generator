async function updatePreview() {
    const formData = new FormData(document.getElementById('pv-form'));
    const data = {};
    formData.forEach((value, key) => { data[key] = value });

    try {
        const response = await fetch('/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.preview) {
            document.getElementById('preview-container').innerHTML = result.preview;
        }
    } catch (error) {
        console.error('Erreur de prévisualisation:', error);
        showToast('error', 'Erreur lors de la prévisualisation');
    }
}

// Initialisation de la prévisualisation
document.addEventListener('DOMContentLoaded', () => {
    // Attacher l'événement de mise à jour de la prévisualisation à tous les champs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('change', updatePreview);
        input.addEventListener('keyup', updatePreview);
    });

    // Prévisualisation initiale
    updatePreview();
});
