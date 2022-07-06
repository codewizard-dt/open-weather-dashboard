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
  recent = recent.filter(({ id }) => id !== city.id)
  recent.unshift(city)
  localStorage.setItem('storedCities', JSON.stringify(recent))
}
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

const currentEl = $('#current')
const fiveDayEl = $('#five-day')
const getDate = dt => moment(dt * 1000).format('LL')

const getIconUrl = (iconName, size = 2) => `http://openweathermap.org/img/wn/${iconName}@${size}x.png`
const getIconHtml = (weather, size = 2) => `<img src="${getIconUrl(weather[0].icon, size)}" alt="${weather[0].description}"/>`
const getHeaderHtml = (dt, weather) =>
  `<div class='daily-header'>
    <h3>${getDate(dt)}</h3>
    <h4><i>${weather[0].description}</i></h4>
  </div>`
const getUvClass = (uvi) => {
  if (uvi < 3) return 'green'
  else if (uvi < 6) return 'yellow'
  else if (uvi < 8) return 'red'
  else return 'danger'
}
const getTempClass = (temp) => {
  if (temp <= 90) return 'green'
  else if (temp <= 95) return 'yellow'
  else if (temp <= 100) return 'red'
  else return 'danger'
}

function renderDailyCard({ dt, temp: { min: lowTemp, max: highTemp }, wind_speed, humidity, weather, uvi }) {
  const dailyCard = $(document.createElement('div'))
  dailyCard.addClass('card')
    .append(getIconHtml(weather, 4), `<div class='card-title'>${getHeaderHtml(dt, weather)}</div>`)
  dailyCard.find('img').addClass('card-img-top')
  $(`<div class='card-text'></div>`).appendTo(dailyCard)
    .append(
      `<div class='label ${getTempClass(highTemp)}'>High <span>${highTemp}&#8457;</span></div>
      <div class='label ${getTempClass(lowTemp)}'>Low <span>${lowTemp}&#8457;</span></div>
      <div class='label'>Wind <span>${wind_speed} mph</span></div>
      <div class='label'>Humidity <span>${humidity}%</span></div>
      <div class='label ${getUvClass(uvi)}'>UV Index <span>${uvi}</span></div>`
    )
  return dailyCard
}
async function displayWeather(city) {
  const oneCall = await Weather.search(city)
  const combinedData = { ...city, ...oneCall }
  const { city: cityName, regionCode, countryCode, current: { dt, temp, wind_speed, humidity, uvi, weather }, daily } = combinedData
  currentEl.html('').addClass('hasWeather')
    .append(
      `<h2>${cityName}, ${regionCode}, ${countryCode}${getIconHtml(weather)}</h2>`,
      getHeaderHtml(dt, weather),
      `<div>
        <div class='label ${getTempClass(temp)}'>Current Temp: <span>${temp}&#8457;</span></div>
        <div class='label ${getTempClass(daily[0].temp.max)}'>High: <span>${daily[0].temp.max}&#8457;</span></div>
        <div class='label ${getTempClass(daily[0].temp.min)}'>Low: <span>${daily[0].temp.min}&#8457;</span></div>
      </div>`,
      `<div>
        <div class='label'>Wind: <span>${wind_speed} mph</span></div>
        <div class='label'>Humidity: <span>${humidity}%</span></div>
        <div class='label ${getUvClass(uvi)}'>UV Index: <span>${uvi}</span></div>
      </div>`,
    )

  fiveDayEl.show()
  let cardGroup = fiveDayEl.find('.card-group').html('')
  let today = moment(dt * 1000), fiveDaysFromNow = today.clone().add(5, 'days')
  for (let day of daily.filter(({ dt: timestamp }) => moment(timestamp * 1000).isBetween(today, fiveDaysFromNow, 'day', '(]'))) {
    cardGroup.append(renderDailyCard(day))
  }
}
if (recent.length) displayWeather(recent[0])