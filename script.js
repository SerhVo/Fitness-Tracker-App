"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const resetButton = document.querySelector(".reset-button");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  // Set workout description based on type and date
  _setDescription() {
    // prettier-ignore
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const year = this.date.getFullYear();
    const month = months[this.date.getMonth()];
    const day = this.date.getDate();
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} - ${day} ${month}  ${year}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  // Calculate the running pace (min/km)
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  // Calculate cycling speed (km/h)
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  _workouts = [];
  _mapEvent;
  _map;
  constructor() {
    this._getPosition();

    this._getLocalStorage();

    // Event listener for workout submission
    form.addEventListener("submit", this._newWorkout.bind(this));

    // Toggle between running and cycling input fields
    inputType.addEventListener("change", this._toggleField);

    // Move to workout location on map click
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    // Event listener for resetting data
    resetButton.addEventListener("click", this.reset.bind(this));
  }

  // Get current position using geolocation API
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert("Please provide access to your geolocation!");
        // If geolocation is unavailable, load map with default coordinates
        const defaultPosition = {
          coords: {
            latitude: 51.505,
            longitude: -0.09,
          },
        };
        this._loadMap(defaultPosition);
      });
    }
  }

  // Load the map with user's coordinates or default position
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log("latitude:", latitude, "longitude:", longitude);

    this._map = L.map("map").setView([latitude, longitude], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    // Display form on map click
    this._map.on("click", this._showForm.bind(this));

    // Render existing workout markers on map
    this._workouts.forEach((workout) => {
      this._renderWorkMarker(workout);
    });
  }

  // Show workout form when map is clicked
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove("hidden");
    resetButton.classList.remove("reset-button--hidden");
    inputDistance.focus();
  }

  // Toggle between cadence and elevation fields based on workout type
  _toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // Create a new workout based on user input
  _newWorkout(event) {
    event.preventDefault();

    const validInput = (...inputs) =>
      inputs.every((input) => Number.isFinite(input) && input > 0);
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent.latlng;
    let workout;

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (!validInput(distance, duration, cadence)) {
        return alert("Please enter a integer !");
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (!validInput(distance, duration, elevation)) {
        return alert("Please enter a integer !");
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add workout to workouts array
    this._workouts.push(workout);

    // Render workout marker on the map
    this._renderWorkMarker(workout);

    // Render workout details in the UI
    this._renderWorkout(workout);

    // Hide the workout form
    this._hideForm();

    // Save workouts to local storage
    this._setLocalStorage();
  }

  // Render workout marker on the map
  _renderWorkMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.type} - ${
          workout.distance
        } km`
      )
      .openPopup();
  }

  // Hide the workout form after submission
  _hideForm() {
    form.classList.add("hidden");
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
  }

  // Render workout details in the list UI
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === "running") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">step</span>
          </div>
          </li>`;
    } else if (workout.type === "cycling") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  // Move to workout location on the map
  _moveToPopup(e) {
    const workoutEL = e.target.closest(".workout");
    if (!workoutEL) return;

    const workout = this._workouts.find(
      (workout) => workout.id === workoutEL.dataset.id
    );

    this._map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Save workouts to local storage
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }

  // Load workouts from local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this._workouts = data;
    this._workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  // Reset all data and reload the page
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

// Instantiate the app
const app = new App();
