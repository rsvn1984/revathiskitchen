// =========================================
// Revathi's Kitchen - Customer Registration
// Location Handling
// =========================================

const currentLocationButton = document.getElementById("current-location");
const locationStatus = document.getElementById("location-status");
const latitudeField = document.getElementById("latitude");
const longitudeField = document.getElementById("longitude");

currentLocationButton.addEventListener("click", function () {

    if (!navigator.geolocation) {
        locationStatus.textContent =
            "Geolocation is not supported by this browser.";
        return;
    }

    locationStatus.textContent =
        "📍 Getting your current location...";

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            latitudeField.value = latitude;
            longitudeField.value = longitude;

            locationStatus.textContent =
                `📍 Location selected: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        },

        function (error) {

            if (error.code === error.PERMISSION_DENIED) {
                locationStatus.textContent =
                    "Location permission was denied. Please allow location access.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                locationStatus.textContent =
                    "Unable to determine your location.";
            } else if (error.code === error.TIMEOUT) {
                locationStatus.textContent =
                    "Location request timed out. Please try again.";
            } else {
                locationStatus.textContent =
                    "Unable to get your location.";
            }

        }
    );
});
// =========================================
// Choose Location on Map
// =========================================

const mapLocationButton = document.getElementById("map-location");
const mapContainer = document.getElementById("map-container");
const confirmMapLocationButton =
    document.getElementById("confirm-map-location");

let locationMap = null;
let locationMarker = null;
let selectedMapLatitude = null;
let selectedMapLongitude = null;

mapLocationButton.addEventListener("click", function () {

    mapContainer.style.display = "block";

    // Create the map only the first time
    if (!locationMap) {

        // Start with a general India view
        locationMap = L.map("location-map").setView(
            [20.5937, 78.9629],
            5
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; OpenStreetMap contributors'
            }
        ).addTo(locationMap);

        // Allow the customer to click anywhere on the map
        locationMap.on("click", function (event) {

            selectedMapLatitude = event.latlng.lat;
            selectedMapLongitude = event.latlng.lng;

            if (locationMarker) {
                locationMarker.setLatLng(event.latlng);
            } else {
                locationMarker = L.marker(event.latlng).addTo(locationMap);
            }

            locationMarker.bindPopup(
                "Selected Delivery Location"
            ).openPopup();

        });

    }

    // Fix Leaflet display when the map becomes visible
    setTimeout(function () {
        locationMap.invalidateSize();
    }, 100);

});


confirmMapLocationButton.addEventListener(
    "click",
    function () {

        if (
            selectedMapLatitude === null ||
            selectedMapLongitude === null
        ) {
            locationStatus.textContent =
                "📍 Please select a location on the map first.";
            return;
        }

        latitudeField.value = selectedMapLatitude;
        longitudeField.value = selectedMapLongitude;

        locationStatus.textContent =
            `📍 Map location selected: ${selectedMapLatitude.toFixed(6)}, ${selectedMapLongitude.toFixed(6)}`;

        mapContainer.style.display = "none";
    }
);