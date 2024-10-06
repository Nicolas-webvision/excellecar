document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });
});

// Map calculateur de trajet

let map;
let service;
let infowindow;
let autocompleteStart, autocompleteEnd;

window.onload = function() {
    // Vérifier si l'élément 'map' existe sur la page
    if (document.getElementById("map")) {
        initMap(); // Si l'élément 'map' existe, initialiser la carte
    }
};

function initMap() {
    // Initialiser la carte
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 48.8566, lng: 2.3522 }, // Coordonnées de Paris
        zoom: 13,
    });

    // Ajouter l'auto-complétion pour les champs d'adresses
    const inputStart = document.getElementById("start");
    const inputEnd = document.getElementById("end");

    // Vérification que la bibliothèque Places est disponible
    if (google.maps.places) {
        // Auto-complétion pour l'adresse de départ
        autocompleteStart = new google.maps.places.Autocomplete(inputStart);
        autocompleteStart.addListener('place_changed', function() {
            const place = autocompleteStart.getPlace();
            if (!place.geometry) {
                alert("L'adresse de départ n'a pas pu être trouvée.");
                return;
            }
            // Centrer la carte sur l'adresse de départ
            map.setCenter(place.geometry.location);
        });

        // Auto-complétion pour l'adresse d'arrivée
        autocompleteEnd = new google.maps.places.Autocomplete(inputEnd);
        autocompleteEnd.addListener('place_changed', function() {
            const place = autocompleteEnd.getPlace();
            if (!place.geometry) {
                alert("L'adresse d'arrivée n'a pas pu être trouvée.");
                return;
            }
            // Centrer la carte sur l'adresse d'arrivée
            map.setCenter(place.geometry.location);
        });
    } else {
        console.error("L'API Google Places n'est pas disponible.");
    }
}

// Calcul de la distance et du prix basé sur les adresses et le type de véhicule
if (document.getElementById("calculateDistance")) {
    document.getElementById("calculateDistance").addEventListener("click", function() {
        const start = document.getElementById("start").value;
        const end = document.getElementById("end").value;
        const vehicleType = document.getElementById("vehicleType").value;
        const time = document.getElementById("time").value; // Récupère l'heure entrée par l'utilisateur

        if (!start || !end) {
            alert("Veuillez entrer des adresses valides.");
            return;
        }

        const service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix({
            origins: [start],
            destinations: [end],
            travelMode: 'DRIVING',
        }, function(response, status) {
            if (status === 'OK') {
                const distance = response.rows[0].elements[0].distance.value / 1000; // Convertir en kilomètres
                let price = 15 + (distance * 2.5); // Tarification jour : 15€ de base + 2.50€/km

                // Ajuster les prix selon le type de véhicule
                switch (vehicleType) {
                    case 'luxe':
                        price *= 1.5; // Supplément pour véhicule de luxe
                        break;
                    case 'van':
                        price *= 1.2; // Supplément pour van
                        break;
                    default:
                        break;
                }

                // Calcul du tarif jour/nuit : nuit de 19h à 7h
                const hour = parseInt(time.split(':')[0]); 
                if (hour >= 19 || hour < 7) {
                    price *= 1.5; // Majoration de 50% pour les heures de nuit
                }

                // Application du tarif minimum de 25€ pour les trajets de 3 km ou moins
                if (distance <= 3) {
                    price = Math.max(price, 25); // Assurer que le prix soit au moins 25€
                }

                // Afficher la distance et le prix estimé
                document.getElementById("distanceOutput").textContent = `Distance: ${distance.toFixed(2)} km`;
                document.getElementById("priceOutput").textContent = `Prix estimé: ${price.toFixed(2)} €`;
            } else {
                alert('Erreur lors de la récupération des informations de distance.');
            }
        });
    });
}

