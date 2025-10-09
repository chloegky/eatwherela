<template>
  <div>
    <h3>My Google Maps Demo</h3>
    <div id="map"></div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  // Load Google Maps JS API
  (g => {
    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary",
      q = "__ib__", m = document, b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams,
      u = () => h || (h = new Promise(async (f, n) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => h = n(Error(p + " could not load."));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
  })({ key: "AIzaSyAb_Mphc8FUiyDLfOvWTYsVTYvipMLi7bo", v: "weekly", libraries: "places" });

  // After maps loaded, get location and render
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      const map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: position,
        mapId: "DEMO_MAP_ID",
      });

      // Marker for your own location
      new AdvancedMarkerElement({
        map,
        position,
        title: "You are here!",
      });

      // Places Service for Nearby Search
      const service = new google.maps.places.PlacesService(map);

      // Search Nearby Restaurants
      service.nearbySearch({
        location: position,
        radius: 1500,
        type: "restaurant"
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (place.geometry && place.geometry.location) {
              new AdvancedMarkerElement({
                map,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                title: place.name
              });
            }
          });
        }
      });

    });
  } else {
    console.log("Geolocation not supported by this browser.");
  }
});
</script>

<style scoped>
#map {
  height: 400px;
  width: 100%;
}

h3 {
  text-align: center;
  font-family: Arial, sans-serif;
}
</style>
