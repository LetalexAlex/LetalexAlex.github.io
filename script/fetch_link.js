document.querySelector("#form").addEventListener("submit", function(e) {
    e.preventDefault(); // evita il ricaricamento della pagina

    // creazione dell’oggetto XMLHttpRequest
    let xhr = new XMLHttpRequest();

    // definizione della funzione di callback
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) { // richiesta completata
            if (xhr.status === 200) {
                let pdfs = xhr.responseText.match(/https:\/\/isisfacchinetti\.edu\.it\/wp-content\/uploads\/2023\/10\/Orario-CLASSI-.+\.pdf/gm)
                console.log(pdfs)
                let pdfLink = pdfs[1];
                fetchPDF(pdfLink).then(res => {
                    document.querySelector("#risultato").innerHTML = res;
                    // TODO picone continua da qua :D - res contiene dati del file raw
                })

            } else {
                document.querySelector("#risultato").innerHTML = "Errore nella richiesta!";
            }
        }
    };
    
    xhr.open("GET", "https://nocors.letalexalexx.workers.dev/?url=https://isisfacchinetti.edu.it/documento/orario-delle-lezioni/")
    xhr.send();
    
});

async function fetchPDF(link) {
    try {
        let response = await fetch("https://nocors.letalexalexx.workers.dev/?url=" + link)
        if (!response.ok) {
            throw new Error(`Could not fetch pdf: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.log(error);
    }
}