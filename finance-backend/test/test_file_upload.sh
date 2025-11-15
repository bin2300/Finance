#!/bin/bash

API_URL="http://localhost:3000"
EMAIL="test2@test.com"
PASSWORD="123456"
TOKEN=""

# -----------------------------
# LOGIN
# -----------------------------
login() {
    echo "➡️  Connexion..."
    TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo "❌ Impossible de récupérer le token."
    else
        echo "🎉 Token récupéré : $TOKEN"
    fi
}

# -----------------------------
# LISTER TRANSACTIONS
# -----------------------------
list_transactions() {
    if [ -z "$TOKEN" ]; then echo "❌ Token manquant. Fais un login."; return; fi
    
    read -p "ID du budget : " BID
    curl -s -X GET "$API_URL/transaction/$BID" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# -----------------------------
# UPLOAD FICHIER POUR TRANSACTION
# -----------------------------
upload_file() {
    if [ -z "$TOKEN" ]; then echo "❌ Token manquant. Fais un login."; return; fi

    read -p "ID de la transaction : " TID
    read -p "Chemin du fichier à envoyer : " FILE_PATH

    if [ ! -f "$FILE_PATH" ]; then
        echo "❌ Fichier introuvable : $FILE_PATH"
        return
    fi

    echo "➡️  Upload du fichier : $FILE_PATH"

    curl -s -X POST "$API_URL/uploads/$TID" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$FILE_PATH" | jq
}

# -----------------------------
# LISTER FICHIERS D'UNE TRANSACTION
# -----------------------------
list_files() {
    if [ -z "$TOKEN" ]; then echo "❌ Token manquant. Fais un login."; return; fi

    read -p "ID de la transaction : " TID

    curl -s -X GET "$API_URL/uploads/$TID" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# -----------------------------
# TÉLÉCHARGER UN FICHIER
# -----------------------------
download_file() {
    if [ -z "$TOKEN" ]; then echo "❌ Token manquant. Fais un login."; return; fi

    read -p "ID du fichier à télécharger : " FID
    read -p "Nom du fichier de sortie : " OUT

    echo "➡️  Téléchargement du fichier..."

    curl -s -X GET "$API_URL/uploads/download/$FID" \
        -H "Authorization: Bearer $TOKEN" \
        --output "$OUT"

    if [ $? -eq 0 ]; then
        echo "🎉 Fichier téléchargé → $OUT"
    else
        echo "❌ Échec du téléchargement"
    fi
}

# -----------------------------
# SUPPRIMER UN FICHIER
# -----------------------------
delete_file() {
    if [ -z "$TOKEN" ]; then echo "❌ Token manquant. Fais un login."; return; fi

    read -p "ID du fichier à supprimer : " FID

    echo "➡️  Suppression du fichier..."

    curl -s -X DELETE "$API_URL/uploads/$FID" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# -----------------------------
# MENU
# -----------------------------
menu() {
    while true; do
        echo ""
        echo "=================================="
        echo "   🧪 MENU TEST UPLOAD FICHIERS"
        echo "=================================="
        echo "1) Login"
        echo "2) Lister transactions"
        echo "3) Upload fichier"
        echo "4) Lister fichiers"
        echo "5) Télécharger fichier"
        echo "6) Supprimer fichier"
        echo "0) Quitter"
        echo "=================================="

        read -p "Choix : " CHOICE

        case $CHOICE in
            1) login ;;
            2) list_transactions ;;
            3) upload_file ;;
            4) list_files ;;
            5) download_file ;;
            6) delete_file ;;
            0) exit ;;
            *) echo "🤨 Option invalide (¬_¬)" ;;
        esac
    done
}

menu
