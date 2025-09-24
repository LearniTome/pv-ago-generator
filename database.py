from models import db, Entreprise, Associe, PV, Template, User, Statistics
from datetime import datetime

class DatabaseManager:
    @staticmethod
    def save_pv(username, type_societe, nom_entreprise, filename, associes=None):
        """Sauvegarde un nouveau PV et ses associés."""
        try:
            # Créer le PV
            new_pv = PV(
                username=username,
                type_societe=type_societe,
                nom_entreprise=nom_entreprise,
                filename=filename
            )
            db.session.add(new_pv)
            db.session.flush()  # Pour obtenir l'ID du PV

            # Ajouter les associés si fournis
            if associes:
                for associe_data in associes:
                    new_associe = Associe(
                        pv_id=new_pv.id,
                        nom=associe_data['nom'],
                        prenom=associe_data['prenom'],
                        adresse=associe_data['adresse'],
                        cni=associe_data['cni'],
                        cni_validite=associe_data['cni_validite'],
                        cni_lieu=associe_data.get('cni_lieu'),
                        email=associe_data.get('email'),
                        telephone=associe_data.get('telephone'),
                        nombre_parts=associe_data['parts'],
                        pourcentage=associe_data['pourcentage']
                    )
                    db.session.add(new_associe)

            # Ajouter une statistique
            stat = Statistics(
                date=datetime.now(),
                type_societe=type_societe,
                action='generate_pv'
            )
            db.session.add(stat)

            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def save_template(username, name, type_societe, template_data):
        """Sauvegarde un nouveau template."""
        try:
            template = Template(
                username=username,
                name=name,
                type_societe=type_societe,
                template_data=template_data
            )
            db.session.add(template)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_pv_history(username):
        """Récupère l'historique des PV d'un utilisateur."""
        return PV.query.filter_by(username=username).order_by(PV.date_creation.desc()).all()

    @staticmethod
    def get_statistics(days=30):
        """Récupère les statistiques des n derniers jours."""
        from datetime import timedelta
        date_limit = datetime.now() - timedelta(days=days)
        return Statistics.query.filter(Statistics.date >= date_limit).all()

    @staticmethod
    def save_entreprise(nom, type_societe, capital, adresse):
        """Sauvegarde une nouvelle entreprise."""
        try:
            entreprise = Entreprise(
                nom=nom,
                type_societe=type_societe,
                capital=capital,
                adresse=adresse
            )
            db.session.add(entreprise)
            db.session.commit()
            return entreprise
        except Exception as e:
            db.session.rollback()
            raise e