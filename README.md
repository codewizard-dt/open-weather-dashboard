# Weather Dashboard

This is a weather app that can give you the weather in any city across the globe

## Search Function
Uses [GeoDB Cities API](https://rapidapi.com/wirefreethought/api/geodb-cities/).
Sends a search query string and receives geographical data in return.
- Search query string tethered to update on search bar keyup event
- Returns a list of 10 cities across the globe
- Renders list elements for all returned results
- When search bar is cleared, recent cities are displayed

## Local Storage
When a city is clicked it's added to local storage. A **list of recent cities is maintained** and loaded upon page refresh.

## Current Weather
When a city is clicked its weather data is retrieved and all the current weather conditions are displayed:
- `current temp`
- `high and low temp`
- `wind speed`
- `humidity`
- `UV index`

## Future Weather
When a city is clicked, a `5-day forecast` is also loaded. Each forecast card contains the same information available for current weather

## UV and Temp Color Indicators
Since the intensity of the UV index and temperature are of paramount concern for most users, these data points are labeled by color:
- `green` for `low`  (UV < 3, T < 90)
- `yellow` for `moderate` (UV < 6, T < 95)
- `red` for `high` (UV < 8, T < 100)
- `dark red` for `danger` (UV > 11, T < 105)

## Deployed Link
[Weather Dashboard on Github Pages](https://codewizard-dt.github.io/open-weather-dashboard/)

## Demo
![Weather Dashboard Demo](./assets/images/demo.gif)