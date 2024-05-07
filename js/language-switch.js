document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the button element with the id 'switch-lang'.
    var switchLangButton = document.getElementById('switch-lang');

    // Add an event listener to the 'switch-lang' button.
    switchLangButton.addEventListener('click', function() {
        // Get the current path of the window location.
        var currentPath = window.location.pathname;
        // Check if the current path includes '/ita/'.
        if (currentPath.includes('/ita/')) {
            // If it does, replace '/ita/' with '/en/' in the current path and navigate to the new path.
            window.location.pathname = currentPath.replace('/ita/', '/en/');
        } 
        // If the current path includes '/en/'.
        else if (currentPath.includes('/en/')) {
            // Replace '/en/' with '/ita/' in the current path and navigate to the new path.
            window.location.pathname = currentPath.replace('/en/', '/ita/');
        }
    });
});