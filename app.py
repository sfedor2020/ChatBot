from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import json
import requests
from datetime import datetime

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# Configuration du répertoire de données
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

PROMPTS_FILE = os.path.join(DATA_DIR, 'prompts.json')
HISTORY_FILE = os.path.join(DATA_DIR, 'conversation_history.json')

# Configuration des limites
MAX_FAVORITES = {
    'mobile': 3,
    'desktop': 6
}

# Chargement de la configuration
def load_config():
    """Charge la configuration depuis le fichier config.json"""
    try:
        with open('config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        default_config = {
            "model": "mistral:latest",
            "ollama_url": "http://localhost:11434",
            "temperature": 0.7,
            "max_length": 500,
            "system_prompt": "Vous êtes un assistant IA serviable."
        }
        with open('config.json', 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config
    except Exception as e:
        print(f"Erreur lors du chargement de la configuration: {e}")
        return None

config = load_config()

def load_history():
    """Charge l'historique des conversations depuis le fichier JSON"""
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Erreur lors du chargement de l'historique: {e}")
        return []

def save_history(history):
    """Sauvegarde l'historique des conversations dans le fichier JSON"""
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de l'historique: {e}")
        return False

def load_prompts():
    """Charge les prompts depuis le fichier JSON"""
    try:
        if os.path.exists(PROMPTS_FILE):
            with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Erreur lors du chargement des prompts: {e}")
        return []

def save_prompts(prompts):
    """Sauvegarde les prompts dans le fichier JSON"""
    try:
        with open(PROMPTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde des prompts: {e}")
        return False

# Routes pour servir les pages
@app.route('/')
@app.route('/chat')
def home():
    return send_from_directory('frontend/pages', 'index.html')

@app.route('/settings')
def settings():
    return send_from_directory('frontend/pages', 'settings.html')

@app.route('/history')
def history():
    return send_from_directory('frontend/pages', 'history.html')

@app.route('/prompts')
def prompts_page():
    return send_from_directory('frontend/pages', 'prompts.html')

@app.route('/about')
def about():
    return send_from_directory('frontend/pages', 'about.html')

# Route pour les prompts par défaut
@app.route('/resources/json/default_prompts.json')
def default_prompts():
    return send_from_directory('frontend/resources/json', 'default_prompts.json')

# Endpoints des prompts
@app.route('/api/prompts', methods=['GET'])
def get_prompts():
    try:
        prompts = load_prompts()
        return jsonify(prompts)
    except Exception as e:
        print(f"Erreur lors de la récupération des prompts: {e}")
        return {'error': str(e)}, 500

@app.route('/api/prompts', methods=['POST'])
def add_prompt():
    try:
        prompt = request.json
        if not prompt or not all(k in prompt for k in ['title', 'category', 'text']):
            return {'error': 'Données de prompt invalides'}, 400
        
        prompts = load_prompts()
        
        # Ajouter le nouveau prompt avec ID et statut favori par défaut
        prompt['id'] = str(len(prompts) + 1)
        prompt['isFavorite'] = False
        prompts.append(prompt)
        
        if save_prompts(prompts):
            return jsonify({"message": "Prompt sauvegardé avec succès", "id": prompt['id']}), 201
        else:
            return {'error': 'Échec de la sauvegarde du prompt'}, 500

    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/prompts/<prompt_id>', methods=['PUT'])
def update_prompt(prompt_id):
    try:
        prompt_data = request.json
        if not prompt_data or not all(k in prompt_data for k in ['title', 'category', 'text']):
            return {'error': 'Données de prompt invalides'}, 400
        
        prompts = load_prompts()
        prompt_index = next((i for i, p in enumerate(prompts) if p['id'] == prompt_id), None)
        
        if prompt_index is None:
            return {'error': 'Prompt non trouvé'}, 404

        # Conserver le statut favori et l'ID
        prompt_data['isFavorite'] = prompts[prompt_index].get('isFavorite', False)
        prompt_data['id'] = prompt_id
        prompts[prompt_index] = prompt_data
        
        if save_prompts(prompts):
            return {'message': 'Prompt mis à jour avec succès'}, 200
        else:
            return {'error': 'Échec de la mise à jour du prompt'}, 500

    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/prompts/<prompt_id>', methods=['DELETE'])
def delete_prompt(prompt_id):
    try:
        prompts = load_prompts()
        prompts = [p for p in prompts if p['id'] != prompt_id]
        
        if save_prompts(prompts):
            return '', 204
        else:
            return {'error': 'Échec de la suppression du prompt'}, 500

    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/prompts/favorites', methods=['POST'])
def toggle_favorite():
    try:
        data = request.json
        prompt_id = data.get('promptId')
        action = data.get('action')
        is_mobile = request.headers.get('X-Mobile', 'false').lower() == 'true'
        
        if not prompt_id or action not in ['add', 'remove']:
            return {'error': 'Données de requête invalides'}, 400

        prompts = load_prompts()
        
        # Compter les favoris actuels
        favorite_count = sum(1 for p in prompts if p.get('isFavorite', False))
        max_favorites = MAX_FAVORITES['mobile'] if is_mobile else MAX_FAVORITES['desktop']

        prompt_index = next((i for i, p in enumerate(prompts) if p['id'] == prompt_id), None)
        if prompt_index is None:
            return {'error': 'Prompt non trouvé'}, 404

        if action == 'add':
            if favorite_count >= max_favorites:
                return {'error': 'FAVORITES_LIMIT_REACHED'}, 400
            prompts[prompt_index]['isFavorite'] = True
        else:
            prompts[prompt_index]['isFavorite'] = False

        if save_prompts(prompts):
            return {'success': True}
        else:
            return {'error': 'Échec de la sauvegarde des prompts'}, 500

    except Exception as e:
        print(f"Erreur lors de la modification des favoris: {e}")
        return {'error': str(e)}, 500

# Endpoint de chat
@app.route('/chat', methods=['POST'])
def chat():
    try:
        if not config:
            return {'error': 'Configuration non chargée correctement'}, 500

        message = request.json.get('prompt')
        conversation_id = request.json.get('conversationId')
        timestamp = request.json.get('timestamp')
        context = request.json.get('context', [])
        is_title = request.json.get('isTitle', False)
        
        if not message:
            return {'error': 'Aucun message fourni'}, 400

        print(f"Envoi de la requête à Ollama avec le message: {message}")

        # Construire le prompt avec le contexte si disponible
        prompt = message
        if context and not is_title:
            # Extraire les derniers messages pour le contexte
            recent_context = " ".join([f"{'Utilisateur' if m['isUser'] else 'Assistant'}: {m['text']}" 
                                     for m in context[-4:]])
            prompt = f"{recent_context}\n\nUtilisateur: {message}"

        response = requests.post(
            f"{config['ollama_url']}/api/generate",
            json={
                'model': config['model'],
                'prompt': prompt,
                'stream': False,
                'temperature': config.get('temperature', 0.7),
                'max_length': config.get('max_length', 500)
            }
        )

        if response.ok:
            return response.json()
        else:
            print(f"Erreur Ollama: {response.text}")
            return {
                'error': f'Erreur Ollama: Statut {response.status_code}, {response.text}'
            }, 500

    except requests.exceptions.ConnectionError:
        return {
            'error': 'Impossible de se connecter à Ollama. Assurez-vous qu\'il est en cours d\'exécution.'
        }, 503
    except Exception as e:
        print(f"Erreur inattendue dans l'endpoint chat: {str(e)}")
        return {'error': str(e)}, 500

# Endpoints de l'historique des conversations
@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    try:
        history = load_history()
        # Trier par horodatage décroissant (plus récent d'abord)
        history.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        return jsonify(history)
    except Exception as e:
        print(f"Erreur lors de la récupération des conversations: {e}")
        return {'error': str(e)}, 500

@app.route('/api/conversations', methods=['POST'])
def save_conversation():
    try:
        conversation = request.json
        if not conversation:
            return {'error': 'Aucune donnée de conversation fournie'}, 400

        # Vérifier les champs requis
        if 'messages' not in conversation:
            return {'error': 'La conversation doit inclure des messages'}, 400

        # S'assurer que l'horodatage existe
        if 'timestamp' not in conversation:
            conversation['timestamp'] = int(datetime.now().timestamp() * 1000)

        history = load_history()
        
        # Vérifier si la conversation existe déjà (mise à jour si c'est le cas)
        existing_index = next((i for i, conv in enumerate(history) 
                             if conv.get('timestamp') == conversation.get('timestamp')), None)
        
        if existing_index is not None:
            history[existing_index] = conversation
        else:
            history.append(conversation)

        if save_history(history):
            return {'message': 'Conversation sauvegardée avec succès'}, 201
        else:
            return {'error': 'Échec de la sauvegarde de la conversation'}, 500

    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la conversation: {e}")
        return {'error': str(e)}, 500

@app.route('/api/conversations/<timestamp>', methods=['DELETE'])
def delete_conversation(timestamp):
    try:
        history = load_history()
        # Convertir l'horodatage en entier pour la comparaison
        timestamp = int(timestamp)
        
        # Filtrer la conversation avec l'horodatage correspondant
        new_history = [conv for conv in history 
                      if conv.get('timestamp') != timestamp]
        
        if len(new_history) == len(history):
            return {'error': 'Conversation non trouvée'}, 404

        if save_history(new_history):
            return '', 204
        else:
            return {'error': 'Échec de la sauvegarde de l\'historique mis à jour'}, 500

    except Exception as e:
        print(f"Erreur lors de la suppression de la conversation: {e}")
        return {'error': str(e)}, 500

@app.route('/api/conversations/clear', methods=['POST'])
def clear_history():
    try:
        if save_history([]):
            return {'message': 'Historique effacé avec succès'}
        else:
            return {'error': 'Échec de l\'effacement de l\'historique'}, 500
    except Exception as e:
        print(f"Erreur lors de l'effacement de l'historique: {e}")
        return {'error': str(e)}, 500

# Endpoints des paramètres
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(config)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        new_settings = request.json
        if not new_settings:
            return {'error': 'Aucun paramètre fourni'}, 400
        
        config.update(new_settings)
        with open('config.json', 'w') as f:
            json.dump(config, f, indent=4)
        
        return jsonify({"message": "Paramètres mis à jour avec succès"})
    except Exception as e:
        return {'error': str(e)}, 500

# Route générique pour les fichiers statiques
@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('frontend', filename)

if __name__ == '__main__':
    print("Démarrage du serveur...")
    print(f"Configuration actuelle: {json.dumps(config, indent=2)}")
    app.run(debug=True)