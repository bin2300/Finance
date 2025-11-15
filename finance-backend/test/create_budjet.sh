#!/bin/bash

API_URL="http://localhost:3000"

EMAIL="test2@test.com"
PASSWORD="123456"

TOKEN=""

# -------------------------------
# Connexion
# -------------------------------
login() {
  echo "➡️  Connexion..."

  TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    | jq -r '.token')

  if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Token introuvable."
  else
    echo "🎉 Token récupéré : $TOKEN"
  fi
}

# -------------------------------
# Créer un budget
# -------------------------------
create_budget() {
  if [ -z "$TOKEN" ]; then echo "❌ Login d'abord."; return; fi

  echo "➡️  Création du budget..."

  curl -s -X POST "$API_URL/budgets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "Budget Vacances",
      "amount": 1500,
      "type": "sortie",
      "description": "Voyage d’été"
    }' | jq

  echo
}

# -------------------------------
# Lister budgets
# -------------------------------
get_budgets() {
  if [ -z "$TOKEN" ]; then echo "❌ Login d'abord."; return; fi

  echo "➡️  Liste des budgets :"
  curl -s -X GET "$API_URL/budgets" \
    -H "Authorization: Bearer $TOKEN" | jq

  echo
}

# -------------------------------
# Modifier budget
# -------------------------------
update_budget() {
  if [ -z "$TOKEN" ]; then echo "❌ Login d'abord."; return; fi

  read -p "ID du budget à modifier : " ID

  echo "➡️  Modification du budget $ID ..."

  curl -s -X PUT "$API_URL/budgets/$ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "Budget Modifié",
      "amount": 2000,
      "type": "sortie",
      "description": "Changé pour les tests"
    }' | jq

  echo
}

# -------------------------------
# Supprimer budget
# -------------------------------
delete_budget() {
  if [ -z "$TOKEN" ]; then echo "❌ Login d'abord."; return; fi

  read -p "ID du budget à supprimer : " ID

  echo "➡️  Suppression du budget $ID ..."

  curl -s -X DELETE "$API_URL/budgets/$ID" \
    -H "Authorization: Bearer $TOKEN" | jq

  echo
}

# -------------------------------
# Menu
# -------------------------------
menu() {
  while true; do
    echo ""
    echo "==============================="
    echo "   🧪 MENU TEST BUDGET API"
    echo "==============================="
    echo "1) Login"
    echo "2) Créer un budget"
    echo "3) Lister les budgets"
    echo "4) Modifier un budget"
    echo "5) Supprimer un budget"
    echo "0) Quitter"
    echo "==============================="
    read -p "Choix : " choice

    case $choice in
      1) login ;;
      2) create_budget ;;
      3) get_budgets ;;
      4) update_budget ;;
      5) delete_budget ;;
      0) exit ;;
      *) echo "🤨 Option invalide (¬_¬)" ;;
    esac
  done
}

menu
