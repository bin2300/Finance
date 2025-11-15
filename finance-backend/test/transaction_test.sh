#!/bin/bash

API_URL="http://localhost:3000"
EMAIL="test2@test.com"
PASSWORD="123456"
TOKEN=""

# LOGIN
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

# LISTER BUDGETS
list_budgets() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    echo "➡️  Liste des budgets :"
    curl -s -X GET "$API_URL/budgets" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# CREER TRANSACTION
create_transaction() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    read -p "ID du budget : " BID
    read -p "Montant : " AMT
    read -p "Label : " LABEL
    read -p "Type (entree/sortie) : " TYPE

    curl -s -X POST "$API_URL/transaction" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"budgetId\": $BID,
            \"amount\": $AMT,
            \"label\": \"$LABEL\",
            \"type\": \"$TYPE\"
        }" | jq
}

# LISTER TRANSACTIONS
list_transactions() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    read -p "ID du budget : " BID
    curl -s -X GET "$API_URL/transaction/$BID" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# MODIFIER TRANSACTION
update_transaction() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    read -p "ID de la transaction : " TID
    read -p "Nouveau montant (laisser vide pour garder) : " AMT
    read -p "Nouveau label (laisser vide pour garder) : " LABEL
    read -p "Nouveau type (laisser vide pour garder) : " TYPE

    DATA="{"
    [ -n "$AMT" ] && DATA="$DATA\"amount\": $AMT,"
    [ -n "$LABEL" ] && DATA="$DATA\"label\": \"$LABEL\","
    [ -n "$TYPE" ] && DATA="$DATA\"type\": \"$TYPE\","
    DATA="${DATA%,}}"

    curl -s -X PUT "$API_URL/transaction/$TID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$DATA" | jq
}

# SUPPRIMER TRANSACTION
delete_transaction() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    read -p "ID de la transaction à supprimer : " TID
    curl -s -X DELETE "$API_URL/transaction/$TID" \
        -H "Authorization: Bearer $TOKEN" | jq
}

# MENU
menu() {
    while true; do
        echo ""
        echo "==============================="
        echo "   🧪 MENU TEST TRANSACTIONS"
        echo "==============================="
        echo "1) Login"
        echo "2) Lister budgets"
        echo "3) Créer transaction"
        echo "4) Lister transactions d'un budget"
        echo "5) Modifier transaction"
        echo "6) Supprimer transaction"
        echo "0) Quitter"
        echo "==============================="
        read -p "Choix : " CHOICE

        case $CHOICE in
            1) login ;;
            2) list_budgets ;;
            3) create_transaction ;;
            4) list_transactions ;;
            5) update_transaction ;;
            6) delete_transaction ;;
            0) exit ;;
            *) echo "🤨 Option invalide (¬_¬)" ;;
        esac
    done
}

menu
