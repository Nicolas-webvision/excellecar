document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
});

// Map calculateur de trajet

let map;
let autocompleteStart, autocompleteEnd;

window.onload = function() {
    // Initialisation de la carte
    if (document.getElementById("map")) {
        initMap(); // Initialiser la carte
    }

    // Ajouter un écouteur d'événement pour le bouton "Ajouter une étape"
    document.getElementById("addStep").addEventListener("click", function() {
        // Ajouter un nouveau champ pour une étape
        const stepContainer = document.getElementById("stepInputs");
        const newStepInput = document.createElement("input");
        newStepInput.type = "text";
        newStepInput.classList.add("stepInput");
        newStepInput.placeholder = "Entrez une étape intermédiaire";
        stepContainer.appendChild(newStepInput);
    });
};

// Initialisation de la carte
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 48.8566, lng: 2.3522 }, // Coordonnées de Paris
        zoom: 13,
    });

    const inputStart = document.getElementById("start");
    const inputEnd = document.getElementById("end");

    // Auto-complétion pour les adresses
    if (google.maps.places) {
        autocompleteStart = new google.maps.places.Autocomplete(inputStart);
        autocompleteStart.addListener('place_changed', function() {
            const place = autocompleteStart.getPlace();
            if (!place.geometry) {
                alert("L'adresse de départ n'a pas pu être trouvée.");
                return;
            }
            map.setCenter(place.geometry.location);
        });

        autocompleteEnd = new google.maps.places.Autocomplete(inputEnd);
        autocompleteEnd.addListener('place_changed', function() {
            const place = autocompleteEnd.getPlace();
            if (!place.geometry) {
                alert("L'adresse d'arrivée n'a pas pu être trouvée.");
                return;
            }
            map.setCenter(place.geometry.location);
        });
    }
}

// Calcul de la distance et du prix
if (document.getElementById("calculateDistance")) {
    document.getElementById("calculateDistance").addEventListener("click", function() {
        const start = document.getElementById("start").value;
        const end = document.getElementById("end").value;
        const vehicleType = document.getElementById("vehicleType").value;
        const serviceType = document.getElementById("serviceType").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        // Récupérer les étapes ajoutées dynamiquement
        const stepInputs = document.querySelectorAll(".stepInput");
        const steps = Array.from(stepInputs).map(input => input.value.trim()).filter(value => value !== "");

        if (!start || !end) {
            alert("Veuillez entrer des adresses valides.");
            return;
        }

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix({
            origins: [start],
            destinations: [end, ...steps],
            travelMode: 'DRIVING',
        }, function(response, status) {
            if (status === 'OK') {
                const distance = response.rows[0].elements[0].distance.value / 1000; // Convertir en kilomètres
                let price = 15 + (distance * 2.5); // Tarification de base : 15€ + 2.50€/km

                // Ajuster les prix en fonction du type de véhicule
                if (vehicleType === 'van') {
                    price *= 1.2; // Tarif pour le Van
                }

                // Ajuster les prix selon le type de prestation
                if (serviceType === 'allerRetour') {
                    price -= (distance * 0.25); // Réduction de 0.25€/km pour aller-retour
                } else if (serviceType === 'miseDispo') {
                    price = Math.max(60, price); // Tarification minimum de 60€ pour mise à disposition
                }

                // Calcul du tarif de nuit (50% supplémentaire)
                const hour = parseInt(time.split(':')[0]); 
                if (hour >= 19 || hour < 7) {
                    price *= 1.5; // Majoration de 50% pour les heures de nuit
                }

                // Ajouter le prix des étapes
                steps.forEach(function(step) {
                    price += 5; // Ajouter 5€ par étape
                });

                // Afficher la distance et le prix
                document.getElementById("distanceOutput").textContent = `Distance: ${distance.toFixed(2)} km`;
                document.getElementById("priceOutput").textContent = `Prix estimé: ${price.toFixed(2)} €`;
            } else {
                alert('Erreur lors du calcul de la distance.');
            }
        });
    });
}

// Envoyer la réservation par SMS
if (document.getElementById("bookNow")) {
    document.getElementById("bookNow").addEventListener("click", function() {
        // Récupérer les informations saisies
        const start = document.getElementById("start").value;
        const end = document.getElementById("end").value;
        const vehicleType = document.getElementById("vehicleType").value;
        const serviceType = document.getElementById("serviceType").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        // Récupérer les étapes
        const stepInputs = document.querySelectorAll(".stepInput");
        const steps = Array.from(stepInputs).map(input => input.value.trim()).filter(value => value !== "");

        // Créer un message pour le SMS
        let message = `Réservation :\n`;
        message += `Départ : ${start}\n`;
        message += `Arrivée : ${end}\n`;
        message += `Véhicule : ${vehicleType === 'berline' ? 'Berline' : 'Van'}\n`;
        message += `Prestation : ${serviceType === 'simple' ? 'Trajet simple' : serviceType === 'allerRetour' ? 'Aller-retour' : 'Mise à disposition'}\n`;
        message += `Date : ${date}\n`;
        message += `Heure de départ : ${time}\n`;

        if (steps.length > 0) {
            message += `Étapes : ${steps.join(', ')}\n`;
        }

        // Envoi du SMS
        const phoneNumber = "+33772049478"; 
        const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
        window.location.href = smsLink;
    });
}
