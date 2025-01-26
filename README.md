# SunCalc

SunCalc is a SceneScript library for precise calculations of solar position and related events, such as sunrise, sunset, dusk, and dawn.

## Features

- Compute the sun's **azimuth** and **elevation** angles for any location and time.
- Calculate solar events: **sunrise**, **sunset**, **dusk**, **dawn**, and more.
- Adjust for **atmospheric refraction** and **altitude**.
- Designed to have a minimal performance impact.

## Usage

### Example

```javascript
const sun = new SunCalc(new Vec2(45.5, 10.2)); // Latitude (°), Longitude (°)
const sun = new SunCalc(new Vec3(45.5, 10.2, 100), new Date(), 120); // Latitude (°), Longitude (°), altitude (m), date and time, timezone offset (minutes)

// Set location and time
sun.setLocation(new Vec2(45.5, 10.2)); // Latitude (°), Longitude (°)
sun.setLocation(new Vec3(45.5, 10.2, 100), 120); // Latitude (°), Longitude (°), altitude (m), timezone offset (minutes)
sun.setDateTime(new Date());

// Get sun position
const sunPosition = sun.getSunPosition();
console.log(`Azimuth: ${sunPosition.x}, Elevation: ${sunPosition.y}`);

// Get solar events
const sunrise = sun.getSunrise();
const sunset = sun.getSunset();
console.log(`Sunrise: ${sunrise}, Sunset: ${sunset}`);
```

### Methods

- `setLocation(coordinates, timezone)` / `getLocation()`
  Set/get the latitude, longitude and altitude for calculations.

- `setDateTime(date)` / `getDateTime()`
  Set/get the date and time for calculations.

- `getTimezone()`
  Returns the timezone currently used for calculations.

- `getSunPosition()`
  Returns a Vec2 object with azimuth (`x`) and elevation (`y`) of the sun.

- `getSunrise()` / `getSunset()`
  Returns the Date object for sunrise and sunset.

- `getSolarNoon()` / `getSolarMidnight()`
  Returns the Date object for solar noon and solar midnight.

- `get...Dawn()` / `get...Dusk()`
  Returns the Date object for the three types of dawn and dusk: civil, nautical and astronomical.

### Performance
To utilize the performance optimization provided by this it's necessary to create a SunCalc object once as a global variable, then use setDateTime and SetLocation to manipulate it later in the code and in the following frames.

This is because those functions actually run a recalculation only when necessary, if the location and date and time did not change no recalculation will be done, and the `get` methods will just return the previously stored results.

## Limitations

- Accuracy decreases at extreme latitudes.
- Does not account for weather or cloud cover.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
