document.querySelector("#form").addEventListener("submit", handleFormSubmit);
document.addEventListener("DOMContentLoaded", initClassList);

function handleFormSubmit(e) {
    e.preventDefault(); // evita il ricaricamento della pagina

    fetchPageContent("https://isisfacchinetti.edu.it/documento/orario-delle-lezioni/")
        .then(extractPDFLinks)
        .then(getSecondPDF)
        .then(link => {
            const proxyUrl = "https://nocors.letalexalexx.workers.dev/?url=" + link;
            return extractAndOrganizeSchedule(proxyUrl)
                .then(schedule => {
                    showResult(schedule);
                    return schedule;
                });
        })
        .catch(showError);
}

// --- FUNZIONI DI SUPPORTO ---

function initClassList() {
    fetchPageContent("https://isisfacchinetti.edu.it/documento/orario-delle-lezioni/")
        .then(extractPDFLinks)
        .then(getSecondPDF)
        .then(link => {
            const proxyUrl = "https://nocors.letalexalexx.workers.dev/?url=" + link;
            return extractAndOrganizeSchedule(proxyUrl)
                .then(schedule => {
                    const dl = document.querySelector("#classi");
                    if (dl) {
                        dl.innerHTML = Object.keys(schedule)
                            .sort()
                            .map(c => `<option value="${c}"></option>`)
                            .join("");
                    }
                });
        })
        .catch(() => {});
}

// 1. Scarica la pagina HTML (usando il proxy CORS)
function fetchPageContent(url) {
    const proxyUrl = "https://nocors.letalexalexx.workers.dev/?url=" + url;
    return fetch(proxyUrl)
        .then(res => {
            if (!res.ok) throw new Error("Errore nel caricamento della pagina");
            return res.text();
        });
}

// 2. Estrae tutti i link ai PDF desiderati
function extractPDFLinks(html) {
    const regex = /https:\/\/isisfacchinetti\.edu\.it\/wp-content\/uploads\/2023\/10\/Orario-CLASSI-.+?\.pdf/gm;
    const pdfs = html.match(regex);
    if (!pdfs || pdfs.length === 0) throw new Error("Nessun PDF trovato!");
    return pdfs;
}

// 3. Prende il secondo PDF della lista (come nel tuo codice originale)
function getSecondPDF(pdfs) {
    if (pdfs.length < 2) throw new Error("Meno di due PDF trovati!");
    return pdfs[1];
}

// 4. Scarica il contenuto del PDF (in formato testo grezzo)
async function fetchPDF(link) {
    const proxyUrl = "https://nocors.letalexalexx.workers.dev/?url=" + link;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Errore nel fetch del PDF: ${response.status}`);
    return await response.text();
}

// 5. Mostra il risultato nel DOM
function showResult(result) {
    let strClasse = document.querySelector("#classe").value.trim().toUpperCase();
    if (!/^\d+[A-Z]+$/.test(strClasse)) {
        showError(new Error("Classe non valida. Usa numeri seguiti da lettere senza spazi (es. 1A, 3BC)."));
        return;
    }
    let strGiorno = document.querySelector("#giorno").value;
    let strOra = document.querySelector("#ora").value;
    let intOra = Number.parseInt(/([0-9]+)h00/.exec(strOra)[0]);
    let JSONclasse = result[strClasse][strGiorno][strOra];
    if(!JSONclasse) {
        intOra++;
        JSONclasse = result[strClasse][strGiorno][`${intOra}h00`];
    }
    console.log(JSONclasse);
    if(JSONclasse) {
        document.querySelector("#aula").innerHTML = JSONclasse.aula;
        document.querySelector("#materia").innerHTML = JSONclasse.materia;
        document.querySelector("#risultato").innerHTML = JSON.stringify(JSONclasse);
    }
    else {
        document.querySelector("#aula").innerHTML = "";
        document.querySelector("#materia").innerHTML = "";
        document.querySelector("#risultato").innerHTML = "<strong>La classe esce alle 14!</strong>"
    }

}

// 6. Gestione errori
function showError(error) {
    console.error(error);
    document.querySelector("#risultato").innerHTML = "Errore: " + error.message;
}
