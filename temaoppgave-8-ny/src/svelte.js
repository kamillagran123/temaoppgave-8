import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;

mapboxgl.accessToken = 'pk.eyJ1Ijoia2FtaWxsYWdyYW4iLCJhIjoiY2s4anVmdG53MDhjNTNkbTd6cDV3a3RiYiJ9.uuJaQhzUUVJzjW0HT2dH2Q';

const map = new mapboxgl.Map({
container: 'kart',
style: 'mapbox://styles/mapbox/dark-v10',
zoom: 10,
center:[10.741439, 59.902358]
});

const ladere = [
    {
        navn: "Ladestasjon- Skøyen", 
        tekst: "20 hurtigladere",
        info: "Drammensveien 161B",
        lng: 10.676418,
        lat: 59.921739

    },
    {
        navn: "Ladestasjon-Majorstuen", 
        tekst: "32 hurtigladere",
        info: "Neuberggata 14",
        lng: 10.714872,
        lat: 59.925719

    }, 

    {
        navn: "Ladestasjon-Vulkan", 
        tekst: "104 hurtigladere",
        info: "Vulkan 5",
        lng: 10.751481,
        lat: 59.923378


    },

    {
        navn: "Ladestasjon-Sofienberg", 
        tekst: "14 hurtigladere",
        info:"Monrads gate 13A",
        lng: 10.774352,
        lat: 59.918509

    },

    {
        navn: "Ladestasjon-Storo", 
        tekst: "19 hurtigladere",
        info: "Vitaminveien 11",
        lng: 10.771758,
        lat: 59.948111

    },

    {
        navn: "Ladestasjon-Økern", 
        tekst: "16 hurtigladere",
        info: "Østre Aker vei 29",
        lng: 10.809863,
        lat: 59.927673
        
    }, 

    {
        navn: "Ladestasjon-Ullevål", 
        tekst: "7 hurtigladere",
        info: "Klaus Torgårds vei 3",
        lng: 10.723094,
        lat: 59.948365
        
    }, 

    {
        navn: "Ladestasjon-Bekkelaget", 
        tekst: "11 hurtigladere",
        info: "Mosseveien 147",
        lng: 10.773599,
        lat: 59.880071
        
    },

    {
        navn: "Ladestasjon-Bryn", 
        tekst: "30 hurtigladere",
        info: "Østensjøveien 79",
        lng: 10.821667,
        lat:  59.903924
        
    },
    {
        navn: "Ladestasjon-Abildsø", 
        tekst: "10 hurtigladere",
        info: "Lambertseterveien 70",
        lng: 10.820017,
        lat: 59.879559
        
    }

]


const addMarker = (lader) => {
    const div = document.createElement("div")
    div.className = "elbilmark"

    const marker = new mapboxgl.Marker(div)
    const minPopup = new mapboxgl.Popup()
    minPopup.setHTML(`
        <h3>${lader.navn}</h3>
        <p>${lader.tekst}</p>
        <p>${lader.info}</p>
        `)
    

    marker.setLngLat([lader.lng, lader.lat]) 
    marker.setPopup(minPopup)

    marker.addTo(map) 
}

const addMarkers = () => {
    for(const lader of ladere) {
        addMarker(lader)
    }
}

map.on("load", addMarkers)


map.addControl(
    new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
    })
    );

const btnDayMode = document.querySelector("#btnDayMode")

const changeMode = () => {
    map.setStyle("mapbox://styles/mapbox/navigation-guidance-day-v4")
}

btnDayMode.onclick = changeMode