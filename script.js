const APIKEY = process.env.KEY;
let lang = "en";
// QuerySelectors
const tempDiv = document.querySelector(".weather-deg");
const tempMinDiv = document.querySelector("#minTemp");
const tempMaxDiv = document.querySelector("#maxTemp");
const tempFeelsLike = document.querySelector("#feelsTemp");
const humidityDiv = document.querySelector("#humidity");
const pressureDiv = document.querySelector("#pressure");
const windDiv = document.querySelector("#wind");
const inputField = document.querySelector("#citySearchinput");

// getWeatherFromCity("Athens");
let fetchedCity = "";
window.addEventListener("load", function () {
  document.querySelector(".city-name").textContent = "-------";
  reset();
  loadWeather();
});

function loadWeather() {
  const searchButton = document.querySelector("#search");
  const extendedButton = document.querySelector("#extendedBtn");

  //Displays the weather for area that was entered in input
  //when ENTER button is pressed
  inputField.addEventListener("keyup", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      console.log(inputField.value);
      showInfoIcon("fa-spinner fa-spin-pulse");
      getWeatherFromCity(inputField.value, getWeatherFromCoords);
    }
  });
  /**Displays the weather for area that was entered in input
  //when Search button is pressed
     */
  searchButton.addEventListener("click", function (e) {
    e.preventDefault();
    showInfoIcon("fa-spinner fa-spin-pulse");
    console.log(inputField.value);
    getWeatherFromCity(inputField.value, getWeatherFromCoords);
  });
  /**
   * Uses getPosition() and displays the weather for located area if access is given. Returns an error if access to location is denied
   */
  document.querySelector("#locateCity").addEventListener("click", function () {
    if (navigator.geolocation) {
      showInfoIcon("fa-spinner fa-spin-pulse");
      getPosition();
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  });

  extendedButton.addEventListener("click", function (e) {
    e.preventDefault();
    document
      .querySelector(".extended-forecast-wrapper")
      .classList.toggle("hidden");
  });
}

/**
 * Takes a city name, and after getting it's coordinates, it uses getWeatherFromCoords() to fetch the weather data of this city
 * @param {*} city  City's name
 */
async function getWeatherFromCity(acity, callback) {
  try {
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${acity}&lang=${lang}&appid=${APIKEY}`
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        const lat = data.coord.lat;
        const lon = data.coord.lon;
        callback(lat, lon);
      });
  } catch (error) {
    if (callback === getWeatherFromCoords) {
      showInfoIcon("fa-triangle-exclamation fa-fade");
      document.querySelector(".city-name").textContent = "Δεν βρέθηκε";
    } else if (callback === get3HoursWeatherFromCoords) {
      showInfoIcon("fa-triangle-exclamation fa-fade");
      document.querySelector(".city-name").textContent =
        "Δεν έχετε επιλέξει πόλη";
    }
    reset();
    throw error;
  }
}

/**
 * Takes latitude and longitude to locate an area and fetches the weather data of this location
 * @param {*} lat  Latitude
 * @param {*} lon  Longitude
 */
async function getWeatherFromCoords(lat, lon) {
  try {
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric&lang=${lang}`
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        addWeatherToPage(data);
      })
      .then(() => {
        document
          .querySelector(".extended-forecast-wrapper")
          .classList.add("hidden");
        get3HoursWeatherFromCoords(lat, lon);
      });
  } catch (error) {
    throw error;
  }
}

async function get3HoursWeatherFromCoords(lat, lon) {
  try {
    await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIKEY}&units=metric&lang=${lang}`
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        addExtendedWeatherToPage(data);
      });
  } catch (error) {}
}

/**
 *  Uses coordinates to find a city and fetches weather data for this city
 * @param {*} lat Latitude
 * @param {*} lon Longitude
 */
async function getCityFromCoord(lat, lon) {
  try {
    await fetch(
      `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${APIKEY}`
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        getWeatherFromCoords(lat, lon);
        fetchedCity = data[0].local_names.el;
      });
  } catch (error) {
    throw error;
  }
}

/**
 * Transforms incoming data, and adds them to DOM
 * @param {*} data
 */
function addWeatherToPage(data) {
  document.querySelector(".rain-volume").classList.add("hidden");
  document.querySelector(".extended-forecast").innerHTML = "";
  replaceMainColumn();
  replaceTemps();
  replaceConditions();
  showRain();
  document.querySelector("#extendedBtn").classList.remove("hidden");

  function replaceMainColumn() {
    document.querySelector(".weather-icon-wrapper").innerHTML = getWeatherIcon(
      data.weather[0].icon,
      "fa-6x"
    );

    document.querySelector(".city-name").textContent = data.name;
    document.querySelector(".country-name").textContent = getCountryName(
      data.sys.country
    );
    document.querySelector(".weather-desc").textContent =
      data.weather[0].description;
  }

  /**
   * Replaces placeholders with temperatures for API Call
   */
  function replaceTemps() {
    const temp = Math.round(data.main.temp);
    const tempMax = Math.round(data.main.temp_max);
    const tempMin = Math.round(data.main.temp_min);
    const feelsLikeTemp = Math.round(data.main.feels_like);
    tempDiv.innerHTML = temp + "&deg;";
    tempMinDiv.innerHTML = tempMin + "&deg;";
    tempMaxDiv.innerHTML = tempMax + "&deg;";
    tempFeelsLike.innerHTML = feelsLikeTemp + "&deg;";
  }
  function replaceConditions() {
    const humidity = data.main.humidity;
    const windSpeed = Math.round(msToBeaufort(data.wind.speed));
    const pressure = data.main.pressure;
    humidityDiv.innerHTML = humidity + "%";
    pressureDiv.innerHTML = pressure + "hPa";
    windDiv.innerHTML = windSpeed + "bf";
  }

  /**
   * Shows rain information if weather is rainy
   */

  function showRain() {
    if (data.rain) {
      const rainVolume = data.rain["1h"];
      const html = `<div class=""> ${rainVolume} mm of rain</div>`;
      document.querySelector(".rain-volume").innerHTML = html;
      document.querySelector(".rain-volume").classList.remove("hidden");
    }
  }
}

/**
 *  Appends future weather info in extended forecast section
 * @param {*} data data fetched through get3HoursWeatherFromCoords()
 *                 function
 */
function addExtendedWeatherToPage(data) {
  const list = data.list;
  for (let i = 0; i <= 8; i += 2) {
    const icon = getWeatherIcon(list[i].weather[0].icon, "fa-2x");
    const hour = new Date(list[i].dt * 1000).getHours();
    const day = new Date(list[i].dt * 1000).getDate();
    const month = new Date(list[i].dt * 1000).getMonth();
    const date = day + "/" + month + " - " + hour + ":00";
    const temperature = Math.round(list[i].main.temp);
    const desc = list[i].weather[0].description;
    console.log(day);
    const html = `
    <div class="extended-${i} extended w-full">
    <div
      class="extended-weather-icon-wrapper flex flex-row sm:flex-col gap-3 items-center text-white"
    >
      ${icon}
    </div>
      <div class="text-white font-semibold text-xl">
        <p class="extended-hour text-center">${date}</p>
      </div>
    <div class="extended-weather-deg text-white text-3xl pl-2 ">
      ${temperature}&deg;
    </div>
    <div class="extended-weather-desc text-center  ; text-white">${desc}</div>
  </div>
   `;
    document
      .querySelector(".extended-forecast")
      .insertAdjacentHTML("beforeend", html);
  }
}

/**
 *  Requests for location access on browser, and if access is given it
 * uses getCityFromCoords() to identify the city
 */
function getPosition() {
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
    }
    function successFunction(position) {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      getCityFromCoord(lat, lon);

      document.querySelector("#search").value = fetchedCity;
    }
    function errorFunction() {
      showInfoIcon("fa-triangle-exclamation fa-fade");
      document.querySelector(".city-name").textContent =
        "Τοποθεσία μη διαθέσιμη";
    }
    reset();
  } catch (error) {
    throw error;
  }
}

/**
 *  Gets the weatherCode from API Call and picks the corresponding Fontawesome icon.
 * @param {*} weatherCode Weather icon from Openweather API response
 * @returns an fontawesome icon
 */
function getWeatherIcon(weatherCode, iconsize) {
  let html = "";
  switch (weatherCode) {
    case "01d":
    case "01n": {
      html = `<i class="weather-icon fa-solid fa-sun ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "02d":
    case "02n": {
      html = `<i class="weather-icon fa-solid fa-cloud-sun ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "03d":
    case "03n":
    case "04d":
    case "04n": {
      html = `<i class="weather-icon fa-solid fa-cloud ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "09d":
    case "09n": {
      html = `<i class="weather-icon fa-solid fa-cloud-rain ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "10d":
    case "10n": {
      html = `<i class="weather-icon fa-solid fa-cloud-showers-heavy ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "11d":
    case "11n": {
      html = `<i class="weather-icon fa-solid fa-cloud-bolt ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "13d":
    case "13n": {
      html = `<i class="weather-icon fa-solid fa-snowflake ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    case "50d":
    case "50n": {
      html = `<i class="weather-icon fa-solid fa-smog ${iconsize} drop-shadow-2xl"></i>`;
      break;
    }
    default:
      html = `<i class="weather-icon fa-solid drop-shadow-2xl fa-cloud-sun-rain ${iconsize}"></i>`;
  }
  return html;
}

/**
 * Convers m/s in beaufort scale
 * @param {*} ms Wind speed in m/s
 * @returns  Wind speed in beaufort scale
 */
function msToBeaufort(ms) {
  return Math.ceil(Math.cbrt(Math.pow(ms / 0.836, 2)));
}

/**
 * Changes the weather icon with loading or error icons , depending on the situation
 * @param {*} icon Font Awesome icon of choice
 */
function showInfoIcon(icon) {
  const html = `<i class="weather-icon fa-solid ${icon} fa-6x">`;
  document.querySelector(".weather-icon-wrapper").innerHTML = html;
}

let isoCountries = {
  AF: "Afghanistan",
  AX: "Aland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AI: "Anguilla",
  AQ: "Antarctica",
  AG: "Antigua And Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia And Herzegovina",
  BW: "Botswana",
  BV: "Bouvet Island",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo, Democratic Republic",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Cote D'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  ET: "Ethiopia",
  FK: "Falkland Islands (Malvinas)",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  TF: "French Southern Territories",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HM: "Heard Island & Mcdonald Islands",
  VA: "Holy See (Vatican City State)",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran, Islamic Republic Of",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle Of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KR: "Korea",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Lao People's Democratic Republic",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libyan Arab Jamahiriya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao",
  MK: "Macedonia",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia, Federated States Of",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MS: "Montserrat",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  AN: "Netherlands Antilles",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  MP: "Northern Mariana Islands",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestinian Territory, Occupied",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PN: "Pitcairn",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Reunion",
  RO: "Romania",
  RU: "Russian Federation",
  RW: "Rwanda",
  BL: "Saint Barthelemy",
  SH: "Saint Helena",
  KN: "Saint Kitts And Nevis",
  LC: "Saint Lucia",
  MF: "Saint Martin",
  PM: "Saint Pierre And Miquelon",
  VC: "Saint Vincent And Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome And Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  GS: "South Georgia And Sandwich Isl.",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard And Jan Mayen",
  SZ: "Swaziland",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syrian Arab Republic",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad And Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TC: "Turks And Caicos Islands",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UM: "United States Outlying Islands",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela",
  VN: "Viet Nam",
  VG: "Virgin Islands, British",
  VI: "Virgin Islands, U.S.",
  WF: "Wallis And Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

function getCountryName(countryCode) {
  if (isoCountries.hasOwnProperty(countryCode)) {
    return isoCountries[countryCode];
  } else {
    return countryCode;
  }
}

/**
 * Resets basic UI Elements
 */
function reset() {
  document.querySelector(".country-name").textContent = "------";
  document.querySelector(".weather-desc").textContent = "------";
  tempDiv.innerHTML = "--";
  tempMinDiv.innerHTML = "--";
  tempMaxDiv.innerHTML = "--";
  tempFeelsLike.innerHTML = "--";
  humidityDiv.innerHTML = "--";
  pressureDiv.innerHTML = "--";
  windDiv.innerHTML = "--";
  document.querySelector(".extended-forecast").innerHTML = "";
  document.querySelector("#extendedBtn").classList.add("hidden");
}
