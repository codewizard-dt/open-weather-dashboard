/**
 * Define an API that fetches weather based on lat/lon
 * api: https://rapidapi.com/wirefreethought/api/geodb-cities/
 */
const Weather = {
  apiKey: 'd15ea733494fdaa2d82ddebea60af05e',
  baseUrl: 'https://api.openweathermap.org/data/2.5/onecall',
  getUrl: ({ latitude, longitude }) => Weather.baseUrl + `?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=imperial&appid=${Weather.apiKey}`,
  search: async (city) => {
    try {
      const res = await fetch(Weather.getUrl(city))
      const data = await res.json()
      console.log(data)
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
$('form').find('input').on('keyup', (ev) => {
  let value = ev.target.value.trim()
  searchTerm = value
  /** Displays recent cities if input is cleared */
  if (value === '') {
    $('#search-results').html('')
    for (let city of recent) {
      $('#search-results').append(renderCityListItem(city))
    }
  }
})

/**
 * Creates and returns a `li.list-group-item` with event handlers already attached
 * @param {object} city city to display
 * @returns `<li>` element
 */
function renderCityListItem(city) {
  const { city: name, region, country, countryCode, id } = city
  const li = document.createElement('li')
  li.classList.add('list-group-item')
  /** Data-id for sorting */
  li.setAttribute('data-id', id)
  li.innerHTML = `${name}, ${region}, ${countryCode == 'US' ? countryCode : country}`
  /** Adds event listener to search results */
  $(li).on('click', () => {
    saveToRecent(city)
    displayWeather(city)
  })
  return li
}

/** Establishes global list of recent cities */
let recent = []
/** Checks local storage for recent cities */
const storedCities = localStorage.getItem('WeatherApiCache')
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
  recent = recent.filter(({ id }) => id !== city.id)
  recent.unshift(city)
  localStorage.setItem('WeatherApiCache', JSON.stringify(recent))
}
/**
 * Handles search form submission
 * Renders search results
 * @param {*} ev submit event
 * @returns void
 */
async function handleSearch(ev) {
  ev.preventDefault()
  if (searchTerm === '') return
  const cities = await City.search(searchTerm)
  $('#search-results').html('')
  for (let city of cities) {
    $('#search-results').append(renderCityListItem(city))
  }
}
$('form').on('submit', handleSearch)

// Global references to main elements
const currentEl = $('#current')
const fiveDayEl = $('#five-day')

/**
 * Formats the incoming date from the weather API
 * @param {number} dt dt from OpenWeather API (is in seconds)
 * @returns date as string
 */
const getDate = dt => moment(dt * 1000).format('LL')

/** Gets icon url from open weather */
const getIconUrl = (iconName, size = 2) => `http://openweathermap.org/img/wn/${iconName}@${size}x.png`
/** Gets Html string for icon */
const getIconHtml = (weather, size = 2) => `<img src="${getIconUrl(weather[0].icon, size)}" alt="${weather[0].description}"/>`
/** Get Html string for card header */
const getIconCardHeader = (weather) => `<div class='img-card-header' style='background-image:url(${getIconUrl(weather[0].icon)})'></div>`
/** Gets Html string for page header */
const getHeaderHtml = (dt, weather) =>
  `<div class='daily-header'>
    <h3>${getDate(dt)}</h3>
    <h4><i>${weather[0].description}</i></h4>
  </div>`
/**
 * Gets color class bases on UV index severity
 * https://www.epa.gov/sunsafety/uv-index-scale-0
 * @param {number} uvi uv index
 * @returns class string
 */
const getUvClass = (uvi) => {
  if (uvi < 3) return 'green'
  else if (uvi < 6) return 'yellow'
  else if (uvi < 8) return 'red'
  else return 'danger'
}
/**
 * Gets color class based on Temperature safety
 * @param {number} temp temperature
 * @returns class string
 */
const getTempClass = (temp) => {
  if (temp <= 90) return 'green'
  else if (temp <= 95) return 'yellow'
  else if (temp <= 100) return 'red'
  else return 'danger'
}

/**
 * Renders a daily weather card based on an object from OpenWeather
 * @param {object} param0 daily weather info from OpenWeather
 * @returns weather card
 */
function renderDailyCard({ dt, temp: { min: lowTemp, max: highTemp }, wind_speed, humidity, weather, uvi }) {
  return $(`
    <div class="my card">
      <div class="my-card-header">
        ${getIconCardHeader(weather)}
        <div class="card-title">${getHeaderHtml(dt, weather)}</div>
      </div>
      <div class="card-text">
        <div class='label ${getTempClass(highTemp)}'>High <span>${highTemp}&#8457;</span></div>
        <div class='label ${getTempClass(lowTemp)}'>Low <span>${lowTemp}&#8457;</span></div>
        <div class='label'>Wind <span>${wind_speed} mph</span></div>
        <div class='label'>Humidity <span>${humidity}%</span></div>
        <div class='label ${getUvClass(uvi)}'>UV Index <span>${uvi}</span></div>
      </div>
    </div>
  `)
}
/**
 * Retrieves weather based on city lat/lon
 * @param {object} city city info from GeoDbCities api
 */
async function displayWeather(city) {
  const oneCall = await Weather.search(city)
  const combinedData = { ...city, ...oneCall }
  const { city: cityName, regionCode, countryCode, current: { dt, temp, wind_speed, humidity, uvi, weather }, daily } = combinedData
  currentEl.html('').addClass('hasWeather')
    .append(
      `<h2>${cityName}, ${regionCode}, ${countryCode}${getIconHtml(weather)}</h2>`,
      getHeaderHtml(dt, weather),
      `<div class='flex flex-row text-bigger'>
        <div class='label ${getTempClass(temp)}'>Current Temp: <span>${temp}&#8457;</span></div>
        <div class='label ${getTempClass(daily[0].temp.max)}'>High: <span>${daily[0].temp.max}&#8457;</span></div>
        <div class='label ${getTempClass(daily[0].temp.min)}'>Low: <span>${daily[0].temp.min}&#8457;</span></div>
        <div class='label'>Wind: <span>${wind_speed} mph</span></div>
        <div class='label'>Humidity: <span>${humidity}%</span></div>
        <div class='label ${getUvClass(uvi)}'>UV Index: <span>${uvi}</span></div>
      </div>`,
    )

  fiveDayEl.show()
  let cardGroup = fiveDayEl.find('.my-card-group').html('')
  let today = moment(dt * 1000), fiveDaysFromNow = today.clone().add(5, 'days')
  for (let day of daily.filter(({ dt: timestamp }) => moment(timestamp * 1000).isBetween(today, fiveDaysFromNow, 'day', '(]'))) {
    cardGroup.append(renderDailyCard(day))
  }
  $('#search-results').find('li').removeClass('active')
  $('#search-results').find('li').filter(`[data-id=${city.id}]`).prependTo($('#search-results')).addClass('active')
}
/** If there are cities in local storage, load the first one */
if (recent.length) displayWeather(recent[0])