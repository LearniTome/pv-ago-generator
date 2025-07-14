from flask import Flask, render_template, request, redirect, url_for, session
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_a_modifier'

# Utilisateurs simples (à remplacer par un fichier ou une base de données)
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

from docx import Document
from datetime import datetime
import uuid

@app.route('/generer', methods=['POST'])
def generer():
    if 'username' not in session:
        return redirect(url_for('login'))
    # Récupération des données du formulaire
    data = request.form.to_dict()
    # Création du document Word
    doc = Document()
    doc.add_heading('Procès-Verbal d’Assemblée Générale Ordinaire', 0)
    doc.add_paragraph(f"Entreprise : {data.get('nom_entreprise','')}")
    doc.add_paragraph(f"Type de société : {data.get('type_societe','')}")
    doc.add_paragraph(f"Capital : {data.get('capital','')}")
    doc.add_paragraph(f"Adresse : {data.get('adresse','')}")
    doc.add_paragraph(f"Informations fiscales : {data.get('infos_fiscales','')}")
    doc.add_paragraph(f"Date de l'assemblée : {data.get('date_assemblee','')}")
    doc.add_paragraph(f"Lieu de l'assemblée : {data.get('lieu_assemblee','')}")
    doc.add_paragraph(f"Nom de l'associé unique : {data.get('nom_associe','')}")
    doc.add_paragraph(f"Détails de l'associé unique : {data.get('details_associe','')}")
    doc.add_heading('Participants', level=1)
    for line in data.get('participants','').splitlines():
        doc.add_paragraph(line, style='List Bullet')
    doc.add_heading('Ordre du jour', level=1)
    doc.add_paragraph(data.get('ordre_jour',''))
    doc.add_heading('Décisions prises', level=1)
    doc.add_paragraph(data.get('decisions',''))
    doc.add_heading('Résultats des votes', level=1)
    doc.add_paragraph(data.get('votes',''))
    doc.add_heading('Remarques', level=1)
    doc.add_paragraph(data.get('remarques',''))
    # Sauvegarde temporaire du document Word
    filename = f"pv_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.docx"
    filepath = os.path.join('pv', filename)
    doc.save(filepath)
    # Prévisualisation (affichage des données)
    return render_template('preview.html', data=data, wordfile=filename)

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

@app.route('/convert_pdf', methods=['POST'])
def convert_pdf():
    if 'username' not in session:
        return redirect(url_for('login'))
    wordfile = request.form.get('wordfile')
    filepath = os.path.join('pv', wordfile)
    pdf_filename = wordfile.replace('.docx', '.pdf')
    pdf_path = os.path.join('pv', pdf_filename)
    # Lecture du contenu du PV (simple, à améliorer pour mise en page avancée)
    from docx import Document
    doc = Document(filepath)
    text = ''
    for para in doc.paragraphs:
        text += para.text + '\n'
    # Génération du PDF
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    y = height - 40
    for line in text.split('\n'):
        c.drawString(40, y, line)
        y -= 16
        if y < 40:
            c.showPage()
            y = height - 40
    c.save()
    # Affichage lien de téléchargement
    return render_template('preview.html', data=None, wordfile=wordfile, pdf_file=pdf_filename)

@app.route('/pv/<filename>')
def download_pv(filename):
    if 'username' not in session:
        return redirect(url_for('login'))
    return app.send_static_file(os.path.join('pv', filename))

if __name__ == '__main__':
    app.run(debug=True)
