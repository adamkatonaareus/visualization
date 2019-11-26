var map;
var issMarker;
var icon;

function preload()
{
  
}

function setup () 
{
    map = new L.map("myMapId");
    
    //--- Set the tile server, add as a layer. 
    //--- Tile servers: https://wiki.openstreetmap.org/wiki/Tile_servers
    //--- WARN: remove $ from the url.
//    var tileUrl = "https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png";
    tileUrl = "http://c.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg";

    var mapLayer = new L.TileLayer(tileUrl);
    map.addLayer(mapLayer);
//    mapLayer.setOpacity(1);

    // var hillShading = new L.TileLayer("http://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png");
    // map.addLayer(hillShading);
    // hillShading.setOpacity(0.5);

    //--- Set position and zoom
    map.setView(new L.LatLng(30, 18.9877), 2);

    var location = [47.7245, 18.991];
    var marker = new L.marker(location);
    map.addLayer(marker);

    var popup = L.popup();
    marker.bindPopup(popup);
    popup.setContent("Látom a házunkat!<br/>" + location);

    icon = L.icon({
      iconUrl: 'images/international-space-station-icon.png',
      iconSize:     [100, 100]
      });

    putIss();
}

function putIss()
{
    loadJSON("http://api.open-notify.org/iss-now.json", function(iss)
      {
        if (!issMarker)
        {
          issMarker = new L.marker([iss.iss_position.latitude, iss.iss_position.longitude], {icon: icon});
          map.addLayer(issMarker);
        }
        else
        {
          //console.log("Moving ISS to " + iss.iss_position);
          issMarker.setLatLng([iss.iss_position.latitude, iss.iss_position.longitude]);
        }

        window.setTimeout(putIss, 1000);

      });

}

function windowResized () 
{
  resizeCanvas(windowWidth, windowHeight);
}

function draw()
{
}
