const settings = require('electron-settings')
const myEmitter = require('./pubsub.js');
const settings2 = require('./settingsholder.js')

document.body.addEventListener('click', (event) => {
  if (event.target.dataset.section) {
    handleSectionTrigger(event)
  } else if (event.target.dataset.modal) {
    handleModalTrigger(event)
  } else if (event.target.classList.contains('modal-hide')) {
    hideAllModals()
  }
})

window.addEventListener('load', (event) => {
  // Default to the view that was active the last time the app was open
  const sectionId = settings2.checkAbout();
  if (sectionId != null) {
    showMainContent()
  } else {
    displayAbout()
  }
})

function manualSection (section) {
  hideAllSectionsAndDeselectButtons()
  const sectionId = section + "-section";
  const event_out = "show-" + sectionId;
  myEmitter.pubsub.emit(event_out, 'ping')
  var selector = document.querySelector('#' + sectionId);
  if(selector!=null)
    selector.classList.add('is-shown')
  else
    console.log(sectionId + " is an unknown section");
}

function handleSectionTrigger (event) {
  hideAllSectionsAndDeselectButtons()

  // Highlight clicked button and show view
  event.target.classList.add('is-selected')

  // Display the current section
  const sectionId = `${event.target.dataset.section}-section`


  // Save currently active button in localStorage
  const buttonId = event.target.getAttribute('id')
  settings.set('activeSectionButtonId', buttonId)
  console.log("Saving section id " + buttonId);
  // global notify
  const event_out = `show-${event.target.dataset.section}-section`;
  myEmitter.pubsub.emit(event_out, 'ping')

  document.getElementById(sectionId).classList.add('is-shown')


}


function showMainContent () {
  document.querySelector('.js-nav').classList.add('is-shown')
  document.querySelector('.js-content').classList.add('is-shown')
  manualSection("deposit");
}

function handleModalTrigger (event) {
  hideAllModals()
  const modalId = `${event.target.dataset.modal}-modal`
  document.getElementById(modalId).classList.add('is-shown')

  // global notify
  const event_out = `show-${event.target.dataset.modal}-modal`;
  console.log("ipcMain: firing " + event_out);
  myEmitter.pubsub.emit(event_out, 'ping')
}

function hideAllModals () {
  const modals = document.querySelectorAll('.modal.is-shown')
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove('is-shown')
  })
  showMainContent()
}

function hideAllSectionsAndDeselectButtons () {
  const sections = document.querySelectorAll('.js-section.is-shown')
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove('is-shown')
  })

  const buttons = document.querySelectorAll('.nav-button.is-selected')
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove('is-selected')
  })
}

function displayAbout () {
  document.querySelector('#about-modal').classList.add('is-shown')
  const event_out = `show-about-modal`;
  console.log("ipcMain: firing " + event_out);
  myEmitter.pubsub.emit(event_out, 'ping')
}



const workreader = require('./workreader.js');
workreader.loadDemos();
module.exports.manualSection = manualSection;