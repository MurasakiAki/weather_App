var express = require('express');
var bodyParser = require('body-parser'); // Import body-parser 
const app = express();


app.use(express.static('public'));
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get("/", async (req, res) => {
  res.render("pages/index")
}); 

app.post("/process-location", async (req, res) => {
  locationName = req.body.locationName;
  console.log("Location Name:", locationName);
  const latLonArray = await getLatLon(await fetchLocation(locationName));
  if (latLonArray) {
      const fetchedData = await fetchData(latLonArray);
      if (fetchedData) {
          console.log(fetchedData)
          var current_date_time = getCurrentTime();

          var times = fetchedData.hourly.time;
          var temperatures = fetchedData.hourly.temperature_2m;
          var rains = fetchedData.hourly.rain;
          var showers = fetchedData.hourly.showers;
          var snowfalls = fetchedData.hourly.snowfall;
          var pressures = fetchedData.hourly.vapour_pressure_deficit;

          var timeIndex = getTimeIndex(times, current_date_time);
          const current = [temperatures[timeIndex],rains[timeIndex], showers[timeIndex], snowfalls[timeIndex], pressures[timeIndex]];
          res.render("pages/show_page", {
              times: times,
              timeIndex: timeIndex + 1,
              temperatures: temperatures,
              rains: rains,
              showers: showers,
              snowfalls: snowfalls,
              pressures: pressures,
              current: current,
          });
      } else {
          res.send("Failed to fetch data");
      }
  } else {
      res.send("Failed to fetch location");
  }
});

function getLatLon(jsonData) {
  if (jsonData.results.length > 0) {
      var LatLon = [];
      LatLon.push(jsonData.results[0].latitude);
      LatLon.push(jsonData.results[0].longitude);
      return LatLon;
  } else {
      return null;
  }
}

function fetchData(LatLonArray) {
  if (LatLonArray) {
      return fetch("https://api.open-meteo.com/v1/forecast?latitude=" + LatLonArray[0] + "&longitude=" + LatLonArray[1] + "&hourly=temperature_2m,rain,showers,snowfall,vapour_pressure_deficit&forecast_days=2")
          .then(res => res.json());
  } else {
      return null;
  }
}

function fetchLocation(locationName) {
  return fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + locationName + "&count=1&language=en&format=json")
  .then(res => res.json());
}

function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:00`;
}

function getTimeIndex(time_array, time_to_search) {
    const index = time_array.indexOf(time_to_search);
    if (index != -1) {
        return index;
    }
}



app.listen(8080);
console.log('Server is listening on port 8080');