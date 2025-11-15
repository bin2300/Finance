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

# RECHERCHE TEXTE / MONTANT EXACT
search_text() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    echo "➡️  Recherche texte ou montant exact"
    echo "Filtres disponibles : budget | transaction | file | (laisser vide pour tout)"
    read -p "Filtre : " FILTER
    read -p "Texte ou montant à rechercher : " QUERY

    if [ -z "$QUERY" ]; then
        echo "❌ La valeur de recherche est requise."
        return
    fi

    curl -s -G "$API_URL/search" \
        -H "Authorization: Bearer $TOKEN" \
        --data-urlencode "filter=$FILTER" \
        --data-urlencode "query=$QUERY" | jq
}

# RECHERCHE PAR PLAGE DE MONTANT
search_range() {
    if [ -z "$TOKEN" ]; then echo "❌ Pas de token, login d'abord."; return; fi

    echo "➡️  Recherche par plage de montant"
    echo "Type disponible : budget | transaction"
    read -p "Type : " TYPE
    read -p "Montant minimum (laisser vide si aucun) : " MIN
    read -p "Montant maximum (laisser vide si aucun) : " MAX

    if [ -z "$TYPE" ] || [[ "$TYPE" != "budget" && "$TYPE" != "transaction" ]]; then
        echo "❌ Type invalide."
        return
    fi

    if [ -z "$MIN" ] && [ -z "$MAX" ]; then
        echo "❌ Au moins min ou max doit être défini."
        return
    fi

    curl -s -G "$API_URL/search/range" \
        -H "Authorization: Bearer $TOKEN" \
        --data-urlencode "type=$TYPE" \
        --data-urlencode "min=$MIN" \
        --data-urlencode "max=$MAX" | jq
}

# MENU
menu() {
    while true; do
        echo ""
        echo "==============================="
        echo "       🔍 MENU TEST SEARCH"
        echo "==============================="
        echo "1) Login"
        echo "2) Rechercher texte / montant exact"
        echo "3) Rechercher par plage de montant"
        echo "0) Quitter"
        echo "==============================="
        read -p "Choix : " CHOICE

        case $CHOICE in
            1) login ;;
            2) search_text ;;
            3) search_range ;;
            0) exit ;;
            *) echo "🤨 Option invalide (¬_¬)" ;;
        esac
    done
}

menu
