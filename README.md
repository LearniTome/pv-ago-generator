# Générateur de PV d'Assemblée Générale Ordinaire

Application web Flask pour générer des procès-verbaux d'Assemblée Générale Ordinaire (AGO) au format Word et PDF.

## Fonctionnalités

- Interface utilisateur conviviale pour la saisie des informations
- Éditeur de texte avancé (CKEditor 5) pour la rédaction du contenu
- Gestion des associés et signataires multiples
- Génération de documents aux formats DOCX et PDF
- Support multilingue (interface en français)

## Technologies utilisées

- Python/Flask pour le backend
- CKEditor 5 pour l'édition de texte riche
- HTML/CSS pour l'interface utilisateur
- python-docx pour la génération de documents Word
- ReportLab pour la génération de PDF

## Installation

1. Cloner le repository :
```bash
git clone [URL_DU_REPO]
cd pv-ago-generator
```

2. Créer un environnement virtuel Python :
```bash
python -m venv env
source env/bin/activate  # Sur Unix/MacOS
env\Scripts\activate     # Sur Windows
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

## Utilisation

1. Lancer l'application :
```bash
python app.py
```

2. Ouvrir un navigateur et accéder à : `http://localhost:5000`

## Structure du projet

```
pv-ago-generator/
├── app.py              # Application principale Flask
├── requirements.txt    # Dépendances Python
├── static/            # Fichiers statiques
├── templates/         # Templates HTML
│   ├── formulaire.html
│   ├── login.html
│   └── preview.html
└── pv/               # Dossier de sortie pour les documents générés
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## License

[MIT License](LICENSE)
