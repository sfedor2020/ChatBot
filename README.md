# Wrapper IA pour les modèles Ollama

Interface de chat IA développée pour les modèles **Ollama**, permettant une interaction efficace et intuitive avec le modèle **Mistral**.

## Prérequis

Avant d'utiliser ce projet, assurez-vous que les éléments suivants sont installés sur votre système :  
1. [Ollama](https://ollama.com/)  
2. Python 3.x  

> **Note :** Les instructions ci-dessous s'appliquent aux systèmes **macOS** et **Windows**.

---

## Instructions pour macOS et Windows

### 1. **Installer Ollama**  
   Téléchargez et installez Ollama en suivant les instructions sur le site officiel :  
   [Télécharger Ollama](https://ollama.com/).  

---

### 2. **Installer le modèle Ollama requis**  
   Après avoir configuré Ollama, exécutez la commande suivante dans votre terminal (macOS) ou PowerShell (Windows) pour installer le modèle **Mistral** :  
   ```bash
   ollama run mistral
   ```

---

### 3. **Installer les dépendances Python**  
   Vérifiez que Python 3.x est installé sur votre système. Ensuite, installez les dépendances nécessaires en exécutant :  
   ```bash
   pip install -r requirements.txt
   ```

---

### 4. **Lancer l'application**  
   Exécutez l'application avec la commande suivante :  
   ```bash
   python app.py
   ```

---

### 5. **Accéder à l'application**  
   Une fois l'application démarrée, ouvrez l'URL affichée dans la sortie du terminal ou de PowerShell pour accéder à l'application sur **localhost**.

---

Si vous avez des questions ou des problèmes, n'hésitez pas à ouvrir une issue.


### 6. **Structure du Projet**  

- `frontend/` : Interface utilisateur en HTML/CSS/JS
- `backend/` : API Flask 
