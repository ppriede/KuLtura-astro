// ─── Colors by source ───
const SOURCE_COLORS = {
  'PortalTicket': '#c96a5e',
  'Cooperativa': '#7ec8e3',
};

function eventColor(event) {
  const src = event.extendedProps.source || 'Cooperativa';
  return SOURCE_COLORS[src] || '#7ec8e3';
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Lightbox ───
const lbOverlay = document.getElementById('lightbox');

function openLightbox(event) {
  const ext = event.extendedProps || {};
  const src = ext.source || 'Cooperativa';
  document.getElementById('lb-title').textContent = event.title;
  document.getElementById('lb-date').textContent = ext.date_label || formatDate(event.start);
  document.getElementById('lb-venue').textContent = ext.venue || '—';
  document.getElementById('lb-link').href = event.url || ext.url || '#';
  const badge = document.getElementById('lb-category');
  badge.textContent = src;
  badge.className = 'category ' + (src === 'PortalTicket' ? 'portalticket' : 'cooperativa');
  lbOverlay.classList.add('active');
}

function closeLightbox(ev) {
  if (ev && ev.target !== lbOverlay) return;
  lbOverlay.classList.remove('active');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') lbOverlay.classList.remove('active'); });

// ─── Init FullCalendar ───
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  const calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'es',
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,listMonth'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      list: 'Lista'
    },
    noEventsText: 'No hay eventos en este período',
    dayMaxEvents: true,
    moreLinkText: (n) => `+${n} más`,
    events: function(fetchInfo, successCallback, failureCallback) {
      fetch('/eventos.json')
        .then(r => r.json())
        .then(data => {
          document.getElementById('event-count').textContent = data.total_events || 0;
          let ptCount = 0, coopCount = 0;
          if (data.events) {
            for (const e of data.events) {
              if (e.source === 'PortalTicket') ptCount++;
              else coopCount++;
            }
          }
          document.getElementById('badge-portalticket').textContent = `PortalTicket ${ptCount}`;
          document.getElementById('badge-cooperativa').textContent = `Cooperativa ${coopCount}`;
          successCallback(data.events);
        })
        .catch(err => {
          document.getElementById('event-count').textContent = '⚠ error';
          failureCallback(err);
        });
    },
    eventDidMount: function(info) {
      info.el.style.backgroundColor = eventColor(info.event);
      info.el.style.borderColor = 'transparent';
    },
    eventClick: function(info) {
      info.jsEvent.preventDefault();
      openLightbox(info.event);
    }
  });
  calendar.render();
});