document.addEventListener('DOMContentLoaded', function() {
    // Seleziona il bottone per la dark mode
    var darkModeButton = document.querySelector('.toggle-dark-mode');

    // Controlla se la preferenza per la dark mode è già stata salvata
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // Aggiungi un event listener al bottone
    darkModeButton.addEventListener('click', function() {
        // Aggiungi o rimuovi la classe dark-mode al body
        document.body.classList.toggle('dark-mode');

        // Salva la preferenza dell'utente
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.removeItem('darkMode');
        }
    });
});