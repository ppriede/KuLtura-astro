#!/usr/bin/env python3
"""Test the integrated KuLtura-astro calendario page."""

import sys, time
from playwright.sync_api import sync_playwright

URL = "http://localhost:4321/calendario/"

def test():
    results = {"passed": 0, "failed": 0, "checks": []}
    def check(name, ok, detail=""):
        if ok: results["passed"] += 1
        else: results["failed"] += 1
        results["checks"].append({"name": name, "ok": ok, "detail": detail})
        icon = "✅" if ok else "❌"
        print(f"  {icon} {name}" + (f" — {detail}" if detail else ""))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(URL, wait_until="networkidle", timeout=15000)
        time.sleep(1.5)

        # 1. Title
        title = page.title()
        check("Título de página", "Calendario" in title, title)

        # 2. Header with KuLtura branding (logo, theme toggle)
        logo = page.query_selector(".marca-logo")
        check("Logo KuLtura visible", logo is not None)

        # 3. Event count
        count = page.text_content("#event-count") or ""
        check("Conteo de eventos", count.isdigit() and int(count) > 100, f"{count} eventos")

        # 4. Source badges
        pt = page.text_content("#badge-portalticket") or ""
        coop = page.text_content("#badge-cooperativa") or ""
        check("Badge PortalTicket", "PortalTicket" in pt, pt)
        check("Badge Cooperativa", "Cooperativa" in coop, coop)

        # 5. FullCalendar rendered
        fc = page.query_selector(".fc")
        check("FullCalendar renderizado", fc is not None)

        # 6. Events on grid
        events = page.query_selector_all(".fc-event")
        check("Eventos en el grid", len(events) > 0, f"{len(events)} eventos")

        # 7. Weekly view button
        week_btn = page.query_selector("button:has-text('Semana')")
        check("Botón Semana", week_btn is not None)

        # 8. Lightbox
        first_event = page.query_selector(".fc-event")
        if first_event:
            first_event.click()
            time.sleep(0.5)
            overlay = page.query_selector(".lightbox-overlay.active")
            lb_title = page.text_content("#lb-title") or ""
            lb_venue = page.text_content("#lb-venue") or ""
            lb_link = page.get_attribute("#lb-link", "href") or ""
            check("Lightbox se abre", overlay is not None, lb_title[:40])
            check("Lightbox: venue", lb_venue != "", lb_venue[:40])
            check("Lightbox: link", lb_link.startswith("http"), lb_link[:60])
            # Close
            page.keyboard.press("Escape")
            time.sleep(0.3)
            check("Lightbox se cierra con Escape", not page.is_visible(".lightbox-overlay.active"), "")

        # 9. Footer
        footer = page.text_content("footer") or ""
        check("Footer visible", "KuLtura.cl" in footer, "")

        # Screenshot
        path = "/c/Users/pprie/OneDrive/DEV/KuLtura-astro/test_calendario_astro.png"
        page.screenshot(path=path, full_page=True)
        check("Screenshot guardado", True, path)

        browser.close()

    print(f"\n{'='*50}")
    print(f"📊 RESULTADOS: {results['passed']} pasaron, {results['failed']} fallaron")
    return results

if __name__ == "__main__":
    r = test()
    sys.exit(0 if r["failed"] == 0 else 1)