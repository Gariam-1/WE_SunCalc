/**
 * This class calculates the position of the sun (azimuth and elevation) at a specified date, time, and location.
 * It also provides times for key solar events, including sunrise, sunset, solar noon/midnight, and twilight phases (civil, nautical, and astronomical).
 *
 * The calculations account for geographical coordinates, time zones, altitude, and atmospheric refraction for improved accuracy.
 * 
 * This can provide dates and times only as long as the two opposites are not more that 24 hours apart.
 * @author Gariam
 */
class SunCalc {
	/**
	 * @param {(Vec2 | Vec3)} coordinates - geographical coordinates of the location, in degrees. Vec3(latitude, longitude, altitude in meters)
	 * @param {Date=} date - reference date and time
	 * @param {number=} timezone - offset in minutes from UTC of the specified location. If missing the system's timezone will be used
	 */
	constructor(coordinates, date, timezone){
		this._latitude_ = coordinates.x * 0.01745329;
		this._longitude_ = coordinates.y * 0.01745329;
		this._altitude_ = coordinates.hasOwnProperty("z") ? coordinates.z : 0;
		this._date_ = date ? new Date(date.toISOString()) : new Date();
		this._timezone_ = !timezone ? -this._date_.getTimezoneOffset() : Math.floor(timezone);

		this._sunrise_ = 0;
		this._sunset_ = 0;
		this._solar_noon_ = 0;
		this._solar_midnight_ = 0;
		this._civil_dawn_ = 0;
		this._civil_dusk_ = 0;
		this._nautical_dawn_ = 0;
		this._nautical_dusk_ = 0;
		this._astronomical_dawn_ = 0;
		this._astronomical_dusk_ = 0;
		this._sun_elevation_ = 0;
		this._sun_azimuth_ = 0;

		this._latitude_trig_ = new Vec3(Math.sin(this._latitude_), Math.cos(this._latitude_), 0);
		this._latitude_trig_.z = this._latitude_trig_.x / this._latitude_trig_.y; // tan
		this._last_date_ = "1970-01-01T00:00:00Z";

		this._updateStatic_();
		this._updateDynamic_();
	}

	_updateStatic_(){
		const startOfYear = new Date(this._date_.getFullYear(), 0, 1, 0, 0, 0);
		const startOfNextYear = new Date(this._date_.getFullYear() + 1, 0, 1, 0, 0, 0);
		const thisDate = new Date(this._date_.getFullYear(), this._date_.getMonth(), this._date_.getDate() + 1, 0, 0, 0);
		const fract_year_rad = (thisDate - startOfYear) / (startOfNextYear - startOfYear) * (Math.PI + Math.PI); // Fractional year in radians

		const time_radians = new Vec2(Math.cos(fract_year_rad), Math.sin(fract_year_rad));
		const time_radians_2 = new Vec2(Math.cos(fract_year_rad + fract_year_rad), Math.sin(fract_year_rad + fract_year_rad));

		// Equation of time
		const eqtime = 229.18 * (0.000075 + 0.001868 * time_radians.x - 0.032077 * time_radians.y - 0.014615 * time_radians_2.x - 0.040849 * time_radians_2.y);

		// Solar declination
		const declination = 0.006918 - 0.399912 * time_radians.x + 0.070257 * time_radians.y - 0.006758 * time_radians_2.x + 0.000907 * time_radians_2.y - 0.002697 * Math.cos(fract_year_rad * 3) + 0.00148 * Math.sin(fract_year_rad * 3);

		const cos = Math.cos(declination) * this._latitude_trig_.y;
		const tan = Math.tan(declination) * this._latitude_trig_.z;
		const altitude = 2.076e-4 * this._altitude_ * 0.01745329; // Altitude correction
		const computeHourAngle = (threshold) => { return Math.acos((threshold - altitude) / cos - tan) * 57.2957795; }
		const hour_angle_h = computeHourAngle(-0.0145381); // Horizon = cos(90.833°)	accounts for atmospheric refraction
		const hour_angle_c = computeHourAngle(-0.1045285); // Civil twilight = cos(96°)
		const hour_angle_n = computeHourAngle(-0.2079117); // Nautical twilight = cos(102°)
		const hour_angle_a = computeHourAngle(-0.309017); // Astronomical twilight = cos(108°)

		const longitude = this._longitude_ * 57.2957795;
		const computeTime = (hourAngle) => { return 720 - 4 * (longitude + hourAngle) - eqtime; }
		// Times in minutes from the start of the day
		const sunrise_m = computeTime(hour_angle_h);
		const sunset_m = computeTime(-hour_angle_h);
		const solar_noon_m = computeTime(0);
		const solar_midnight_m = computeTime(-180);
		const civil_dawn_m = computeTime(hour_angle_c);
		const civil_dusk_m = computeTime(-hour_angle_c);
		const nautical_dawn_m = computeTime(hour_angle_n);
		const nautical_dusk_m = computeTime(-hour_angle_n);
		const astronomical_dawn_m = computeTime(hour_angle_a);
		const astronomical_dusk_m = computeTime(-hour_angle_a);

		const time_template = new Date(this._date_.getFullYear(), this._date_.getMonth(), this._date_.getDate());

		this._sunrise_ = new Date(time_template);
		this._sunrise_.setMinutes(Math.floor(sunrise_m));
		this._sunrise_.setSeconds((sunrise_m - Math.floor(sunrise_m)) * 60);

		this._sunset_ = new Date(time_template);
		this._sunset_.setMinutes(Math.floor(sunset_m));
		this._sunset_.setSeconds((sunset_m - Math.floor(sunset_m)) * 60);

		this._solar_noon_ = new Date(time_template);
		this._solar_noon_.setMinutes(Math.floor(solar_noon_m));
		this._solar_noon_.setSeconds((solar_noon_m - Math.floor(solar_noon_m)) * 60);

		this._solar_midnight_ = new Date(time_template);
		this._solar_midnight_.setMinutes(Math.floor(solar_midnight_m));
		this._solar_midnight_.setSeconds((solar_midnight_m - Math.floor(solar_midnight_m)) * 60);

		this._civil_dawn_ = new Date(time_template);
		this._civil_dawn_.setMinutes(Math.floor(civil_dawn_m));
		this._civil_dawn_.setSeconds((civil_dawn_m - Math.floor(civil_dawn_m)) * 60);

		this._civil_dusk_ = new Date(time_template);
		this._civil_dusk_.setMinutes(Math.floor(civil_dusk_m));
		this._civil_dusk_.setSeconds((civil_dusk_m - Math.floor(civil_dusk_m)) * 60);

		this._nautical_dawn_ = new Date(time_template);
		this._nautical_dawn_.setMinutes(Math.floor(nautical_dawn_m));
		this._nautical_dawn_.setSeconds((nautical_dawn_m - Math.floor(nautical_dawn_m)) * 60);

		this._nautical_dusk_ = new Date(time_template);
		this._nautical_dusk_.setMinutes(Math.floor(nautical_dusk_m));
		this._nautical_dusk_.setSeconds((nautical_dusk_m - Math.floor(nautical_dusk_m)) * 60);

		this._astronomical_dawn_ = new Date(time_template);
		this._astronomical_dawn_.setMinutes(Math.floor(astronomical_dawn_m));
		this._astronomical_dawn_.setSeconds((astronomical_dawn_m - Math.floor(astronomical_dawn_m)) * 60);

		this._astronomical_dusk_ = new Date(time_template);
		this._astronomical_dusk_.setMinutes(Math.floor(astronomical_dusk_m));
		this._astronomical_dusk_.setSeconds((astronomical_dusk_m - Math.floor(astronomical_dusk_m)) * 60);
	}

	_updateDynamic_(){
		const startOfYear = new Date(this._date_.getFullYear(), 0, 1, 0, 0, 0);
		const startOfNextYear = new Date(this._date_.getFullYear() + 1, 0, 1, 0, 0, 0);
		const fract_year_rad = (this._date_ - startOfYear) / (startOfNextYear - startOfYear) * (Math.PI + Math.PI); // Fractional year in radians

		const time_radians = new Vec2(Math.cos(fract_year_rad), Math.sin(fract_year_rad));
		const time_radians_2 = new Vec2(Math.cos(fract_year_rad + fract_year_rad), Math.sin(fract_year_rad + fract_year_rad));

		// Equation of time
		const eqtime = 229.18 * (0.000075 + 0.001868 * time_radians.x - 0.032077 * time_radians.y - 0.014615 * time_radians_2.x - 0.040849 * time_radians_2.y);

		// Solar declination
		const declination = 0.006918 - 0.399912 * time_radians.x + 0.070257 * time_radians.y - 0.006758 * time_radians_2.x + 0.000907 * time_radians_2.y - 0.002697 * Math.cos(fract_year_rad * 3) + 0.00148 * Math.sin(fract_year_rad * 3);
		const declination_trig = new Vec3(Math.sin(declination), Math.cos(declination), 0);
		declination_trig.z = declination_trig.x / declination_trig.y; // tan

		const time_offset = eqtime + 4 * this._longitude_ * 57.2957795 - this._timezone_;
		const solar_time = this._date_.getHours() * 60 + this._date_.getMinutes() + this._date_.getSeconds() * 0.01666667 + time_offset;
		const hour_angle = (solar_time * 0.25 - 180) * 0.01745329;
		const cos = Math.cos(hour_angle);

		const elevation = Math.acos(this._latitude_trig_.x * declination_trig.x + this._latitude_trig_.y * declination_trig.y * cos) * 57.2957795;
		const refraction = -0.0167 / Math.tan(elevation + 10.3 / (elevation + 5.11)); // Atmospheric refraction correction
		const altitude = 2.076e-4 * this._altitude_; // Altitude correction

		const azimuth = Math.PI + Math.atan2(Math.sin(hour_angle), cos * this._latitude_trig_.x - declination_trig.z * this._latitude_trig_.y);

		this._sun_elevation_ = 90 - elevation + refraction + altitude;
		this._sun_azimuth_ = azimuth * 57.2957795;
	}

	/**
	 * Changes the geographical coordinates.
	 * @param {(Vec2 | Vec3)} coordinates - geographical coordinates of the location, in degrees. Vec3(latitude, longitude, altitude in meters)
	 * @param {number=} timezone - offset in minutes from UTC of the specified location
	 */
	setLocation(coordinates, timezone){
		timezone = timezone ? Math.floor(timezone) : this._timezone_;
		coordinates.x *= 0.01745329;
		coordinates.y *= 0.01745329;

		// Recalculate only if coordinates changed
		if (Math.abs(coordinates.x - this._latitude_) > 1e-8 || Math.abs(coordinates.y - this._longitude_) > 1e-8 || Math.abs(coordinates.z - this._altitude_) > 1e-2 || this._timezone_ != timezone){
			this._latitude_ = coordinates.x;
			this._longitude_ = coordinates.y;
			this._altitude_ = coordinates.hasOwnProperty("z") ? coordinates.z : 0;
			this._timezone_ = timezone;
			this._latitude_trig_.x = Math.sin(this._latitude_);
			this._latitude_trig_.y = Math.cos(this._latitude_);
			this._latitude_trig_.z = this._latitude_trig_.x / this._latitude_trig_.y; // tan
			this._updateStatic_();
			this._updateDynamic_();
		}
	}

	/**
	 * Changes the date and time reference for the calculations.
	 * @param {Date} date - the Date object with date and time information
	 */
	setDateTime(date){
		newDate = date.toISOString();
		currentDate = this._date_.toISOString();

		if (currentDate.substring(0, 19) != newDate.substring(0, 19)){ // Recalculate once per second
			this._date_ = new Date(newDate);
			this._updateDynamic_();

			if (currentDate.substring(0, 10) != this._last_date_.substring(0, 10)){ // Recalculate once a day
				this._last_date_ = new Date(currentDate).toISOString();
				this._updateStatic_();
			}
		}
	}

	/**
	 * Returns the geographical coordinates in degrees as a Vec3 object.
	 * @returns {Vec3} Vec3(latitude, longitude, altitude in meters)
	 */
	getCoordinates(){
		return new Vec3(this._latitude_ * 57.2957795, this._longitude_ * 57.2957795, this._altitude_);
	}

	/**
	 * Returns the timezone offset, in minutes, currently used in the calculations.
	 * @returns {number}
	 */
	getTimezone(){
		return this._timezone_;
	}

	/**
	 * Returns the Date object with current reference date and time.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getDateTime(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._date_);
		date.setMinutes(this._date_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns sun position for the current reference date and time, in the form of azimuth and elevation over the horizon.
	 * 
	 * Azimuth: degrees, clockwise, 0° = true north.
	 * 
	 * Elevation: degrees, positive above horizon, negative below horizon.
	 * @returns {Vec2} Vec2(Azimuth, elevation)
	 */
	getSunPosition(){
		return new Vec2(this._sun_azimuth_, this._sun_elevation_);
	}

	/**
	 * Returns the time of sunrise for the reference date and location.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getSunrise(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._sunrise_);
		date.setMinutes(this._sunrise_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of sunset for the reference date and location.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getSunset(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._sunset_);
		date.setMinutes(this._sunset_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of solar noon for the reference date and location.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getSolarNoon(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._solar_noon_);
		date.setMinutes(this._solar_noon_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of solar midnight for the reference date and location.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getSolarMidnight(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._solar_midnight_);
		date.setMinutes(this._solar_midnight_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of civil dawn for the reference date and location.
	 * 
	 * Civil dawn is when the sun is 6 degrees below the horizon before sunrise.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getCivilDawn(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._civil_dawn_);
		date.setMinutes(this._civil_dawn_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of civil dusk for the reference date and location.
	 * 
	 * Civil dusk is when the sun is 6 degrees below the horizon after sunset.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getCivilDusk(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._civil_dusk_);
		date.setMinutes(this._civil_dusk_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of Nautical dawn for the reference date and location.
	 * 
	 * Nautical dawn is when the sun is 12 degrees below the horizon before sunrise.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getNauticalDawn(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._nautical_dawn_);
		date.setMinutes(this._nautical_dawn_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of Nautical dusk for the reference date and location.
	 * 
	 * Nautical dusk is when the sun is 12 degrees below the horizon after sunset.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getNauticalDusk(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._nautical_dusk_);
		date.setMinutes(this._nautical_dusk_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of Nautical dawn for the reference date and location.
	 * 
	 * Astronomical dawn is when the sun is 18 degrees below the horizon before sunrise.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getAstronomicalDawn(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._astronomical_dawn_);
		date.setMinutes(this._astronomical_dawn_.getMinutes() + timezone);
		return date;
	}

	/**
	 * Returns the time of Nautical dusk for the reference date and location.
	 * 
	 * Astronomical dusk is when the sun is 18 degrees below the horizon after sunset.
	 * @param {number=} timezone - offset in minutes from UTC. If missing, the one specified at object creation is used
	 * @returns {Date}
	 */
	getAstronomicalDusk(timezone){
		timezone = typeof timezone === 'number' && Number.isFinite(timezone) ? Math.floor(timezone) : this._timezone_;
		const date = new Date(this._astronomical_dusk_);
		date.setMinutes(this._astronomical_dusk_.getMinutes() + timezone);
		return date;
	}
}