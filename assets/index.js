const exampleResponse = {
  "lat": 39.31,
  "lon": -74.5,
  "timezone": "America/New_York",
  "timezone_offset": -18000,
  "current": {
    "dt": 1646318698,
    "sunrise": 1646306882,
    "sunset": 1646347929,
    "temp": 282.21,
    "feels_like": 278.41,
    "pressure": 1014,
    "humidity": 65,
    "dew_point": 275.99,
    "uvi": 2.55,
    "clouds": 40,
    "visibility": 10000,
    "wind_speed": 8.75,
    "wind_deg": 360,
    "wind_gust": 13.89,
    "weather": [
      {
        "id": 802,
        "main": "Clouds",
        "description": "scattered clouds",
        "icon": "03d"
      }
    ]
  },
  "minutely": [{
    "dt": 1646318700,
    "precipitation": 0
  }],
  "hourly": [
    {
      "dt": 1646316000,
      "temp": 281.94,
      "feels_like": 278.49,
      "pressure": 1014,
      "humidity": 67,
      "dew_point": 276.16,
      "uvi": 1.49,
      "clouds": 52,
      "visibility": 10000,
      "wind_speed": 7.16,
      "wind_deg": 313,
      "wind_gust": 10.71,
      "weather": [
        {
          "id": 803,
          "main": "Clouds",
          "description": "broken clouds",
          "icon": "04d"
        }
      ],
      "pop": 0.03
    }],
  "daily": [
    {
      "dt": 1646326800,
      "sunrise": 1646306882,
      "sunset": 1646347929,
      "moonrise": 1646309880,
      "moonset": 1646352120,
      "moon_phase": 0.03,
      "temp": {
        "day": 281.63,
        "min": 271.72,
        "max": 282.21,
        "night": 271.72,
        "eve": 277.99,
        "morn": 280.92
      },
      "feels_like": {
        "day": 277.83,
        "night": 264.72,
        "eve": 273.35,
        "morn": 277.66
      },
      "pressure": 1016,
      "humidity": 55,
      "dew_point": 273.12,
      "wind_speed": 9.29,
      "wind_deg": 3,
      "wind_gust": 16.48,
      "weather": [
        {
          "id": 500,
          "main": "Rain",
          "description": "light rain",
          "icon": "10d"
        }
      ],
      "clouds": 49,
      "pop": 0.25,
      "rain": 0.11,
      "uvi": 3.38
    }],
  "alerts": [
    {
      "sender_name": "NWS Philadelphia - Mount Holly (New Jersey, Delaware, Southeastern Pennsylvania)",
      "event": "Small Craft Advisory",
      "start": 1646344800,
      "end": 1646380800,
      "description": "...SMALL CRAFT ADVISORY REMAINS IN EFFECT FROM 5 PM THIS\nAFTERNOON TO 3 AM EST FRIDAY...\n* WHAT...North winds 15 to 20 kt with gusts up to 25 kt and seas\n3 to 5 ft expected.\n* WHERE...Coastal waters from Little Egg Inlet to Great Egg\nInlet NJ out 20 nm, Coastal waters from Great Egg Inlet to\nCape May NJ out 20 nm and Coastal waters from Manasquan Inlet\nto Little Egg Inlet NJ out 20 nm.\n* WHEN...From 5 PM this afternoon to 3 AM EST Friday.\n* IMPACTS...Conditions will be hazardous to small craft.",
      "tags": [

      ]
    }]
}

console.log(exampleResponse)



/**
 * Define an API that fetches weather based on lat/lon
 * api: https://rapidapi.com/wirefreethought/api/geodb-cities/
 */
const Weather = {
  apiKey: ' ',
  baseUrl: 'https://api.openweathermap.org/data/3.0/onecall',
  getUrl: ({ latitude, longitude }) => Weather.baseUrl + `?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=imperial&appid=${Weather.apiKey}`,
  search: async (city) => {
    try {
      const res = await fetch(Weather.getUrl(city))
      const { data } = await res.json()
      return data
    } catch (error) {
      console.log(error)
      return { error }
    }
  }
}

/**
 * Define an API that fetches cities and returns lon/lat
 * api: https://rapidapi.com/wirefreethought/api/geodb-cities/
 */
const City = {
  url: 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities',
  headers: {
    'X-RapidAPI-Key': '06360e6be9msha9eb1136e2ae6afp1680b5jsn2f79a3fd3619',
    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
  },
  params: {
    sort: '-population',
    limit: 10
  },
  getParams: () => Object.entries(City.params).map(([key, val]) => `${key}=${val}`).join('&'),
  search: async (string) => {
    try {
      const res = await fetch(City.url + `?namePrefix=${string}&${City.getParams()}`, { headers: City.headers })
      const { data } = await res.json()
      return data.map(City.map)
    } catch (err) {
      console.log(err)
      return { error: err }
    }
  },
  map: ({ id, city, region, regionCode, country, countryCode, latitude, longitude }) => ({ id, city, region, regionCode, country, countryCode, latitude, longitude })
}

/** Establishes global searchTerm */
let searchTerm = ''
/** Updates the searchTerm on input keyup */
$('form').find('input').on('keyup', (ev) => searchTerm = ev.target.value.trim())

/**
 * Creates and returns a `li.list-group-item` with event handlers already attached
 * @param {object} city city to display
 * @returns `<li>` element
 */
function renderCityListItem(city) {
  const { city: name, region, country, countryCode } = city
  const li = document.createElement('li')
  li.classList.add('list-group-item')
  li.innerHTML = `${name}, ${region}, ${countryCode == 'US' ? countryCode : country}`
  $(li).on('click', () => {
    saveToRecent(city)
    displayWeather(city)
  })
  return li
}

/** Establishes global list of recent cities */
let recent = []
/** Checks local storage for recent cities */
const storedCities = localStorage.getItem('storedCities')
if (storedCities) recent.push(...JSON.parse(storedCities))
/** Renders recent cities as search results */
for (let city of recent) {
  $('#search-results').append(renderCityListItem(city))
}

/**
 * Saves a city to localStorage if not already in recent
 * @param {object} city city to save
 */
function saveToRecent(city) {
  if (!recent.find(({ id }) => city.id === id)) {
    recent.push(city)
    localStorage.setItem('storedCities', JSON.stringify(recent))
  }
}
async function handleSearch(ev) {
  ev.preventDefault()
  const cities = await City.search(searchTerm)
  $('#search-results').html('')
  for (let city of cities) {
    $('#search-results').append(renderCityListItem(city))
  }
}
$('form').on('submit', handleSearch)

const currentEl = $('#current')
const fiveDayEl = $('#five-day')
const getIconUrl = iconName => `http://openweathermap.org/img/wn/${iconName}@2x.png`
const getDate = dt => moment(dt * 1000).format('LL')
const getHeaderHtml = (dt, weather) => `<div class='daily-header'><h3>${getDate(dt)}<img src="${getIconUrl(weather[0].icon)}" alt="${weather[0].description}"/></h3><h4><i>${weather[0].description}</i></h4></div>`
function renderDailyCard({ dt, temp: { min: lowTemp, max: highTemp }, wind_speed, humidity, weather }) {
  console.log(weather)
  const dailyCard = $(document.createElement('div'))
  dailyCard.addClass('card')
  $(`<div class='card-body'></div>`).appendTo(dailyCard)
    .append(
      `<div class='card-title'>${getHeaderHtml(dt, weather)}</div>`,
      `<p class='card-text'>Temp: ${highTemp} / ${lowTemp}&#8457;</p>`,
      `<p class='card-text'>Wind: ${wind_speed} mph</p>`,
      `<p class='card-text'>Humidity: ${humidity}%</p>`,
    )
  return dailyCard
}
async function displayWeather(city) {
  // const weather = await Weather.search(city)
  const combinedData = { ...city, ...exampleResponse }
  const { city: cityName, regionCode, countryCode, current: { dt, temp, wind_speed, humidity, uvi, weather }, daily } = combinedData
  currentEl.html('').addClass('hasWeather')
    .append(
      `<h2>${cityName}, ${regionCode}, ${countryCode}</h2>`,
      getHeaderHtml(dt, weather),
      `<p>Temp: ${temp}&#8457;</p>`,
      `<p>Wind: ${wind_speed} mph</p>`,
      `<p>Humidity: ${humidity}%</p>`,
      `<p>UV Index: ${uvi}</p>`,
    )

  fiveDayEl.html('<h2>Five Day Forecast</h2>')
  for (let day of daily) {
    fiveDayEl.append(renderDailyCard(day))
  }
}