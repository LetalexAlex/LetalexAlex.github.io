if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';
}

const daysOfWeek = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì']; 

async function extractAndOrganizeSchedule(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  // Data structure: classe -> giorno -> orario -> { materia, classe }
  const scheduleJson = {};

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract text items with positions
    let pageItems = textContent.items.map(item => ({
      str: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5]
    }));

    // Example approach to organize text items:
    // - Identify classes (likely appearing in a column or header row)
    // - Identify days (likely column headers)
    // - Identify time slots (orari)
    // - Map materia to classe, giorno, orario based on x,y grouping rules

    // This parsing part is highly dependent on your specific PDF structure.
    // Here is a simplified example assuming:
    // - class names appear in first column area (x < some threshold)
    // - days appear as header row with known y range
    // - time slots appear in first row or a known y range
    // - materia appears in grid cells identified by aligning x,y ranges

    // Group by y to approximate rows
    const rows = groupByYAxis(pageItems, 5); // group items whose y positions differ <=5 units

    // Detect day columns across the page
    const dayColumns = detectDayColumns(pageItems);

    // Detect hour rows across the page
    const hourRows = detectHourRows(pageItems);

    let currentClasse = null;

    for (let i = 0; i < rows.length; i++) {
      const rowItems = rows[i];

      // Detect class header like "3FEN ..." and set current class context
      const header = rowItems.map(r => r.str).join(' ');
      const clsMatch = header.match(/\b([1-5][A-Z]{2,4})\b/);
      if (clsMatch) {
        currentClasse = clsMatch[1];
        if (!scheduleJson[currentClasse]) scheduleJson[currentClasse] = {};
      }

      if (!currentClasse) continue;

      for (const item of rowItems) {
        if (!isSubjectCandidate(item.str)) continue;

        const day = nearestDay(item.x, dayColumns);
        if (!day) continue;
        if (!scheduleJson[currentClasse][day]) scheduleJson[currentClasse][day] = {};

        const hour = nearestHour(item.y, hourRows);
        if (!hour) continue;

        const aula = nearestLocation(item, rows, i);

        scheduleJson[currentClasse][day][hour] = {
          materia: item.str,
          aula: aula || null
        };
      }
    }
  }
  mergeDoublePeriods(scheduleJson);
  return scheduleJson;
}

// Helper function to group items by close y positions within threshold (units)
function groupByYAxis(items, threshold) {
  items.sort((a, b) => b.y - a.y);
  const groups = [];
  for (const item of items) {
    let foundGroup = false;
    for (const group of groups) {
      if (Math.abs(group[0].y - item.y) <= threshold) {
        group.push(item);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) groups.push([item]);
  }
  return groups;
}

function detectDayColumns(items) {
  const buckets = {};
  for (const it of items) {
    if (daysOfWeek.includes(it.str)) {
      if (!buckets[it.str]) buckets[it.str] = [];
      buckets[it.str].push(it.x);
    }
  }
  const result = [];
  for (const d of daysOfWeek) {
    if (buckets[d] && buckets[d].length) {
      const avgX = buckets[d].reduce((a, b) => a + b, 0) / buckets[d].length;
      result.push({ day: d, x: avgX });
    }
  }
  return result.sort((a, b) => a.x - b.x);
}

function detectHourRows(items) {
  const timeRe = /^([0-1]?\d|2[0-3])h00$/;
  const labels = items.filter(it => timeRe.test(it.str));
  const rows = [];
  for (const l of labels) {
    const y = l.y;
    let grp = rows.find(g => Math.abs(g.y - y) <= 5);
    if (!grp) {
      grp = { y, label: l.str };
      rows.push(grp);
    }
  }
  rows.sort((a, b) => b.y - a.y);
  return rows; // [{label, y}] top->bottom
}

function nearestDay(x, dayColumns) {
  if (!dayColumns.length) return null;
  let best = null, bestDx = Infinity;
  for (const d of dayColumns) {
    const dx = Math.abs(d.x - x);
    if (dx < bestDx) { bestDx = dx; best = d.day; }
  }
  return best;
}

function nearestHour(y, hourRows) {
  if (!hourRows.length) return null;
  let best = null, bestDy = Infinity;
  for (const hr of hourRows) {
    const dy = Math.abs(hr.y - y);
    if (dy < bestDy) { bestDy = dy; best = hr.label; }
  }
  return best;
}

function isSubjectCandidate(str) {
  if (!str) return false;
  if (daysOfWeek.includes(str)) return false;
  if (/^([0-1]?\d|2[0-3])h00$/.test(str)) return false;
  if (str.includes('©')) return false;
  if (/\b(ITIS|IPSIA|Lab\.)\b/.test(str)) return false;
  if (/^[A-Z][a-zÀ-ÖØ-öø-ÿ]+\s+[A-Z]\./.test(str)) return false;
  return true;
}

function nearestLocation(subjectItem, rows, rowIndex) {
  const locRe = /(ITIS|IPSIA|Lab\.)/;
  let best = null;
  let bestDist = Infinity;
  const collect = [];
  for (let k = Math.max(0, rowIndex - 2); k <= Math.min(rows.length - 1, rowIndex + 2); k++) {
    for (const it of rows[k]) {
      if (locRe.test(it.str)) collect.push(it);
    }
  }
  for (const it of collect) {
    const dx = Math.abs(it.x - subjectItem.x);
    const dy = Math.abs(it.y - subjectItem.y);
    const dist = Math.hypot(dx, dy);
    if (dx <= 200 && dy <= 120 && dist < bestDist) {
      best = it.str;
      bestDist = dist;
    }
  }
  if (!best) {
    for (const row of rows) {
      for (const it of row) {
        if (!locRe.test(it.str)) continue;
        const dist = Math.hypot(it.x - subjectItem.x, it.y - subjectItem.y);
        if (dist < bestDist) { best = it.str; bestDist = dist; }
      }
    }
  }
  return best;
}

function mergeDoublePeriods(schedule) {
  const order = ['8h00','9h00','10h00','11h00','12h00','13h00','14h00','15h00'];
  const nextHour = (h) => {
    const idx = order.indexOf(h);
    return idx >= 0 && idx + 1 < order.length ? order[idx + 1] : null;
  };
  for (const classe of Object.keys(schedule)) {
    for (const day of Object.keys(schedule[classe])) {
      const entries = schedule[classe][day];
      const merged = {};
      let i = 0;
      while (i < order.length) {
        const h = order[i];
        const e = entries[h];
        if (!e) { i++; continue; }
        let j = i + 1;
        while (j < order.length) {
          const hj = order[j];
          const ej = entries[hj];
          if (ej && ej.materia === e.materia && ej.aula === e.aula) { j++; } else { break; }
        }
        if (j - i > 1) {
          const endLabel = order[j] || nextHour(order[j - 1]) || order[j - 1];
          const key = `${h}-${endLabel}`;
          merged[key] = { materia: e.materia, aula: e.aula || null };
        } else {
          merged[h] = { materia: e.materia, aula: e.aula || null };
        }
        i = j;
      }
      schedule[classe][day] = merged;
    }
  }
}

extractAndOrganizeSchedule("https://nocors.letalexalexx.workers.dev/?url=https://isisfacchinetti.edu.it/wp-content/uploads/2023/10/Orario-CLASSI-nona-settimana.pdf").then(schedule => {
  console.log(JSON.stringify(schedule, null, 2));
  //const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: 'application/json' });
  //const url = URL.createObjectURL(blob);
  //URL.revokeObjectURL(url);
});


