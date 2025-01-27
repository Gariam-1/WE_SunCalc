/**
 * This script is the equivalent of the one found here: https://docs.wallpaperengine.io/en/scene/scenescript/tutorial/timeofday.html
 * with the difference being that the times are not static, but dinamically calculated using the SunCalc class.
 * 
 * The location is provided by script properties, to make it possible to bind them to user properties and have the end user input their own location.
 *
 * Be mindful, though, that this script will not work for certain periods of time with high latitude values, the higher you go the worse this will be.
 * This problem starts appearing at values higher than 65 and lower than -65 degrees.
 */

'use strict';

import * as WEMath from 'WEMath';

export var scriptProperties = createScriptProperties()
	.addSlider({
		name: 'latitude',
		label: 'Latitude',
		value: 45,
		min: -65,
		max: 65,
		integer: false
	})
	.addSlider({
		name: 'longitude',
		label: 'Longitude',
		value: 0,
		min: -180,
		max: 180,
		integer: false
	})
	.addSlider({
		name: 'altitude',
		label: 'Altitude',
		value: 0,
		min: -500,
		max: 10000,
		integer: false
	})
	.finish();

const BLEND_DURATION = 5; // Change this to control how long the transition should be in minutes.
let sun;

export function update() {
	const now = new Date();
	sun.setLocation(new Vec3(scriptProperties.latitude, scriptProperties.longitude, scriptProperties.altitude));
	sun.setDateTime(now);
	
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const sunrise = (sun.getSunrise() - startOfDay) / 8.64e7; // Sunrise time of day in range [0, 1]
	const sunset = (sun.getSunset() - startOfDay) / 8.64e7; // Sunset time of day in range [0, 1]

	return WEMath.smoothStep(sunrise - BLEND_DURATION / 1440, sunrise, engine.timeOfDay) * WEMath.smoothStep(sunset, sunset + BLEND_DURATION / 1440, engine.timeOfDay);
}

export function init(){
	sun = new SunCalc(new Vec3(scriptProperties.latitude, scriptProperties.longitude, scriptProperties.altitude));
}
