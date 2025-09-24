from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialiser SQLAlchemy
db = SQLAlchemy()

class Entreprise(db.Model):
    __tablename__ = 'entreprises'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    type_societe = db.Column(db.String(20), nullable=False)
    capital = db.Column(db.Float, nullable=False)
    adresse = db.Column(db.String(200), nullable=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.now)

class Associe(db.Model):
    __tablename__ = 'associes'
    id = db.Column(db.Integer, primary_key=True)
    pv_id = db.Column(db.Integer, db.ForeignKey('pv.id'), nullable=False)
    nom = db.Column(db.String(50), nullable=False)
    prenom = db.Column(db.String(50), nullable=False)
    adresse = db.Column(db.String(200), nullable=False)
    cni = db.Column(db.String(20), nullable=False)
    cni_validite = db.Column(db.Date, nullable=False)
    cni_lieu = db.Column(db.String(100))
    email = db.Column(db.String(100))
    telephone = db.Column(db.String(20))
    nombre_parts = db.Column(db.Integer, nullable=False)
    pourcentage = db.Column(db.Float, nullable=False)

class PV(db.Model):
    __tablename__ = 'pv'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.now)
    type_societe = db.Column(db.String(20), nullable=False)
    nom_entreprise = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    associes = db.relationship('Associe', backref='pv', lazy=True)

class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type_societe = db.Column(db.String(20), nullable=False)
    template_data = db.Column(db.Text, nullable=False)
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.now)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(100))
    date_creation = db.Column(db.DateTime, nullable=False, default=datetime.now)

class Statistics(db.Model):
    __tablename__ = 'statistics'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    type_societe = db.Column(db.String(20), nullable=False)
    action = db.Column(db.String(50), nullable=False)