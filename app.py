from flask import Flask, render_template, request, redirect, url_for, session, send_file, jsonify
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import shutil
from pathlib import Path
from docx import Document
import uuid
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import pandas as pd
import json
from datetime import datetime, timedelta
import sqlite3

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_a_modifier'

# Configuration des chemins
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = {
    'SARL': os.path.join(BASE_DIR, 'static', 'templates', 'modele_pv_ago_sarl.docx'),
    'SARL AU': os.path.join(BASE_DIR, 'static', 'templates', 'modele_pv_ago_sarl_au.docx')
}
OUTPUT_DIR = os.path.join(BASE_DIR, 'static', 'output')
TEMP_DIR = os.path.join(OUTPUT_DIR, 'temp')
DB_PATH = os.path.join(BASE_DIR, 'database.db')

# Création des répertoires nécessaires
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialisation de la base de données
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Table pour l'historique des PV
    c.execute('''CREATE TABLE IF NOT EXISTS pv_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT NOT NULL,
                  date_creation TEXT NOT NULL,
                  type_societe TEXT NOT NULL,
                  nom_entreprise TEXT NOT NULL,
                  filename TEXT NOT NULL)''')

    # Table pour les templates favoris
    c.execute('''CREATE TABLE IF NOT EXISTS favorite_templates
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT NOT NULL,
                  template_name TEXT NOT NULL,
                  template_data TEXT NOT NULL)''')

    # Table pour les statistiques
    c.execute('''CREATE TABLE IF NOT EXISTS statistics
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  date TEXT NOT NULL,
                  type_societe TEXT NOT NULL,
                  action TEXT NOT NULL)''')

    # Table pour les associés
    c.execute('''CREATE TABLE IF NOT EXISTS associes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  pv_id INTEGER NOT NULL,
                  nom TEXT NOT NULL,
                  prenom TEXT NOT NULL,
                  adresse TEXT NOT NULL,
                  cni TEXT NOT NULL,
                  cni_validite TEXT NOT NULL,
                  cni_lieu TEXT,
                  email TEXT,
                  telephone TEXT,
                  nombre_parts INTEGER NOT NULL,
                  pourcentage REAL NOT NULL,
                  FOREIGN KEY (pv_id) REFERENCES pv_history(id))''')

    conn.commit()
    conn.close()

# Initialisation de la base de données au démarrage
init_db()

# Configuration de base
USERS = {
    'admin': generate_password_hash('motdepasse')
}

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in USERS and check_password_hash(USERS[username], password):
            session['username'] = username
            return redirect(url_for('formulaire'))
        else:
            return render_template('login.html', error='Identifiants invalides')
    return render_template('login.html')

@app.route('/formulaire')
def formulaire():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('formulaire.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

def save_pv_history(username, type_societe, nom_entreprise, filename):
    """Enregistre l'historique de génération d'un PV."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO pv_history
                    (username, date_creation, type_societe, nom_entreprise, filename)
                    VALUES (?, ?, ?, ?, ?)''',
                 (username,
                  datetime.now().strftime('%Y-%m-%d'),
                  type_societe,
                  nom_entreprise,
                  filename))

        # Enregistrement des statistiques
        c.execute('''INSERT INTO statistics
                    (date, type_societe, action)
                    VALUES (?, ?, ?)''',
                 (datetime.now().strftime('%Y-%m-%d'),
                  type_societe,
                  'generate_pv'))

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Erreur lors de l'enregistrement de l'historique : {str(e)}")

@app.route('/generer', methods=['POST'])
def generer():
    if 'username' not in session:
        return redirect(url_for('login'))

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        # Récupération des données du formulaire
        data = request.form

        # Formatage des données des associés
        associes = format_associes_data(data)

        # Vérification du total des parts
        total_pourcentage = sum(associe['pourcentage'] for associe in associes)
        if abs(total_pourcentage - 100) > 0.01:
            return render_template('formulaire.html',
                                error="Le total des parts doit être égal à 100%")

        # Détermination du type de société et sélection du modèle approprié
        type_societe = data.get('type_societe', '')
        if type_societe not in TEMPLATES:
            return render_template('formulaire.html',
                                error="Type de société non valide. Choisissez SARL ou SARL AU.")

        # Vérification du nombre d'associés selon le type de société
        if type_societe == 'SARL AU' and len(associes) != 1:
            return render_template('formulaire.html',
                                error="Une SARL AU ne peut avoir qu'un seul associé.")
        elif type_societe == 'SARL' and len(associes) < 2:
            return render_template('formulaire.html',
                                error="Une SARL doit avoir au moins deux associés.")

        template_path = TEMPLATES[type_societe]
        if not os.path.exists(template_path):
            return render_template('formulaire.html',
                                error=f"Le modèle de document pour {type_societe} n'existe pas.")

        # Création du nom de fichier formaté
        date_str = datetime.strptime(data.get('date_assemblee', ''), '%Y-%m-%d').strftime('%Y_%m_%d')
        nom_societe = data.get('nom_entreprise', '').replace(' ', '_')
        filename = f"{date_str}_Pv_Ago_{type_societe.replace(' ', '_')}_{nom_societe}.docx"
        temp_file = os.path.join(TEMP_DIR, filename)

        # Copie et modification du modèle
        shutil.copy2(template_path, temp_file)
        doc = Document(temp_file)

        # Remplacement des variables dans le document
        for paragraph in doc.paragraphs:
            for run in paragraph.runs:
                text = run.text
                replacements = {
                    "{{nom_entreprise}}": data.get('nom_entreprise', ''),
                    "{{type_societe}}": type_societe,
                    "{{capital}}": data.get('capital', ''),
                    "{{adresse}}": data.get('adresse', ''),
                    "{{date_assemblee}}": data.get('date_assemblee', ''),
                    "{{lieu_assemblee}}": data.get('lieu_assemblee', '')
                }
                for key, value in replacements.items():
                    text = text.replace(key, value)
                run.text = text

        # Génération de la section des associés
        generate_associes_section(doc, associes)

        # Ajout du contenu personnalisé
        if data.get('pv_contenu'):
            doc.add_paragraph(data.get('pv_contenu'))

        # Sauvegarde du document
        doc.save(temp_file)

        # Enregistrement de l'historique et des associés
        c.execute('''INSERT INTO pv_history
                    (username, date_creation, type_societe, nom_entreprise, filename)
                    VALUES (?, ?, ?, ?, ?)''',
                 (session['username'],
                  datetime.now().strftime('%Y-%m-%d'),
                  type_societe,
                  data.get('nom_entreprise', ''),
                  filename))

        pv_id = c.lastrowid
        save_associes(pv_id, associes)

        conn.commit()

        # Envoi du fichier
        return send_file(
            temp_file,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as e:
        conn.rollback()
        return render_template('formulaire.html',
                             error=f"Erreur lors de la génération : {str(e)}")
    finally:
        conn.close()

@app.route('/convert_pdf', methods=['POST'])
def convert_pdf():
    if 'username' not in session:
        return redirect(url_for('login'))

    try:
        wordfile = request.form.get('wordfile')
        word_path = os.path.join(TEMP_DIR, wordfile)
        pdf_filename = wordfile.replace('.docx', '.pdf')
        pdf_path = os.path.join(TEMP_DIR, pdf_filename)

        # Vérification de l'existence du fichier Word
        if not os.path.exists(word_path):
            raise FileNotFoundError("Le fichier Word d'origine n'existe pas")

        # Lecture du document Word
        doc = Document(word_path)
        text_content = []
        for para in doc.paragraphs:
            if para.text.strip():
                text_content.append(para.text)

        # Création du PDF
        c = canvas.Canvas(pdf_path, pagesize=A4)
        width, height = A4
        y = height - 40

        # Configuration de la police
        c.setFont("Helvetica", 12)

        # Ajout du contenu
        for line in text_content:
            # Gestion des sauts de page
            if y < 40:
                c.showPage()
                y = height - 40
                c.setFont("Helvetica", 12)

            # Écriture du texte
            c.drawString(40, y, line)
            y -= 20

        c.save()

        # Envoi du fichier PDF
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=pdf_filename,
            mimetype='application/pdf'
        )

    except Exception as e:
        return render_template('preview.html',
                             error=f"Erreur lors de la conversion en PDF : {str(e)}")

@app.route('/pv/<filename>')
def download_pv(filename):
    if 'username' not in session:
        return redirect(url_for('login'))
    return send_file(
        os.path.join(TEMP_DIR, filename),
        as_attachment=True
    )

# Route pour la prévisualisation en temps réel
@app.route('/preview', methods=['POST'])
def preview():
    if 'username' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    try:
        data = request.json
        # Générer une prévisualisation HTML du document
        preview_html = generate_preview(data)
        return jsonify({'preview': preview_html})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route pour sauvegarder un template favori
@app.route('/save_favorite', methods=['POST'])
def save_favorite():
    if 'username' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    try:
        data = request.json
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO favorite_templates (username, template_name, template_data) VALUES (?, ?, ?)',
                 (session['username'], data['name'], json.dumps(data['template'])))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Template sauvegardé avec succès'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route pour récupérer les templates favoris
@app.route('/get_favorites')
def get_favorites():
    if 'username' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT template_name, template_data FROM favorite_templates WHERE username = ?',
                 (session['username'],))
        favorites = [{'name': row[0], 'template': json.loads(row[1])} for row in c.fetchall()]
        conn.close()
        return jsonify({'favorites': favorites})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route for the associates
@app.route('/associates', methods=['POST'])
def associates():
    if 'username' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    try:
        data = request.json
        pv_id = data.get('pv_id')
        associes = data.get('associes', [])

        # Enregistrement des associés dans la base de données
        save_associes(pv_id, associes)

        return jsonify({'message': 'Associés enregistrés avec succès'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route pour l'historique des PV
@app.route('/history')
def history():
    if 'username' not in session:
        return redirect(url_for('login'))
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT date_creation, type_societe, nom_entreprise, filename FROM pv_history WHERE username = ? ORDER BY date_creation DESC',
                 (session['username'],))
        history = c.fetchall()
        conn.close()
        return render_template('history.html', history=history)
    except Exception as e:
        return render_template('history.html', error=str(e))

# Route pour le tableau de bord des statistiques
@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login'))
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Statistiques des 30 derniers jours
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # PV par type de société
        c.execute('''SELECT type_societe, COUNT(*) as count
                    FROM pv_history
                    WHERE date_creation >= ?
                    GROUP BY type_societe''', (thirty_days_ago,))
        pv_stats = format_stats_data(c.fetchall())

        # Evolution journalière
        c.execute('''SELECT date_creation, COUNT(*) as count
                    FROM pv_history
                    WHERE date_creation >= ?
                    GROUP BY date_creation
                    ORDER BY date_creation''', (thirty_days_ago,))
        daily_stats = format_stats_data(c.fetchall())

        conn.close()
        return render_template('dashboard.html',
                             pv_stats=pv_stats,
                             daily_stats=daily_stats)
    except Exception as e:
        return render_template('dashboard.html', error=str(e))

# Route pour l'import Excel
@app.route('/import_excel', methods=['POST'])
def import_excel():
    if 'username' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400

        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'Format de fichier non supporté'}), 400

        # Lecture du fichier Excel
        df = pd.read_excel(file)
        # Conversion en dictionnaire
        data = df.to_dict('records')[0] if not df.empty else {}

        return jsonify({'data': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_stats_data(stats_data):
    """Formate les données statistiques pour les graphiques."""
    return [[str(item[0]), int(item[1])] for item in stats_data]

def generate_preview(data):
    """Génère une prévisualisation HTML du document."""
    try:
        type_societe = data.get('type_societe', '')
        if type_societe not in TEMPLATES:
            return '<p class="text-danger">Type de société non valide</p>'

        template_path = TEMPLATES[type_societe]
        if not os.path.exists(template_path):
            return '<p class="text-danger">Modèle non trouvé</p>'

        # Création d'une copie temporaire pour la prévisualisation
        temp_preview = os.path.join(TEMP_DIR, f'preview_{uuid.uuid4()}.docx')
        shutil.copy2(template_path, temp_preview)
        doc = Document(temp_preview)

        preview_html = []
        for paragraph in doc.paragraphs:
            text = paragraph.text
            replacements = {
                "{{nom_entreprise}}": data.get('nom_entreprise', ''),
                "{{type_societe}}": data.get('type_societe', ''),
                "{{capital}}": data.get('capital', ''),
                "{{adresse}}": data.get('adresse', ''),
                "{{date_assemblee}}": data.get('date_assemblee', ''),
                "{{lieu_assemblee}}": data.get('lieu_assemblee', '')
            }
            for key, value in replacements.items():
                text = text.replace(key, value)
            preview_html.append(f'<p>{text}</p>')

        # Ajout du contenu personnalisé
        if data.get('pv_contenu'):
            preview_html.append(f'<p>{data.get("pv_contenu")}</p>')

        # Ajout des sections supplémentaires
        sections = [
            ('Participants', data.get('participants', ''), True),
            ('Ordre du jour', data.get('ordre_jour', ''), False),
            ('Décisions prises', data.get('decisions', ''), False),
            ('Résultats des votes', data.get('votes', ''), False),
        ]

        for title, content, is_list in sections:
            if content:
                preview_html.append(f'<h3>{title}</h3>')
                if is_list:
                    preview_html.append('<ul>')
                    for line in content.splitlines():
                        if line.strip():
                            preview_html.append(f'<li>{line.strip()}</li>')
                    preview_html.append('</ul>')
                else:
                    preview_html.append(f'<p>{content}</p>')

        # Nettoyage du fichier temporaire
        os.remove(temp_preview)

        return '\n'.join(preview_html)
    except Exception as e:
        return f'<p class="text-danger">Erreur de prévisualisation : {str(e)}</p>'

def format_associes_data(data):
    """Formate les données des associés pour le PV."""
    associes = []
    noms = data.getlist('associe_nom[]')
    prenoms = data.getlist('associe_prenom[]')
    adresses = data.getlist('associe_adresse[]')
    cnis = data.getlist('associe_cni[]')
    cni_validites = data.getlist('associe_cni_validite[]')
    cni_lieux = data.getlist('associe_cni_lieu[]')
    emails = data.getlist('associe_email[]')
    telephones = data.getlist('associe_telephone[]')
    parts = data.getlist('associe_parts[]')
    pourcentages = data.getlist('associe_pourcentage[]')

    for i in range(len(noms)):
        associe = {
            'nom': noms[i],
            'prenom': prenoms[i],
            'adresse': adresses[i],
            'cni': cnis[i],
            'cni_validite': cni_validites[i],
            'cni_lieu': cni_lieux[i] if cni_lieux[i] else None,
            'email': emails[i] if emails[i] else None,
            'telephone': telephones[i] if telephones[i] else None,
            'parts': int(parts[i]),
            'pourcentage': float(pourcentages[i].replace('%', ''))
        }
        associes.append(associe)

    return associes

def save_associes(pv_id, associes):
    """Enregistre les informations des associés dans la base de données."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    for associe in associes:
        c.execute('''INSERT INTO associes
                    (pv_id, nom, prenom, adresse, cni, cni_validite, cni_lieu,
                     email, telephone, nombre_parts, pourcentage)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (pv_id, associe['nom'], associe['prenom'], associe['adresse'],
                  associe['cni'], associe['cni_validite'], associe['cni_lieu'],
                  associe['email'], associe['telephone'], associe['parts'],
                  associe['pourcentage']))

    conn.commit()
    conn.close()

def generate_associes_section(doc, associes):
    """Génère la section des associés dans le document Word."""
    doc.add_heading('Liste des Associés', level=1)

    # Tableau des associés
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'

    # En-têtes
    header_cells = table.rows[0].cells
    header_cells[0].text = 'Nom et Prénom'
    header_cells[1].text = 'Parts sociales'
    header_cells[2].text = 'Pourcentage'
    header_cells[3].text = 'Signature'

    # Données des associés
    for associe in associes:
        row_cells = table.add_row().cells
        row_cells[0].text = f"{associe['nom']} {associe['prenom']}"
        row_cells[1].text = str(associe['parts'])
        row_cells[2].text = f"{associe['pourcentage']}%"
        row_cells[3].text = ''  # Espace pour la signature


if __name__ == '__main__':
    # Création des dossiers nécessaires au démarrage
    os.makedirs(os.path.join('static', 'templates'), exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    app.run(debug=True)
