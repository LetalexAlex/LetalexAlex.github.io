document.addEventListener('DOMContentLoaded', function() {
  // Initialize a new SpeechSynthesisUtterance object named tts.
  let tts = new SpeechSynthesisUtterance();

  // Define a function to set the appropriate speech voice based on the language of the document.
  function setVoice() {
      // Retrieve an array of available voices.
      let speechvoices = window.speechSynthesis.getVoices();
      // Find the voice that matches the language of the document, or use the default voice if no match is found.
      tts.voice = speechvoices.find(voice => voice.lang.startsWith(document.documentElement.lang)) || speechvoices[0];
  }

  // Check if the speechSynthesis object supports the onvoiceschanged event.
  if (speechSynthesis.onvoiceschanged !== undefined) {
      // If supported, assign the setVoice function to be executed whenever the voiceschanged event is triggered.
      speechSynthesis.onvoiceschanged = setVoice;
  }

  // Function to read the content of the page.
  function readPageContent() {
      // Get the text content of the <main> element on the page.
      let pageContent = document.querySelector('main').textContent;
      // Set the text property of the tts object to the page content.
      tts.text = pageContent;
      // Initiate the speech synthesis process to read out the text.
      window.speechSynthesis.speak(tts);
  }

  // Create and add an event listener for the button to start reading the content.
  let readContentButton = document.getElementById('read');
  readContentButton.addEventListener('click', readPageContent);

  // Create and add an event listener for the button to stop reading the content.
  let stopReadingButton = document.getElementById('stop');
  stopReadingButton.addEventListener('click', function() {
      // Cancel the speech synthesis process.
      window.speechSynthesis.cancel();
  });
});